import { injectable, inject, delay } from 'tsyringe';
import { AppDataSource } from '../../config/database';
import { Product } from '../../models/Product';
import { ProductVariant } from '../../models/ProductVariant';
import { IPaymentRepository, PaymentFilters } from '../../interfaces/repositories/IPaymentRepository';
import { IOrderRepository } from '../../interfaces/repositories/IOrderRepository';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { uploadToCloudinary, deleteFromCloudinary } from '../../config/cloudinary';
import { AppError } from '../../core/errors/AppError';
import { Payment } from '../../models/Payment';
import { Order } from '../../models/Order';
import { decodeCreatedAtIdCursor } from '../../utils/cursorPagination';
import { EntityManager } from 'typeorm';
import { NotificationService } from '../notification/NotificationService';
import { notificationMessages } from '../../i18n/notification-messages';
import { logAdminAction } from '../../utils/logAdminAction';
import { PaymentVerificationService } from '../paymentBridge/PaymentVerificationService';
import { normalizeAccountNumber } from '../../utils/convertSarToYer';

@injectable()
export class PaymentService {
  constructor(
    @inject(REPOSITORY_TOKENS.IPaymentRepository) private paymentRepo: IPaymentRepository,
    @inject(REPOSITORY_TOKENS.IOrderRepository) private orderRepo: IOrderRepository,
    @inject(NotificationService) private notificationService: NotificationService,
    @inject(delay(() => PaymentVerificationService))
    private verificationService: PaymentVerificationService,
  ) {}

  async submitPayment(
    customerId: string,
    orderId: string,
    paymentMethodId: string,
    payerAccountNumber: string,
    file: Express.Multer.File,
  ): Promise<Payment> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new AppError(404, 'Order not found');
    if (order.customer_id !== customerId) throw new AppError(403, 'Access denied');
    if (order.payment_type === 'pay_on_delivery') {
      throw new AppError(400, 'This order uses pay on delivery');
    }
    if (order.status !== 'pending_payment') {
      throw new AppError(400, `Order is ${order.status}, cannot submit payment`);
    }

    const paymentMethod = await this.paymentRepo.findMethodById(paymentMethodId);
    if (!paymentMethod || !paymentMethod.is_active) {
      throw new AppError(400, 'Selected payment method is not available');
    }

    const existing = await this.paymentRepo.findByOrderId(orderId);
    if (existing && existing.status === 'pending') {
      throw new AppError(409, 'Payment already submitted and pending review');
    }

    const expectedAmountYer = await this.verificationService.resolveExpectedAmountYer(Number(order.total));
    const normalizedAccount = normalizeAccountNumber(payerAccountNumber);
    if (normalizedAccount.length < 6) {
      throw new AppError(400, 'Invalid payer account number');
    }

    const payment = await this.paymentRepo.create({
      orderId,
      amount: Number(order.total),
      submittedByCustomerId: customerId,
      submittedAt: new Date(),
      paymentMethodId,
    });

    const uploaded = await uploadToCloudinary(
      file.buffer,
      `aura-tech/receipts/${orderId}`,
      file.mimetype,
    );
    await this.paymentRepo.attachReceipt(payment.id, uploaded.url, uploaded.public_id);
    payment.receipt_document_url = uploaded.url;
    payment.receipt_public_id = uploaded.public_id;

    await this.verificationService.registerPendingVerification({
      orderId,
      paymentId: payment.id,
      payerAccountNumber: normalizedAccount,
      expectedAmountYer,
    });

    const staffPayment = notificationMessages.staffPaymentSubmitted(order.order_number);
    void this.notificationService.notifyStaff({
      type: staffPayment.type,
      title: staffPayment.title,
      message: staffPayment.message,
      relatedOrderId: order.id,
    });

