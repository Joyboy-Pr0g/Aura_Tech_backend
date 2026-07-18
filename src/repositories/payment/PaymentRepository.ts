import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database';
import { Payment, PaymentStatus } from '../../models/Payment';
import { PaymentMethod } from '../../models/PaymentMethod';
import { IPaymentRepository } from '../../interfaces/repositories/IPaymentRepository';
import {
  CursorListResult,
  DEFAULT_LIMIT,
  applyCreatedAtIdCursorDesc,
  paginateByCursor,
} from '../../utils/cursorPagination';
import { PaymentFilters } from '../../interfaces/repositories/IPaymentRepository';

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

  async findMany(filters: PaymentFilters): Promise<CursorListResult<Payment>> {
    const { limit = DEFAULT_LIMIT, cursor } = filters;

    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.order', 'order')
      .leftJoinAndSelect('p.submitted_by_customer', 'customer')
      .leftJoinAndSelect('p.payment_method', 'payment_method');

    if (filters.search?.trim()) {
      qb.andWhere(
        `(LOWER(order.order_number) LIKE LOWER(:search)
          OR LOWER(customer.full_name) LIKE LOWER(:search)
          OR LOWER(customer.email) LIKE LOWER(:search))`,
        { search: `%${filters.search.trim()}%` },
      );
    }

    if (filters.payment_method_id) {
      qb.andWhere('p.payment_method_id = :payment_method_id', {
        payment_method_id: filters.payment_method_id,
      });
    }

    if (filters.status) {
      qb.andWhere('p.status = :status', { status: filters.status });
    }

    if (filters.min_amount !== undefined) {
      qb.andWhere('p.amount >= :min_amount', { min_amount: filters.min_amount });
    }

    if (filters.max_amount !== undefined) {
      qb.andWhere('p.amount <= :max_amount', { max_amount: filters.max_amount });
    }

    applyCreatedAtIdCursorDesc(qb, 'p', cursor ?? null);
    qb.orderBy('p.created_at', 'DESC').addOrderBy('p.id', 'DESC').take(limit + 1);

    const rows = await qb.getMany();
    return paginateByCursor(rows, limit);
  }

  async create(dto: {
    orderId: string;
    amount: number;
    submittedByCustomerId: string;
    submittedAt: Date;
    paymentMethodId?: string | null;
    status?: PaymentStatus;
    approvedByAdminId?: string | null;
  }): Promise<Payment> {
    const status = dto.status ?? 'pending';
    const payment = this.repo.create({
      order_id: dto.orderId,
      amount: dto.amount,
      payment_method_id: dto.paymentMethodId ?? null,
      status,
      submitted_by_customer_id: dto.submittedByCustomerId,
      submitted_at: dto.submittedAt,
      approved_by_admin_id:
        status === 'approved' || status === 'manual_approved' ? dto.approvedByAdminId ?? null : null,
      approved_at:
        status === 'approved' || status === 'manual_approved' ? new Date() : null,
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
    if (status === 'approved' || status === 'manual_approved') {
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

  async getTotalPayment(): Promise<number> {
    const result = await this.repo.createQueryBuilder('payment').select('SUM(payment.amount)').getRawOne();
    return result.sum || 0;
  }
}
