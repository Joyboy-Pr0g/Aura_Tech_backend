import { injectable, inject } from 'tsyringe';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { INotificationRepository } from '../../interfaces/repositories/INotificationRepository';
import { Notification, NotificationType } from '../../models/Notification';
import { sendEmail } from '../mail/emailService';
import { AppDataSource } from '../../config/database';
import { Product } from '../../models/Product';
import { ProductVariant } from '../../models/ProductVariant';
import { User } from '../../models/User';
import { isFirebaseConfigured, sendFirebaseMulticast } from '../../config/firebase';
import { Role } from '../../types/rbac';

@injectable()
export class NotificationService {
  constructor(
    @inject(REPOSITORY_TOKENS.INotificationRepository) private notificationRepo: INotificationRepository,
  ) {}

  async registerDeviceToken(userId: string, token: string, platform?: string): Promise<void> {
    await this.notificationRepo.registerDeviceToken(userId, token, platform);
  }

  async getMyNotifications(userId: string) {
    const notifications = await this.notificationRepo.findByCustomer(userId);
    return notifications.map((notification) => ({
      id: notification.id,
      notification_type: notification.notification_type,
      title: notification.title,
      message: notification.message,
      related_order_id: notification.related_order_id,
      related_order_number: notification.related_order?.order_number ?? null,
      related_product_slug: notification.related_product?.slug ?? null,
      status: notification.status,
      read_at: notification.read_at,
      created_at: notification.created_at,
    }));
  }

  async markAsRead(id: string, customerId: string): Promise<void> {
    await this.notificationRepo.markAsRead(id, customerId);
  }

  async notifyCustomer(params: {
    customerId: string;
    type: NotificationType;
    title: string;
    message: string;
    relatedOrderId?: string | null;
    relatedProductId?: string | null;
    skipEmail?: boolean;
  }): Promise<void> {
    const notification = await this.notificationRepo.createNotification({
      customerId: params.customerId,
      type: params.type,
      title: params.title,
      message: params.message,
      relatedOrderId: params.relatedOrderId,
      relatedProductId: params.relatedProductId,
      channels: params.skipEmail ? 'firebase' : 'email,firebase',
    });

    const user = await AppDataSource.getRepository(User).findOne({ where: { id: params.customerId } });

    if (!params.skipEmail && user?.email) {
      const emailLog = await this.notificationRepo.createLog(notification.id, 'email', 'pending');
      try {
        const sent = await sendEmail({
          to: user.email,
          subject: params.title,
          html: `<div style="font-family:sans-serif;color:#f5f5f5;background:#050507;padding:24px;">
          <h2 style="color:#00D9FF;">${params.title}</h2>
          <p style="color:rgba(255,255,255,0.7);">${params.message}</p>
        </div>`,
          text: params.message,
        });
        await this.notificationRepo.updateLogStatus(emailLog.id, sent ? 'sent' : 'failed', sent ? undefined : 'Email send failed');
        if (sent) {
          await AppDataSource.getRepository(Notification).update(notification.id, { status: 'sent' });
        }
      } catch (err) {
        await this.notificationRepo.updateLogStatus(
          emailLog.id,
          'failed',
          err instanceof Error ? err.message : 'Unknown error',
        );
      }
    }

    const firebaseLog = await this.notificationRepo.createLog(notification.id, 'firebase', 'pending');
    try {
      const sent = await this.sendFirebasePushToUser(params.customerId, params.title, params.message, {
        type: params.type,
        orderId: params.relatedOrderId ?? '',
        productId: params.relatedProductId ?? '',
      });
      await this.notificationRepo.updateLogStatus(
        firebaseLog.id,
        sent ? 'sent' : 'failed',
        sent ? undefined : 'Firebase push delivery failed',
      );
    } catch (err) {
      await this.notificationRepo.updateLogStatus(
        firebaseLog.id,
        'failed',
        err instanceof Error ? err.message : 'Firebase not configured',
      );
    }
  }

