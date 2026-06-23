import { Payment, PaymentStatus } from '../../models/Payment';
import { PaymentMethod } from '../../models/PaymentMethod';

export interface IPaymentRepository {
  findById(id: string): Promise<Payment | null>;
  findByOrderId(orderId: string): Promise<Payment | null>;
  findPending(page: number, limit: number): Promise<[Payment[], number]>;
  create(dto: { orderId: string; amount: number; submittedByCustomerId: string; submittedAt: Date }): Promise<Payment>;
  attachReceipt(id: string, url: string, publicId: string): Promise<void>;
  updateStatus(id: string, status: PaymentStatus, adminId: string | null, reason: string | null): Promise<void>;

  findAllMethods(): Promise<PaymentMethod[]>;
  findMethodById(id: string): Promise<PaymentMethod | null>;
  createMethod(dto: { name: string; bank_name: string; account_number?: string; iban?: string; description?: string }): Promise<PaymentMethod>;
  updateMethod(id: string, dto: Partial<PaymentMethod>): Promise<void>;
  softDeleteMethod(id: string): Promise<void>;
}
