import { Notification, NotificationType } from '../../models/Notification';
import { NotificationLog } from '../../models/NotificationLog';
import { DeviceToken } from '../../models/DeviceToken';
import { OutOfStockReminder } from '../../models/OutOfStockReminder';

export interface CreateNotificationDto {
  customerId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedOrderId?: string | null;
  relatedProductId?: string | null;
  channels?: string;
}

export interface INotificationRepository {
  createNotification(dto: CreateNotificationDto): Promise<Notification>;
  findByCustomer(customerId: string, limit?: number): Promise<Notification[]>;
  markAsRead(id: string, customerId: string): Promise<void>;
  registerDeviceToken(customerId: string, token: string, platform?: string): Promise<void>;
  getDeviceTokens(customerId: string): Promise<string[]>;
  getDeviceTokensForRoles(roles: string[]): Promise<string[]>;
  removeDeviceTokens(tokens: string[]): Promise<void>;
  createLog(notificationId: string, channel: 'email' | 'firebase', status: 'pending' | 'sent' | 'failed', error?: string): Promise<NotificationLog>;
  updateLogStatus(logId: string, status: 'sent' | 'failed', error?: string): Promise<void>;
  findFailedLogs(limit?: number): Promise<NotificationLog[]>;
  createReminder(customerId: string, productId: string, variantId?: string | null): Promise<OutOfStockReminder>;
  findActiveRemindersForProduct(productId: string, variantId?: string | null): Promise<OutOfStockReminder[]>;
  markReminderNotified(id: string): Promise<void>;
  findProductsWithPendingReminders(): Promise<Array<{ product_id: string; variant_id: string | null }>>;
  getStaffUserIds(): Promise<string[]>;
}
