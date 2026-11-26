import { getRedisClient } from '../config/redis';
import { AppError } from '../core/errors/AppError';

export type AuthRateScope =
  | 'reg_email_send'
  | 'reg_email_verify'
  | 'forgot_password'
  | 'profile_email_send'
  | 'profile_email_verify';

const SEND_COOLDOWN_SEC = Number(process.env.AUTH_EMAIL_SEND_COOLDOWN_SEC ?? 60);
const EMAIL_HOURLY_MAX = Number(process.env.AUTH_EMAIL_HOURLY_MAX ?? 5);
const IP_HOURLY_SEND_MAX = Number(process.env.AUTH_IP_HOURLY_SEND_MAX ?? 15);
const IP_DISTINCT_EMAILS_MAX = Number(process.env.AUTH_IP_DISTINCT_EMAILS_MAX ?? 10);
const VERIFY_FAIL_MAX = Number(process.env.AUTH_VERIFY_FAIL_MAX ?? 5);
const VERIFY_LOCK_SEC = Number(process.env.AUTH_VERIFY_LOCK_SEC ?? 15 * 60);
const VERIFY_IP_HOURLY_MAX = Number(process.env.AUTH_VERIFY_IP_HOURLY_MAX ?? 30);
const FORGOT_EMAIL_HOURLY_MAX = Number(process.env.AUTH_FORGOT_EMAIL_HOURLY_MAX ?? 3);

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

async function getCount(key: string): Promise<number> {
  const value = await getRedisClient().get(key);
  return value ? Number.parseInt(value, 10) : 0;
}

async function incrWithTtl(key: string, ttlSec: number): Promise<number> {
  const redis = getRedisClient();
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, ttlSec);
  }
  return count;
}

export async function assertCanSendEmailCode(
  scope: AuthRateScope,
  email: string,
  ip: string,
): Promise<void> {
  const redis = getRedisClient();
  const normalizedEmail = normalizeEmail(email);
  const safeIp = ip || 'unknown';

  const cooldownKey = `auth:rl:cooldown:${scope}:${normalizedEmail}`;
  if (await redis.get(cooldownKey)) {
    throw new AppError(429, 'Please wait before requesting another code.');
  }

  const emailHourlyMax = scope === 'forgot_password' ? FORGOT_EMAIL_HOURLY_MAX : EMAIL_HOURLY_MAX;
  const emailHourKey = `auth:rl:email_hour:${scope}:${normalizedEmail}`;
  const emailCount = await getCount(emailHourKey);
  if (emailCount >= emailHourlyMax) {
    throw new AppError(429, 'Too many requests for this email. Please try again later.');
  }

  const ipHourKey = `auth:rl:ip_hour:${scope}:${safeIp}`;
  const ipCount = await getCount(ipHourKey);
  if (ipCount >= IP_HOURLY_SEND_MAX) {
    throw new AppError(429, 'Too many requests from your network. Please try again later.');
  }

  if (scope === 'reg_email_send' || scope === 'forgot_password') {
    const distinctKey = `auth:rl:ip_emails:${scope}:${safeIp}`;
    const isKnownEmail = await redis.sismember(distinctKey, normalizedEmail);
    if (!isKnownEmail) {
      const distinctCount = await redis.scard(distinctKey);
      if (distinctCount >= IP_DISTINCT_EMAILS_MAX) {
        throw new AppError(429, 'Too many different emails requested from your network. Please try again later.');
      }
    }
  }
}

export async function recordEmailCodeSent(scope: AuthRateScope, email: string, ip: string): Promise<void> {
  const redis = getRedisClient();
  const normalizedEmail = normalizeEmail(email);
  const safeIp = ip || 'unknown';

  await redis.set(`auth:rl:cooldown:${scope}:${normalizedEmail}`, '1', 'EX', SEND_COOLDOWN_SEC);
  await incrWithTtl(`auth:rl:email_hour:${scope}:${normalizedEmail}`, 3600);
  await incrWithTtl(`auth:rl:ip_hour:${scope}:${safeIp}`, 3600);

  if (scope === 'reg_email_send' || scope === 'forgot_password') {
    const distinctKey = `auth:rl:ip_emails:${scope}:${safeIp}`;
    await redis.sadd(distinctKey, normalizedEmail);
    await redis.expire(distinctKey, 3600);
  }
}

export async function assertCanVerifyCode(scope: AuthRateScope, email: string, ip: string): Promise<void> {
  const redis = getRedisClient();
  const normalizedEmail = normalizeEmail(email);
  const safeIp = ip || 'unknown';

  const lockKey = `auth:rl:verify_lock:${scope}:${normalizedEmail}`;
  if (await redis.get(lockKey)) {
    throw new AppError(429, 'Too many failed attempts. Please request a new verification code.');
  }

  const ipHourKey = `auth:rl:verify_ip:${scope}:${safeIp}`;
  const ipCount = await getCount(ipHourKey);
  if (ipCount >= VERIFY_IP_HOURLY_MAX) {
    throw new AppError(429, 'Too many verification attempts from your network. Please try again later.');
  }
}

export async function recordVerifyAttempt(scope: AuthRateScope, email: string, ip: string): Promise<void> {
  await incrWithTtl(`auth:rl:verify_ip:${scope}:${ip || 'unknown'}`, 3600);
}

export async function recordVerifyFailure(scope: AuthRateScope, email: string): Promise<boolean> {
  const redis = getRedisClient();
  const normalizedEmail = normalizeEmail(email);
  const failKey = `auth:rl:verify_fail:${scope}:${normalizedEmail}`;
  const fails = await incrWithTtl(failKey, VERIFY_LOCK_SEC);

  if (fails >= VERIFY_FAIL_MAX) {
    await redis.set(`auth:rl:verify_lock:${scope}:${normalizedEmail}`, '1', 'EX', VERIFY_LOCK_SEC);
    await redis.del(failKey);
    return true;
  }

  return false;
}

export async function clearVerifyFailures(scope: AuthRateScope, email: string): Promise<void> {
  const redis = getRedisClient();
  const normalizedEmail = normalizeEmail(email);
  await redis.del(`auth:rl:verify_fail:${scope}:${normalizedEmail}`);
}

export function getRequestIp(req: { ip?: string }): string {
  return req.ip ?? 'unknown';
}
