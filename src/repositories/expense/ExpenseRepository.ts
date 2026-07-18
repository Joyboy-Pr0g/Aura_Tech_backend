import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database';
import { Expense, ExpenseType } from '../../models/Expense';
import { ExpenseFilters, IExpenseRepository } from '../../interfaces/repositories/IExpenseRepository';
import {
  applyCreatedAtIdCursorDesc,
  decodeCreatedAtIdCursor,
  paginateByCursor,
} from '../../utils/cursorPagination';

@injectable()
export class ExpenseRepository implements IExpenseRepository {
  private repo = () => AppDataSource.getRepository(Expense);

  async findById(id: string): Promise<Expense | null> {
    return this.repo().findOne({
      where: { id },
      relations: ['order', 'created_by_admin'],
    });
  }

  async create(data: Partial<Expense>): Promise<Expense> {
    return this.repo().save(this.repo().create(data));
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

    if (filters.type) {
      qb.andWhere('e.type = :type', { type: filters.type });
    }

    applyCreatedAtIdCursorDesc(qb, 'e', decoded);
    qb.orderBy('e.created_at', 'DESC').addOrderBy('e.id', 'DESC').take(limit + 1);

    const rows = await qb.getMany();
    return paginateByCursor(rows, limit);
  }
}
