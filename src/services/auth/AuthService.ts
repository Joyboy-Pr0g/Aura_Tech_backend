import { injectable, inject } from 'tsyringe';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { IAuthRepository, SafeUser } from '../../interfaces/repositories/IAuthRepository';
import { AppError } from '../../core/errors/AppError';
import { hashPassword, comparePassword, generatePassword } from '../../utils/password';
import { generateToken, getTokenRemainingTtl } from '../../utils/jwt';
import { getRedisClient } from '../../config/redis';
import { Role, UserStatus } from '../../types/rbac';
import { User } from '../../models/User';
import { generateVerificationCode } from '../../utils/verificationCode';
import { sendEmailChangeVerificationCode, sendEmailVerificationCode, sendPasswordResetEmail } from '../mail/emailService';
import {
  assertCanSendEmailCode,
  assertCanVerifyCode,
  clearVerifyFailures,
  recordEmailCodeSent,
  recordVerifyAttempt,
  recordVerifyFailure,
} from '../../utils/authRateLimit';
import { UserActivityMonitorService } from '../security/UserActivityMonitorService';

const EMAIL_CODE_TTL_SEC = 15 * 60;
const EMAIL_VERIFIED_TTL_SEC = 30 * 60;

function emailChangeCodeKey(userId: string, email: string): string {
  return `email_change_code:${userId}:${email.toLowerCase()}`;
}

function emailChangeVerifiedKey(userId: string, email: string): string {
  return `email_change_verified:${userId}:${email.toLowerCase()}`;
}

function registrationCodeKey(email: string): string {
  return `registration_code:${email.toLowerCase()}`;
}

function registrationVerifiedKey(email: string): string {
  return `registration_verified:${email.toLowerCase()}`;
}
@injectable()
export class AuthService {
  constructor(
    @inject(REPOSITORY_TOKENS.IAuthRepository)
    private authRepo: IAuthRepository,
    @inject(UserActivityMonitorService)
    private activityMonitor: UserActivityMonitorService,
  ) { }

  private async assertRedisAvailable(): Promise<void> {
    try {
      const redis = getRedisClient();
      await redis.ping();
    } catch {
      throw new AppError(503, 'Verification service temporarily unavailable');
    }
  }

  async sendEmailVerificationCode(userId: string, email: string, clientIp?: string): Promise<void> {
    const user = await this.authRepo.findById(userId);
    if (!user || user.deleted_at) throw new AppError(404, 'User not found');

    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail === user.email.toLowerCase()) {
      throw new AppError(400, 'New email must be different from your current email');
    }

    const existingEmail = await this.authRepo.findByEmail(normalizedEmail);
    if (existingEmail && existingEmail.id !== userId) {
      throw new AppError(409, 'Email is already registered');
    }

    await this.assertRedisAvailable();
    await assertCanSendEmailCode('profile_email_send', normalizedEmail, clientIp ?? 'unknown');

    const code = generateVerificationCode();
    const redis = getRedisClient();
    const codeKey = emailChangeCodeKey(userId, normalizedEmail);
    const verifiedKey = emailChangeVerifiedKey(userId, normalizedEmail);

    await redis.set(codeKey, code, 'EX', EMAIL_CODE_TTL_SEC);
    await redis.del(verifiedKey);

    const sent = await sendEmailChangeVerificationCode(normalizedEmail, code, user.full_name);
    if (!sent) {
      throw new AppError(500, 'Failed to send verification email');
    }