  /** In-app + push alerts for admin and sub-admin staff. */
  async notifyStaff(params: {
    type: 'staff_new_order' | 'staff_payment_submitted' | 'staff_refund_request';
    title: string;
    message: string;
    relatedOrderId?: string | null;
  }): Promise<void> {
    const staffIds = await this.notificationRepo.getStaffUserIds();

    for (const staffId of staffIds) {
      const notification = await this.notificationRepo.createNotification({
        customerId: staffId,
        type: params.type,
        title: params.title,
        message: params.message,
        relatedOrderId: params.relatedOrderId,
        channels: 'firebase',
      });

      const firebaseLog = await this.notificationRepo.createLog(notification.id, 'firebase', 'pending');
      try {
        const sent = await this.sendFirebasePushToUser(staffId, params.title, params.message, {
          type: params.type,
          orderId: params.relatedOrderId ?? '',
        });
        await this.notificationRepo.updateLogStatus(
          firebaseLog.id,
          sent ? 'sent' : 'failed',
          sent ? undefined : 'Firebase push delivery failed',
        );
      } catch (err) {
        await this.notificationRepo.updateLogStatus(
          firebaseLog.id,
          'failed',
          err instanceof Error ? err.message : 'Firebase not configured',
        );
      }
    }
  }

  async retryFailedNotifications(): Promise<void> {
    const failed = await this.notificationRepo.findFailedLogs(20);
    for (const log of failed) {
      if (log.channel !== 'email' || !log.notification) continue;
      const user = await AppDataSource.getRepository(User).findOne({
        where: { id: log.notification.customer_id },
      });
      if (!user?.email) continue;
      try {
        const sent = await sendEmail({
          to: user.email,
          subject: log.notification.title,
          html: `<p>${log.notification.message}</p>`,
          text: log.notification.message,
        });
        await this.notificationRepo.updateLogStatus(log.id, sent ? 'sent' : 'failed');
      } catch (err) {
        await this.notificationRepo.updateLogStatus(
          log.id,
          'failed',
          err instanceof Error ? err.message : 'Retry failed',
        );
      }
    }
  }

  async createStockReminder(customerId: string, productId: string, variantId?: string | null) {
    const product = await AppDataSource.getRepository(Product).findOne({ where: { id: productId } });
    if (!product) throw new Error('Product not found');
    return this.notificationRepo.createReminder(customerId, productId, variantId);
  }

  async processBackInStockReminders(): Promise<void> {
    const pending = await this.notificationRepo.findProductsWithPendingReminders();
    const productRepo = AppDataSource.getRepository(Product);
    const variantRepo = AppDataSource.getRepository(ProductVariant);

    for (const row of pending) {
      let inStock = false;
      if (row.variant_id) {
        const variant = await variantRepo.findOne({ where: { id: row.variant_id } });
        inStock = !!variant && variant.stock_quantity - variant.reserved_quantity > 0;
      } else {
        const product = await productRepo.findOne({ where: { id: row.product_id } });
        inStock = !!product && product.stock_quantity - product.reserved_quantity > 0;
      }
      if (!inStock) continue;

      const reminders = await this.notificationRepo.findActiveRemindersForProduct(
        row.product_id,
        row.variant_id,
      );

      for (const reminder of reminders) {
        const product = reminder.product;
        await this.notifyCustomer({
          customerId: reminder.customer_id,
          type: 'product_available',
          title: 'Back in stock',
          message: `${product?.title ?? 'A product'} is back in stock.`,
          relatedProductId: row.product_id,
        });
        await this.notificationRepo.markReminderNotified(reminder.id);
      }
    }
  }

  private async sendFirebasePushToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<boolean> {
    const tokens = await this.notificationRepo.getDeviceTokens(userId);
    if (tokens.length === 0 || !isFirebaseConfigured()) return false;

    const result = await sendFirebaseMulticast(tokens, title, body, data);
    if (result.invalidTokens.length > 0) {
      await this.notificationRepo.removeDeviceTokens(result.invalidTokens);
    }
    if (result.successCount === 0 && result.failureCount > 0) {
      console.warn('[FCM] all push attempts failed for user', userId);
      return false;
    }
    return result.successCount > 0;
  }
}
