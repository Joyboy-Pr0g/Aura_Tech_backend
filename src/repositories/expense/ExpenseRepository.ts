import { injectable } from 'tsyringe';
import { SelectQueryBuilder } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { Expense } from '../../models/Expense';
import {
  ExpenseFilters,
  ExpenseTotalsFilters,
  IExpenseRepository,
} from '../../interfaces/repositories/IExpenseRepository';
import {
  applyCreatedAtIdCursorDesc,
  decodeCreatedAtIdCursor,
  paginateByCursor,
} from '../../utils/cursorPagination';

@injectable()
export class ExpenseRepository implements IExpenseRepository {
  private repo = () => AppDataSource.getRepository(Expense);

  private applyFilters(qb: SelectQueryBuilder<Expense>, filters: ExpenseTotalsFilters | ExpenseFilters) {
    if ('type' in filters && filters.type) {
      qb.andWhere('e.type = :type', { type: filters.type });
    }

    if (filters.reason?.trim()) {
      qb.andWhere('e.reason ILIKE :reason', { reason: `%${filters.reason.trim()}%` });
    }

    if (filters.created_by_admin_id) {
      qb.andWhere('e.created_by_admin_id = :createdByAdminId', {
        createdByAdminId: filters.created_by_admin_id,
      });
    }

    if (filters.from_date) {
      qb.andWhere('e.created_at >= :fromDate', { fromDate: `${filters.from_date}T00:00:00.000Z` });
    }

    if (filters.to_date) {
      qb.andWhere('e.created_at <= :toDate', { toDate: `${filters.to_date}T23:59:59.999Z` });
    }

    if (filters.order_id) {
      qb.andWhere('e.order_id = :orderId', { orderId: filters.order_id });
    }

    if (filters.order_number?.trim()) {
      qb.andWhere('order.order_number ILIKE :orderNumber', {
        orderNumber: `%${filters.order_number.trim()}%`,
      });
    }
  }

  async findById(id: string): Promise<Expense | null> {
    return this.repo().findOne({
      where: { id },
      relations: ['order', 'created_by_admin'],
    });
  }

  async create(data: Partial<Expense>): Promise<Expense> {
    return this.repo().save(this.repo().create(data));
  }

  async update(id: string, data: Partial<Expense>): Promise<Expense | null> {
    await this.repo().update(id, data);
    return this.findById(id);
  }

  async list(filters: ExpenseFilters) {
    const limit = filters.limit ?? 20;
    const decoded = decodeCreatedAtIdCursor(filters.cursor);
    if (decoded === 'invalid') {
      throw new Error('Invalid or malformed cursor');
    }

    const qb = this.repo()
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.order', 'order')
      .leftJoinAndSelect('e.created_by_admin', 'created_by_admin');

    this.applyFilters(qb, filters);
    applyCreatedAtIdCursorDesc(qb, 'e', decoded);
    qb.orderBy('e.created_at', 'DESC').addOrderBy('e.id', 'DESC').take(limit + 1);

    const rows = await qb.getMany();
    return paginateByCursor(rows, limit);
  }

  async summarize(filters: ExpenseTotalsFilters) {
    const qb = this.repo()
      .createQueryBuilder('e')
      .leftJoin('e.order', 'order');

    this.applyFilters(qb, filters);

    const row = await qb
      .select(`COALESCE(SUM(CASE WHEN e.type = 'expense' THEN e.amount ELSE 0 END), 0)`, 'expense_total')
      .addSelect(`COALESCE(SUM(CASE WHEN e.type = 'refund' THEN e.amount ELSE 0 END), 0)`, 'refund_total')
      .addSelect(`COUNT(CASE WHEN e.type = 'expense' THEN 1 END)::int`, 'expense_count')
      .addSelect(`COUNT(CASE WHEN e.type = 'refund' THEN 1 END)::int`, 'refund_count')
      .getRawOne<{
        expense_total: string;
        refund_total: string;
        expense_count: string;
        refund_count: string;
      }>();

    const expenseTotal = Number(row?.expense_total ?? 0);
    const refundTotal = Number(row?.refund_total ?? 0);

    return {
      expense_total: expenseTotal,
      refund_total: refundTotal,
      grand_total: expenseTotal + refundTotal,
      expense_count: Number(row?.expense_count ?? 0),
      refund_count: Number(row?.refund_count ?? 0),
    };
  }
}
