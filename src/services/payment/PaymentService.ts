import { injectable, inject } from 'tsyringe';
import { AppDataSource } from '../../config/database';
import { Product } from '../../models/Product';
import { ProductVariant } from '../../models/ProductVariant';
import { IPaymentRepository } from '../../interfaces/repositories/IPaymentRepository';
import { IOrderRepository } from '../../interfaces/repositories/IOrderRepository';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { uploadToCloudinary, deleteFromCloudinary } from '../../config/cloudinary';
import { AppError } from '../../core/errors/AppError';
import { Payment } from '../../models/Payment';

@injectable()
export class PaymentService {
  constructor(
    @inject(REPOSITORY_TOKENS.IPaymentRepository) private paymentRepo: IPaymentRepository,
    @inject(REPOSITORY_TOKENS.IOrderRepository) private orderRepo: IOrderRepository,
  ) {}

  async submitPayment(customerId: string, orderId: string, file: Express.Multer.File): Promise<Payment> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new AppError(404, 'Order not found');
    if (order.customer_id !== customerId) throw new AppError(403, 'Access denied');
    if (order.status !== 'pending_payment') {
      throw new AppError(400, `Order is ${order.status}, cannot submit payment`);
    }

    const existing = await this.paymentRepo.findByOrderId(orderId);
    if (existing && existing.status === 'pending') {
      throw new AppError(409, 'Payment already submitted and pending review');
    }

    const payment = await this.paymentRepo.create({
      orderId,
      amount: Number(order.total),
      submittedByCustomerId: customerId,
      submittedAt: new Date(),
    });

    // Upload receipt
    const uploaded = await uploadToCloudinary(
      file.buffer,
      `aura-tech/receipts/${orderId}`,
      file.mimetype,
    );
    await this.paymentRepo.attachReceipt(payment.id, uploaded.url, uploaded.public_id);
    payment.receipt_document_url = uploaded.url;
    payment.receipt_public_id = uploaded.public_id;

    return payment;
  }

  async approvePayment(paymentId: string, adminId: string): Promise<void> {
    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment) throw new AppError(404, 'Payment not found');
    if (payment.status !== 'pending') {
      throw new AppError(400, `Payment is already ${payment.status}`);
    }

    await AppDataSource.transaction(async (manager) => {
      await this.paymentRepo.updateStatus(paymentId, 'approved', adminId, null);

      // Transition order → payment_confirmed
      await this.orderRepo.updateStatus(payment.order_id, 'payment_confirmed');
      await this.orderRepo.recordStatusHistory(
        payment.order_id, 'pending_payment', 'payment_confirmed', adminId, 'Payment approved by admin',
      );

      // Convert reserved → actual sold (decrement stock, leave reserved as is — stock_quantity decremented)
      const order = await this.orderRepo.findById(payment.order_id);
      if (order?.items) {
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
    });
  }

  async rejectPayment(paymentId: string, adminId: string, reason: string): Promise<void> {
    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment) throw new AppError(404, 'Payment not found');
    if (payment.status !== 'pending') {
      throw new AppError(400, `Payment is already ${payment.status}`);
    }
    if (!reason?.trim()) throw new AppError(400, 'Rejection reason is required');

    await this.paymentRepo.updateStatus(paymentId, 'rejected', adminId, reason);
  }

  async getPendingPayments(page: number, limit: number) {
    const [payments, total] = await this.paymentRepo.findPending(page, limit);
    return { payments, total, page, limit };
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

  // Payment methods (bank accounts shown to customers)
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