    await recordEmailCodeSent('profile_email_send', normalizedEmail, clientIp ?? 'unknown');
  }

  async verifyEmailChangeCode(userId: string, email: string, code: string, clientIp?: string): Promise<void> {
    const user = await this.authRepo.findById(userId);
    if (!user || user.deleted_at) throw new AppError(404, 'User not found');

    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail === user.email.toLowerCase()) {
      throw new AppError(400, 'New email must be different from your current email');
    }

    await this.assertRedisAvailable();
    await assertCanVerifyCode('profile_email_verify', normalizedEmail, clientIp ?? 'unknown');
    await recordVerifyAttempt('profile_email_verify', normalizedEmail, clientIp ?? 'unknown');

    const redis = getRedisClient();
    const codeKey = emailChangeCodeKey(userId, normalizedEmail);
    const storedCode = await redis.get(codeKey);

    if (!storedCode) {
      throw new AppError(400, 'Verification code expired or not found. Please request a new one.');
    }

    if (storedCode !== code.trim()) {
      const locked = await recordVerifyFailure('profile_email_verify', normalizedEmail);
      if (locked) {
        await redis.del(codeKey);
      }
      throw new AppError(400, 'Invalid verification code');
    }

    const verifiedKey = emailChangeVerifiedKey(userId, normalizedEmail);
    await redis.set(verifiedKey, '1', 'EX', EMAIL_VERIFIED_TTL_SEC);
    await redis.del(codeKey);
    await clearVerifyFailures('profile_email_verify', normalizedEmail);
  }

  private async isEmailChangeVerified(userId: string, email: string): Promise<boolean> {
    try {
      const redis = getRedisClient();
      const verified = await redis.get(emailChangeVerifiedKey(userId, email.toLowerCase().trim()));
      return verified === '1';
    } catch {
      return false;
    }
  }

  private async clearEmailChangeVerified(userId: string, email: string): Promise<void> {
    try {
      const redis = getRedisClient();
      await redis.del(emailChangeVerifiedKey(userId, email.toLowerCase().trim()));
    } catch {
      // non-critical cleanup
    }
  }

  async sendRegistrationEmailVerificationCode(email: string, clientIp?: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();

    if (await this.authRepo.existsByEmail(normalizedEmail)) {
      throw new AppError(409, 'Email is already registered');
    }

    await this.assertRedisAvailable();
    await assertCanSendEmailCode('reg_email_send', normalizedEmail, clientIp ?? 'unknown');

    const code = generateVerificationCode();
    const redis = getRedisClient();
    const codeKey = registrationCodeKey(normalizedEmail);
    const verifiedKey = registrationVerifiedKey(normalizedEmail);

    await redis.set(codeKey, code, 'EX', EMAIL_CODE_TTL_SEC);
    await redis.del(verifiedKey);

    const displayName = normalizedEmail.split('@')[0] || 'there';
    const sent = await sendEmailVerificationCode(normalizedEmail, code, displayName);
    if (!sent) {
      throw new AppError(500, 'Failed to send verification email');
    }

    await recordEmailCodeSent('reg_email_send', normalizedEmail, clientIp ?? 'unknown');
  }

  async verifyRegistrationEmailCode(email: string, code: string, clientIp?: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();

    if (await this.authRepo.existsByEmail(normalizedEmail)) {
      throw new AppError(409, 'Email is already registered');
    }

    await this.assertRedisAvailable();
    await assertCanVerifyCode('reg_email_verify', normalizedEmail, clientIp ?? 'unknown');
    await recordVerifyAttempt('reg_email_verify', normalizedEmail, clientIp ?? 'unknown');

    const redis = getRedisClient();
    const codeKey = registrationCodeKey(normalizedEmail);
    const storedCode = await redis.get(codeKey);

    if (!storedCode) {
      throw new AppError(400, 'Verification code expired or not found. Please request a new one.');
    }

    if (storedCode !== code.trim()) {
      const locked = await recordVerifyFailure('reg_email_verify', normalizedEmail);
      if (locked) {
        await redis.del(codeKey);
      }
      throw new AppError(400, 'Invalid verification code');
    }

    const verifiedKey = registrationVerifiedKey(normalizedEmail);
    await redis.set(verifiedKey, '1', 'EX', EMAIL_VERIFIED_TTL_SEC);
    await redis.del(codeKey);
    await clearVerifyFailures('reg_email_verify', normalizedEmail);
  }

  private async isRegistrationEmailVerified(email: string): Promise<boolean> {
    try {
      const redis = getRedisClient();
      const verified = await redis.get(registrationVerifiedKey(email.toLowerCase().trim()));
      return verified === '1';
    } catch {
      return false;
    }
  }

  private async clearRegistrationVerified(email: string): Promise<void> {
    try {
      const redis = getRedisClient();
      await redis.del(registrationVerifiedKey(email.toLowerCase().trim()));
    } catch {
      // non-critical cleanup
    }
  }

  async assertRegistrationEmailVerified(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    if (!(await this.isRegistrationEmailVerified(normalizedEmail))) {
      throw new AppError(400, 'Email must be verified before registration');
    }
  }

  async consumeRegistrationEmailVerification(email: string): Promise<void> {
    await this.clearRegistrationVerified(email);
  }

  async register(data: {
    full_name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ token: string; user: SafeUser }> {
    const normalizedEmail = data.email.toLowerCase().trim();

    if (!(await this.isRegistrationEmailVerified(normalizedEmail))) {
      throw new AppError(400, 'Email must be verified before registration');
    }

    if (await this.authRepo.existsByEmail(normalizedEmail)) {
      throw new AppError(409, 'Email is already registered');
    }

    if (data.phone && await this.authRepo.existsByPhone(data.phone)) {
      throw new AppError(409, 'Phone number is already registered');
    }

    const user = await this.authRepo.create({
      full_name: data.full_name,
      email: normalizedEmail,
      password_hash: await hashPassword(data.password),
      phone: data.phone ?? null,
      role: Role.CUSTOMER,
    });

    await this.clearRegistrationVerified(normalizedEmail);

    const token = generateToken({ user_id: user.id, email: user.email, role: user.role });
    return { token, user: this.sanitize(user) };
  }

  async login(data: {
    email: string;
    password: string;
  }): Promise<{ token: string; user: SafeUser }> {
    const user = await this.authRepo.findByEmailWithPassword(data.email);
    if (!user) throw new AppError(401, 'Invalid credentials');

    if (user.status === UserStatus.BLOCKED) {
      throw new AppError(403, 'Your account has been blocked. Contact support.');
    }

    if (!(await comparePassword(data.password, user.password_hash))) {
      throw new AppError(401, 'Invalid credentials');
    }

    const token = generateToken({ user_id: user.id, email: user.email, role: user.role });
    return { token, user: this.sanitize(user) };
  }

  async logout(token: string): Promise<void> {
    const ttl = getTokenRemainingTtl(token);
    if (ttl > 0) {
      try {
        await getRedisClient().set(`blacklist:${token}`, '1', 'EX', ttl);
      } catch {
        console.warn('[auth] Redis unavailable — token not blacklisted');
      }
    }
  }

  async getMe(userId: string): Promise<SafeUser> {
    const user = await this.authRepo.findById(userId);
    if (!user) throw new AppError(404, 'User not found');
    return this.sanitize(user);
  }

  async updateProfile(
    userId: string,
    data: { full_name: string; email: string; phone: string },
  ): Promise<SafeUser> {
    const user = await this.authRepo.findById(userId);
    if (!user || user.deleted_at) throw new AppError(404, 'User not found');

    const normalizedEmail = data.email.toLowerCase().trim();

    if (normalizedEmail !== user.email.toLowerCase()) {
      const verified = await this.isEmailChangeVerified(userId, normalizedEmail);
      if (!verified) {
        throw new AppError(400, 'Email must be verified before updating your profile');
      }

      const existingEmail = await this.authRepo.findByEmail(normalizedEmail);
      if (existingEmail && existingEmail.id !== userId) {
        throw new AppError(409, 'Email is already registered');
      }
    }

    if (data.phone !== user.phone) {
      const existingPhone = await this.authRepo.findByPhone(data.phone);
      if (existingPhone && existingPhone.id !== userId) {
        throw new AppError(409, 'Phone number is already registered');
      }
    }

    const updated = await this.authRepo.update(userId, {
      full_name: data.full_name,
      email: normalizedEmail,
      phone: data.phone,
    });
    if (!updated) throw new AppError(404, 'User not found');

    if (normalizedEmail !== user.email.toLowerCase()) {
      await this.clearEmailChangeVerified(userId, normalizedEmail);
    }

    void this.activityMonitor.recordActivity(userId, 'profile_update');
    return this.sanitize(updated);
  }

  async changePassword(
    userId: string,
    data: { current_password: string; new_password: string },
  ): Promise<void> {
    const user = await this.authRepo.findByIdWithPassword(userId);
    if (!user || user.deleted_at) throw new AppError(404, 'User not found');

    if (!(await comparePassword(data.current_password, user.password_hash))) {
      throw new AppError(401, 'Current password is incorrect');
    }

    await this.authRepo.resetPassword(userId, await hashPassword(data.new_password));
    void this.activityMonitor.recordActivity(userId, 'password_change');
  }

  async resetPassword(email: string, password: string): Promise<void> {
    const user = await this.authRepo.findByEmail(email);
    if (!user || user.deleted_at) throw new AppError(404, 'User not found');

    try {
      const password_hash = await hashPassword(password);
      await this.authRepo.resetPassword(user.id, password_hash);
    } catch (err) {
      throw new AppError(500, 'Failed to reset password');
    }

    try {
      await sendPasswordResetEmail(user.email, password, user.full_name);
    } catch (err) {
      throw new AppError(500, 'Failed to send password reset email');
    }
  }

  async requestPasswordReset(email: string, clientIp?: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    await assertCanSendEmailCode('forgot_password', normalizedEmail, clientIp ?? 'unknown');

    const user = await this.authRepo.findByEmail(normalizedEmail);

    if (
      !user
      || user.deleted_at
      || user.role !== Role.CUSTOMER
      || user.status === UserStatus.BLOCKED
    ) {
      await recordEmailCodeSent('forgot_password', normalizedEmail, clientIp ?? 'unknown');
      return;
    }

    const password = generatePassword();
    await this.resetPassword(normalizedEmail, password);
    await recordEmailCodeSent('forgot_password', normalizedEmail, clientIp ?? 'unknown');
  }

  private sanitize(user: User): SafeUser {
    const { password_hash, ...safe } = user;
    return safe;
  }
}