    return payment;
  }

  async autoApprovePayment(paymentId: string, historyReason: string): Promise<void> {
    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment) throw new AppError(404, 'Payment not found');
    if (payment.status !== 'pending') return;

    await AppDataSource.transaction(async (manager) => {
      await this.paymentRepo.updateStatus(paymentId, 'approved', null, null);
      await this.finalizeApprovedPayment(payment.order_id, null, manager, historyReason);
    });

    const order = await this.orderRepo.findById(payment.order_id);
    if (order) {
      const copy = notificationMessages.paymentApproved(order.order_number);
      void this.notificationService.notifyCustomer({
        customerId: order.customer_id,
        type: copy.type,
        title: copy.title,
        message: copy.message,
        relatedOrderId: order.id,
      });
    }
  }

  async approvePayment(paymentId: string, adminId: string): Promise<void> {
    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment) throw new AppError(404, 'Payment not found');
    if (payment.status !== 'pending') {
      throw new AppError(400, `Payment is already ${payment.status}`);
    }

    await AppDataSource.transaction(async (manager) => {
      await this.paymentRepo.updateStatus(paymentId, 'approved', adminId, null);
      await this.finalizeApprovedPayment(payment.order_id, adminId, manager, 'Payment approved by admin');
    });

    const order = await this.orderRepo.findById(payment.order_id);
    if (order) {
      const copy = notificationMessages.paymentApproved(order.order_number);
      void this.notificationService.notifyCustomer({
        customerId: order.customer_id,
        type: copy.type,
        title: copy.title,
        message: copy.message,
        relatedOrderId: order.id,
      });
    }

    void logAdminAction({
      admin_id: adminId,
      action: 'approve',
      entity_type: 'payment',
      entity_id: paymentId,
    });
  }

  async createManualPayment(adminId: string, orderNumber: string, amount: number): Promise<Payment> {
    const order = await this.orderRepo.findByOrderNumber(orderNumber.trim());
    if (!order) throw new AppError(404, 'Order not found');

    const fullOrder = await this.orderRepo.findById(order.id);
    if (!fullOrder) throw new AppError(404, 'Order not found');
    if (fullOrder.status === 'cancelled' || fullOrder.status === 'refunded') {
      throw new AppError(400, `Cannot record payment for ${fullOrder.status} order`);
    }

    const existing = await this.paymentRepo.findByOrderId(fullOrder.id);
    if (existing) throw new AppError(409, 'Payment already exists for this order');

    let payment!: Payment;

    await AppDataSource.transaction(async (manager) => {
      payment = await this.paymentRepo.create({
        orderId: fullOrder.id,
        amount,
        submittedByCustomerId: fullOrder.customer_id,
        submittedAt: new Date(),
        paymentMethodId: null,
        status: 'manual_approved',
        approvedByAdminId: adminId,
      });

      if (fullOrder.status === 'pending_payment') {
        await this.orderRepo.updateStatus(fullOrder.id, 'payment_confirmed');
        await this.orderRepo.recordStatusHistory(
          fullOrder.id,
          'pending_payment',
          'payment_confirmed',
          adminId,
          'Payment manually recorded by admin',
          manager,
        );
      }

      await this.fulfillOrderStock(fullOrder, manager);
    });

    const copy = notificationMessages.paymentRecorded(fullOrder.order_number);
    void this.notificationService.notifyCustomer({
      customerId: fullOrder.customer_id,
      type: copy.type,
      title: copy.title,
      message: copy.message,
      relatedOrderId: fullOrder.id,
    });

    void logAdminAction({
      admin_id: adminId,
      action: 'create',
      entity_type: 'payment',
      entity_id: payment!.id,
      changes_json: {
        manual: true,
        order_number: fullOrder.order_number,
        amount,
      },
    });

    return payment!;
  }

  private async finalizeApprovedPayment(
    orderId: string,
    adminId: string | null,
    manager: EntityManager,
    historyReason: string,
  ): Promise<void> {
    await this.orderRepo.updateStatus(orderId, 'payment_confirmed');
    await this.orderRepo.recordStatusHistory(
      orderId,
      'pending_payment',
      'payment_confirmed',
      adminId,
      historyReason,
      manager,
    );

    const order = await this.orderRepo.findById(orderId);
    if (order) {
      await this.fulfillOrderStock(order, manager);
    }
  }

  private async fulfillOrderStock(order: Order, manager: EntityManager): Promise<void> {
    if (!order.items?.length) return;

    const productRepo = manager.getRepository(Product);
    const variantRepo = manager.getRepository(ProductVariant);

    for (const item of order.items) {
      if (item.variant_id) {
        await variantRepo.decrement({ id: item.variant_id }, 'stock_quantity', item.quantity);
        await variantRepo.decrement({ id: item.variant_id }, 'reserved_quantity', item.quantity);
      } else {
        await productRepo.decrement({ id: item.product_id }, 'stock_quantity', item.quantity);
        await productRepo.decrement({ id: item.product_id }, 'reserved_quantity', item.quantity);
      }
    }
  }

  async rejectPayment(paymentId: string, adminId: string, reason: string): Promise<void> {
    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment) throw new AppError(404, 'Payment not found');
    if (payment.status !== 'pending') {
      throw new AppError(400, `Payment is already ${payment.status}`);
    }
    if (!reason?.trim()) throw new AppError(400, 'Rejection reason is required');

    await this.paymentRepo.updateStatus(paymentId, 'rejected', adminId, reason);

    const order = await this.orderRepo.findById(payment.order_id);
    if (order) {
      const copy = notificationMessages.paymentRejected(order.order_number, reason);
      void this.notificationService.notifyCustomer({
        customerId: order.customer_id,
        type: copy.type,
        title: copy.title,
        message: copy.message,
        relatedOrderId: order.id,
      });
    }

    void logAdminAction({
      admin_id: adminId,
      action: 'reject',
      entity_type: 'payment',
      entity_id: paymentId,
      reason,
    });
  }

  async getPayments(filters: Omit<PaymentFilters, 'cursor'> & { cursor?: string }) {
    const decoded = decodeCreatedAtIdCursor(filters.cursor);
    if (decoded === 'invalid') {
      throw new AppError(400, 'Invalid or malformed cursor');
    }

    return this.paymentRepo.findMany({ ...filters, cursor: decoded });
  }

  async getPaymentByOrder(orderId: string, customerId?: string): Promise<Payment> {
    const payment = await this.paymentRepo.findByOrderId(orderId);
    if (!payment) throw new AppError(404, 'Payment not found');
    if (customerId) {
      const order = await this.orderRepo.findById(orderId);
      if (!order || order.customer_id !== customerId) throw new AppError(403, 'Access denied');
    }
    return payment;
  }

  async getPaymentMethods() {
    return this.paymentRepo.findAllMethods();
  }

  async createPaymentMethod(dto: { name: string; bank_name: string; account_number?: string; iban?: string; description?: string }) {
    return this.paymentRepo.createMethod(dto);
  }

  async updatePaymentMethod(id: string, dto: any) {
    const method = await this.paymentRepo.findMethodById(id);
    if (!method) throw new AppError(404, 'Payment method not found');
    await this.paymentRepo.updateMethod(id, dto);
  }

  async deletePaymentMethod(id: string) {
    const method = await this.paymentRepo.findMethodById(id);
    if (!method) throw new AppError(404, 'Payment method not found');
    await this.paymentRepo.softDeleteMethod(id);
  }
}
