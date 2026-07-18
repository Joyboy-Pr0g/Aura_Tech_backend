import { injectable } from 'tsyringe';
import { In } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { Notification } from '../../models/Notification';
import { NotificationLog } from '../../models/NotificationLog';
import { DeviceToken } from '../../models/DeviceToken';
import { OutOfStockReminder } from '../../models/OutOfStockReminder';
import { User } from '../../models/User';
import { Role } from '../../types/rbac';
import {
  CreateNotificationDto,
  INotificationRepository,
} from '../../interfaces/repositories/INotificationRepository';

@injectable()
export class NotificationRepository implements INotificationRepository {
  private notificationRepo = AppDataSource.getRepository(Notification);
  private logRepo = AppDataSource.getRepository(NotificationLog);
  private deviceRepo = AppDataSource.getRepository(DeviceToken);
  private reminderRepo = AppDataSource.getRepository(OutOfStockReminder);

  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    return this.notificationRepo.save(
      this.notificationRepo.create({
        customer_id: dto.customerId,
        notification_type: dto.type,
        title: dto.title,
        message: dto.message,
        related_order_id: dto.relatedOrderId ?? null,
        related_product_id: dto.relatedProductId ?? null,
        channels: dto.channels ?? 'email,firebase',
        status: 'pending',
      }),
    );
  }

  async findByCustomer(customerId: string, limit = 50): Promise<Notification[]> {
    return this.notificationRepo.find({
      where: { customer_id: customerId },
      relations: { related_order: true, related_product: true },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async markAsRead(id: string, customerId: string): Promise<void> {
    await this.notificationRepo.update(
      { id, customer_id: customerId },
      { read_at: new Date() },
    );
  }

  async registerDeviceToken(customerId: string, token: string, platform?: string): Promise<void> {
    const existing = await this.deviceRepo.findOne({
      where: { customer_id: customerId, token },
    });
    if (existing) {
      await this.deviceRepo.update(existing.id, { platform: platform ?? existing.platform });
      return;
    }
    await this.deviceRepo.save(
      this.deviceRepo.create({
        customer_id: customerId,
        token,
        platform: platform ?? null,
      }),
    );
  }

  async getDeviceTokens(customerId: string): Promise<string[]> {
    const rows = await this.deviceRepo.find({ where: { customer_id: customerId } });
    return rows.map((r) => r.token);
  }

  async getDeviceTokensForRoles(roles: string[]): Promise<string[]> {
    if (roles.length === 0) return [];

    const rows = await this.deviceRepo
      .createQueryBuilder('dt')
      .innerJoin('dt.customer', 'user')
      .where('user.role IN (:...roles)', { roles })
      .getMany();

    return rows.map((r) => r.token);
  }

  async removeDeviceTokens(tokens: string[]): Promise<void> {
    if (tokens.length === 0) return;
    await this.deviceRepo.delete({ token: In(tokens) });
  }

  async createLog(
    notificationId: string,
    channel: 'email' | 'firebase',
    status: 'pending' | 'sent' | 'failed',
    error?: string,
  ): Promise<NotificationLog> {
    return this.logRepo.save(
      this.logRepo.create({
        notification_id: notificationId,
        channel,
        status,
        error_message: error ?? null,
        sent_at: status === 'sent' ? new Date() : null,
      }),
    );
  }

  async updateLogStatus(logId: string, status: 'sent' | 'failed', error?: string): Promise<void> {
    await this.logRepo.update(logId, {
      status,
      error_message: error ?? null,
      sent_at: status === 'sent' ? new Date() : null,
    });
  }

  async findFailedLogs(limit = 50): Promise<NotificationLog[]> {
    return this.logRepo.find({
      where: { status: 'failed' },
      relations: ['notification', 'notification.customer'],
      order: { attempted_at: 'ASC' },
      take: limit,
    });
  }

  async createReminder(
    customerId: string,
    productId: string,
    variantId?: string | null,
  ): Promise<OutOfStockReminder> {
    const existing = await this.reminderRepo.findOne({
      where: {
        customer_id: customerId,
        product_id: productId,
        product_variant_id: variantId ?? undefined,
        status: 'active',
      },
    });
    if (existing) return existing;

    return this.reminderRepo.save(
      this.reminderRepo.create({
        customer_id: customerId,
        product_id: productId,
        product_variant_id: variantId ?? null,
        status: 'active',
      }),
    );
  }

  async findActiveRemindersForProduct(
    productId: string,
    variantId?: string | null,
  ): Promise<OutOfStockReminder[]> {
    const qb = this.reminderRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.customer', 'customer')
      .leftJoinAndSelect('r.product', 'product')
      .where('r.product_id = :productId', { productId })
      .andWhere('r.status = :status', { status: 'active' });

    if (variantId) {
      qb.andWhere('r.product_variant_id = :variantId', { variantId });
    }

    return qb.getMany();
  }

  async markReminderNotified(id: string): Promise<void> {
    await this.reminderRepo.update(id, {
      status: 'notified',
      notified_at: new Date(),
    });
  }

  async findProductsWithPendingReminders(): Promise<Array<{ product_id: string; variant_id: string | null }>> {
    return this.reminderRepo
      .createQueryBuilder('r')
      .select('r.product_id', 'product_id')
      .addSelect('r.product_variant_id', 'variant_id')
      .where('r.status = :status', { status: 'active' })
      .groupBy('r.product_id')
      .addGroupBy('r.product_variant_id')
      .getRawMany();
  }

  async getStaffUserIds(): Promise<string[]> {
    const users = await AppDataSource.getRepository(User).find({
      where: { role: In([Role.ADMIN, Role.SUB_ADMIN]) },
      select: ['id'],
    });
    return users.map((user) => user.id);
  }
}
