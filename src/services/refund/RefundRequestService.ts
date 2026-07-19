import { injectable, inject } from 'tsyringe';
import { AppDataSource } from '../../config/database';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { IRefundRequestRepository } from '../../interfaces/repositories/IRefundRequestRepository';
import { IOrderRepository } from '../../interfaces/repositories/IOrderRepository';
import { AppError } from '../../core/errors/AppError';
import { RefundRequest } from '../../models/RefundRequest';
import { OrderStatusHistory } from '../../models/OrderStatusHistory';
import { uploadToCloudinary } from '../../config/cloudinary';
import { logAdminAction } from '../../utils/logAdminAction';
import { NotificationService } from '../notification/NotificationService';
import { notificationMessages } from '../../i18n/notification-messages';

const REFUND_WINDOW_MS = 24 * 60 * 60 * 1000;

@injectable()
export class RefundRequestService {
  constructor(
    @inject(REPOSITORY_TOKENS.IRefundRequestRepository) private refundRepo: IRefundRequestRepository,
    @inject(REPOSITORY_TOKENS.IOrderRepository) private orderRepo: IOrderRepository,
    @inject(NotificationService) private notificationService: NotificationService,
  ) {}

  async getForCustomerOrder(customerId: string, orderNumber: string): Promise<RefundRequest | null> {
    const order = await this.orderRepo.findByOrderNumber(orderNumber);
    if (!order || order.customer_id !== customerId) {
      throw new AppError(404, 'Order not found');
    }
    return this.refundRepo.findByOrderId(order.id);
  }

  async createRequest(
    customerId: string,
    orderNumber: string,
    reason: string,
    file?: Express.Multer.File,
  ): Promise<RefundRequest> {
    const order = await this.orderRepo.findByOrderNumber(orderNumber.trim());
    if (!order || order.customer_id !== customerId) {
      throw new AppError(404, 'Order not found');
    }
    if (order.status !== 'delivered') {
      throw new AppError(400, 'Refund requests are only allowed for delivered orders');
    }

    const deliveredAt = await this.getDeliveredAt(order.id);
    if (!deliveredAt) {
      throw new AppError(400, 'Delivery date could not be verified');
    }
    if (Date.now() - deliveredAt.getTime() > REFUND_WINDOW_MS) {
      throw new AppError(400, 'Refund request window has expired');
    }

    const existing = await this.refundRepo.findByOrderId(order.id);
    if (existing) {
      throw new AppError(409, 'A refund request already exists for this order');
    }

    let imageUrl: string | null = null;
    let imagePublicId: string | null = null;
    if (file) {
      const uploaded = await uploadToCloudinary(
        file.buffer,
        `aura-tech/refund-requests/${order.id}`,
        file.mimetype,
      );
      imageUrl = uploaded.url;
      imagePublicId = uploaded.public_id;
    }

    const request = await this.refundRepo.create({
      order_id: order.id,
      customer_id: customerId,
      reason,
      image_url: imageUrl,
      image_public_id: imagePublicId,
      status: 'pending',
    });

    const staffRefund = notificationMessages.staffRefundRequest(order.order_number);
    void this.notificationService.notifyStaff({
      type: staffRefund.type,
      title: staffRefund.title,
      message: staffRefund.message,
      relatedOrderId: order.id,
    });

    return request;
  }

  async listAdmin(filters: {
    status?: 'pending' | 'approved' | 'rejected';
    order_number?: string;
    limit?: number;
    cursor?: string;
  }) {
    return this.refundRepo.list(filters);
  }

  async approve(id: string, adminId: string): Promise<RefundRequest> {
    const request = await this.refundRepo.findById(id);
    if (!request) throw new AppError(404, 'Refund request not found');
    if (request.status !== 'pending') {
      throw new AppError(400, `Refund request is already ${request.status}`);
    }

    const updated = await this.refundRepo.update(id, {
      status: 'approved',
      processed_by_admin_id: adminId,
      processed_at: new Date(),
      rejection_reason: null,
    });

    const orderNumber = request.order?.order_number ?? '';
    const copy = notificationMessages.refundApproved(orderNumber);
    void this.notificationService.notifyCustomer({
      customerId: request.customer_id,
      type: copy.type,
      title: copy.title,
      message: copy.message,
      relatedOrderId: request.order_id,
    });

    void logAdminAction({
      admin_id: adminId,
      action: 'approve',
      entity_type: 'refund_request',
      entity_id: id,
    });

    return updated;
  }

  async reject(id: string, adminId: string, rejectionReason: string): Promise<RefundRequest> {
    const request = await this.refundRepo.findById(id);
    if (!request) throw new AppError(404, 'Refund request not found');
    if (request.status !== 'pending') {
      throw new AppError(400, `Refund request is already ${request.status}`);
    }

    const updated = await this.refundRepo.update(id, {
      status: 'rejected',
      processed_by_admin_id: adminId,
      processed_at: new Date(),
      rejection_reason: rejectionReason,
    });

    const orderNumber = request.order?.order_number ?? '';
    const copy = notificationMessages.refundRejected(orderNumber);
    void this.notificationService.notifyCustomer({
      customerId: request.customer_id,
      type: copy.type,
      title: copy.title,
      message: copy.message,
      relatedOrderId: request.order_id,
    });

    void logAdminAction({
      admin_id: adminId,
      action: 'reject',
      entity_type: 'refund_request',
      entity_id: id,
      reason: rejectionReason,
    });

    return updated;
  }

  getRefundEligibility(orderStatus: string, deliveredAt: Date | null): {
    canRequest: boolean;
    expiresAt: Date | null;
  } {
    if (orderStatus !== 'delivered' || !deliveredAt) {
      return { canRequest: false, expiresAt: null };
    }
    const expiresAt = new Date(deliveredAt.getTime() + REFUND_WINDOW_MS);
    return {
      canRequest: Date.now() <= expiresAt.getTime(),
      expiresAt,
    };
  }

  private async getDeliveredAt(orderId: string): Promise<Date | null> {
    const history = await AppDataSource.getRepository(OrderStatusHistory).findOne({
      where: { order_id: orderId, new_status: 'delivered' },
      order: { created_at: 'DESC' },
    });
    return history?.created_at ?? null;
  }
}
