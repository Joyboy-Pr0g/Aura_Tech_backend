import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database';
import { RefundRequest, RefundRequestStatus } from '../../models/RefundRequest';
import {
  IRefundRequestRepository,
  RefundRequestFilters,
} from '../../interfaces/repositories/IRefundRequestRepository';
import {
  applyCreatedAtIdCursorDesc,
  decodeCreatedAtIdCursor,
  paginateByCursor,
} from '../../utils/cursorPagination';
import { joinPublicUser } from '../../utils/publicUser';

@injectable()
export class RefundRequestRepository implements IRefundRequestRepository {
  private repo = () => AppDataSource.getRepository(RefundRequest);

  async findById(id: string): Promise<RefundRequest | null> {
    return this.repo().findOne({
      where: { id },
      relations: ['order', 'customer', 'processed_by_admin'],
    });
  }

  async findByOrderId(orderId: string): Promise<RefundRequest | null> {
    const qb = this.repo()
      .createQueryBuilder('rr')
      .leftJoinAndSelect('rr.order', 'order')
      .where('rr.order_id = :orderId', { orderId });
    joinPublicUser(qb, 'rr.customer', 'customer');
    return joinPublicUser(qb, 'rr.processed_by_admin', 'processed_by_admin').getOne();
  }

  async create(data: Partial<RefundRequest>): Promise<RefundRequest> {
    return this.repo().save(this.repo().create(data));
  }

  async update(id: string, data: Partial<RefundRequest>): Promise<RefundRequest> {
    await this.repo().update(id, data);
    const updated = await this.findById(id);
    if (!updated) throw new Error('Refund request not found after update');
    return updated;
  }

  async list(filters: RefundRequestFilters) {
    const limit = filters.limit ?? 20;
    const decoded = decodeCreatedAtIdCursor(filters.cursor);
    if (decoded === 'invalid') {
      throw new Error('Invalid or malformed cursor');
    }

    const qb = this.repo()
      .createQueryBuilder('rr')
      .leftJoinAndSelect('rr.order', 'order')
      .leftJoinAndSelect('rr.customer', 'customer')
      .leftJoinAndSelect('rr.processed_by_admin', 'processed_by_admin');

    if (filters.status) {
      qb.andWhere('rr.status = :status', { status: filters.status });
    }
    if (filters.order_number?.trim()) {
      qb.andWhere('order.order_number ILIKE :orderNumber', {
        orderNumber: `%${filters.order_number.trim()}%`,
      });
    }

    applyCreatedAtIdCursorDesc(qb, 'rr', decoded);
    qb.orderBy('rr.created_at', 'DESC').addOrderBy('rr.id', 'DESC').take(limit + 1);

    const rows = await qb.getMany();
    const page = paginateByCursor(rows, limit);
    return page;
  }
}
