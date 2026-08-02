import { inject, injectable } from 'tsyringe';
import { getRedisClient } from '../../config/redis';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { IAuthRepository } from '../../interfaces/repositories/IAuthRepository';
import { ISuspiciousUserRepository } from '../../interfaces/repositories/ISuspiciousUserRepository';
import {
  SuspiciousActivitySignals,
  SuspiciousReportCategory,
} from '../../models/SuspiciousUserReport';
import { Role } from '../../types/rbac';

export type UserActivityType =
  | 'profile_update'
  | 'password_change'
  | 'address_change'
  | 'order_placed'
  | 'order_cancelled'
  | 'refund_requested';

const PROFILE_UPDATES_DAY = Number(process.env.SUSPICIOUS_PROFILE_UPDATES_DAY ?? 3);
const PASSWORD_CHANGES_DAY = Number(process.env.SUSPICIOUS_PASSWORD_CHANGES_DAY ?? 2);
const ADDRESS_CHANGES_DAY = Number(process.env.SUSPICIOUS_ADDRESS_CHANGES_DAY ?? 4);
const ORDERS_PLACED_DAY = Number(process.env.SUSPICIOUS_ORDERS_PLACED_DAY ?? 5);
const ORDERS_CANCELLED_WEEK = Number(process.env.SUSPICIOUS_ORDERS_CANCELLED_WEEK ?? 3);
const REFUND_REQUESTS_WEEK = Number(process.env.SUSPICIOUS_REFUND_REQUESTS_WEEK ?? 2);

@injectable()
export class UserActivityMonitorService {
  constructor(
    @inject(REPOSITORY_TOKENS.ISuspiciousUserRepository)
    private suspiciousRepo: ISuspiciousUserRepository,
    @inject(REPOSITORY_TOKENS.IAuthRepository)
    private authRepo: IAuthRepository,
  ) {}

  async recordActivity(userId: string, activity: UserActivityType): Promise<void> {
    try {
      const user = await this.authRepo.findById(userId);
      if (!user || user.deleted_at || user.role !== Role.CUSTOMER) {
        return;
      }

      await this.incrementActivity(userId, activity);
      await this.evaluateUser(userId);
    } catch (err) {
      console.warn('[suspicious-user] activity monitor failed:', err);
    }
  }

  private dayKey(userId: string, activity: UserActivityType): string {
    const day = new Date().toISOString().slice(0, 10);
    return `user:activity:${userId}:${activity}:${day}`;
  }

  private weekKey(userId: string, activity: UserActivityType): string {
    const now = new Date();
    const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
    const week = weekStart.toISOString().slice(0, 10);
    return `user:activity:${userId}:${activity}:week:${week}`;
  }

  private async incrementActivity(userId: string, activity: UserActivityType): Promise<void> {
    const redis = getRedisClient();
    const key = activity === 'order_cancelled' || activity === 'refund_requested'
      ? this.weekKey(userId, activity)
      : this.dayKey(userId, activity);
    const ttl = activity === 'order_cancelled' || activity === 'refund_requested' ? 8 * 24 * 3600 : 2 * 24 * 3600;
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, ttl);
    }
  }

  private async getCount(userId: string, activity: UserActivityType, window: 'day' | 'week'): Promise<number> {
    const redis = getRedisClient();
    const key = window === 'week'
      ? this.weekKey(userId, activity)
      : this.dayKey(userId, activity);
    const value = await redis.get(key);
    return value ? Number.parseInt(value, 10) : 0;
  }

  private async collectSignals(userId: string): Promise<SuspiciousActivitySignals> {
    return {
      profile_updates_24h: await this.getCount(userId, 'profile_update', 'day'),
      password_changes_24h: await this.getCount(userId, 'password_change', 'day'),
      address_changes_24h: await this.getCount(userId, 'address_change', 'day'),
      orders_placed_24h: await this.getCount(userId, 'order_placed', 'day'),
      orders_cancelled_7d: await this.getCount(userId, 'order_cancelled', 'week'),
      refund_requests_7d: await this.getCount(userId, 'refund_requested', 'week'),
    };
  }

  private buildSummary(signals: SuspiciousActivitySignals): string {
    const parts: string[] = [];
    if ((signals.profile_updates_24h ?? 0) >= PROFILE_UPDATES_DAY) {
      parts.push(`${signals.profile_updates_24h} profile updates in 24h`);
    }
    if ((signals.password_changes_24h ?? 0) >= PASSWORD_CHANGES_DAY) {
      parts.push(`${signals.password_changes_24h} password changes in 24h`);
    }
    if ((signals.address_changes_24h ?? 0) >= ADDRESS_CHANGES_DAY) {
      parts.push(`${signals.address_changes_24h} address changes in 24h`);
    }
    if ((signals.orders_placed_24h ?? 0) >= ORDERS_PLACED_DAY) {
      parts.push(`${signals.orders_placed_24h} orders placed in 24h`);
    }
    if ((signals.orders_cancelled_7d ?? 0) >= ORDERS_CANCELLED_WEEK) {
      parts.push(`${signals.orders_cancelled_7d} cancelled orders in 7 days`);
    }
    if ((signals.refund_requests_7d ?? 0) >= REFUND_REQUESTS_WEEK) {
      parts.push(`${signals.refund_requests_7d} refund requests in 7 days`);
    }
    return parts.join('; ');
  }

  private resolveCategory(signals: SuspiciousActivitySignals): SuspiciousReportCategory {
    const flags = {
      profile: (signals.profile_updates_24h ?? 0) >= PROFILE_UPDATES_DAY
        || (signals.password_changes_24h ?? 0) >= PASSWORD_CHANGES_DAY,
      address: (signals.address_changes_24h ?? 0) >= ADDRESS_CHANGES_DAY,
      order: (signals.orders_placed_24h ?? 0) >= ORDERS_PLACED_DAY
        || (signals.orders_cancelled_7d ?? 0) >= ORDERS_CANCELLED_WEEK
        || (signals.refund_requests_7d ?? 0) >= REFUND_REQUESTS_WEEK,
    };

    const active = [flags.profile, flags.address, flags.order].filter(Boolean).length;
    if (active > 1) return 'mixed';
    if (flags.profile) return 'profile_churn';
    if (flags.address) return 'address_churn';
    return 'order_churn';
  }

  private isSuspicious(signals: SuspiciousActivitySignals): boolean {
    return (
      (signals.profile_updates_24h ?? 0) >= PROFILE_UPDATES_DAY
      || (signals.password_changes_24h ?? 0) >= PASSWORD_CHANGES_DAY
      || (signals.address_changes_24h ?? 0) >= ADDRESS_CHANGES_DAY
      || (signals.orders_placed_24h ?? 0) >= ORDERS_PLACED_DAY
      || (signals.orders_cancelled_7d ?? 0) >= ORDERS_CANCELLED_WEEK
      || (signals.refund_requests_7d ?? 0) >= REFUND_REQUESTS_WEEK
    );
  }

  private async evaluateUser(userId: string): Promise<void> {
    const signals = await this.collectSignals(userId);
    if (!this.isSuspicious(signals)) {
      return;
    }

    const summary = this.buildSummary(signals);
    if (!summary) return;

    await this.suspiciousRepo.upsertOpenReport({
      userId,
      category: this.resolveCategory(signals),
      signals,
      summary,
    });
  }
}
