import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database';
import { Payment, PaymentStatus } from '../../models/Payment';
import { PaymentMethod } from '../../models/PaymentMethod';
import { IPaymentRepository } from '../../interfaces/repositories/IPaymentRepository';

@injectable()
export class PaymentRepository implements IPaymentRepository {
  private get repo() { return AppDataSource.getRepository(Payment); }
  private get methodRepo() { return AppDataSource.getRepository(PaymentMethod); }

  async findById(id: string): Promise<Payment | null> {
    return this.repo.findOne({ where: { id }, relations: ['order', 'submitted_by_customer', 'approved_by_admin'] });
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    return this.repo.findOne({ where: { order_id: orderId } });
  }

  async findPending(page: number, limit: number): Promise<[Payment[], number]> {
    return this.repo.findAndCount({
      where: { status: 'pending' },
      relations: ['order', 'submitted_by_customer'],
      order: { submitted_at: 'ASC' },
      take: limit,
      skip: (page - 1) * limit,
    });
  }

  async create(dto: { orderId: string; amount: number; submittedByCustomerId: string; submittedAt: Date }): Promise<Payment> {
    const payment = this.repo.create({
      order_id: dto.orderId,
      amount: dto.amount,
      status: 'pending',
      submitted_by_customer_id: dto.submittedByCustomerId,
      submitted_at: dto.submittedAt,
    });
    return this.repo.save(payment);
  }

  async attachReceipt(id: string, url: string, publicId: string): Promise<void> {
    await this.repo.update(id, {
      receipt_document_url: url,
      receipt_public_id: publicId,
    });
  }

  async updateStatus(id: string, status: PaymentStatus, adminId: string | null, reason: string | null): Promise<void> {
    const patch: Partial<Payment> = { status };
    if (status === 'approved') {
      patch.approved_by_admin_id = adminId;
      patch.approved_at = new Date();
    } else if (status === 'rejected') {
      patch.approved_by_admin_id = adminId;
      patch.rejection_reason = reason;
      patch.rejected_at = new Date();
    }
    await this.repo.update(id, patch);
  }

  async findAllMethods(): Promise<PaymentMethod[]> {
    return this.methodRepo.find({ where: { is_active: true }, order: { created_at: 'ASC' } });
  }

  async findMethodById(id: string): Promise<PaymentMethod | null> {
    return this.methodRepo.findOne({ where: { id } });
  }

  async createMethod(dto: { name: string; bank_name: string; account_number?: string; iban?: string; description?: string }): Promise<PaymentMethod> {
    const method = this.methodRepo.create(dto);
    return this.methodRepo.save(method);
  }

  async updateMethod(id: string, dto: Partial<PaymentMethod>): Promise<void> {
    await this.methodRepo.update(id, dto);
  }

  async softDeleteMethod(id: string): Promise<void> {
    await this.methodRepo.softDelete(id);
  }
}
