import { Expense, ExpenseType } from '../../models/Expense';

export interface ExpenseFilters {
  type?: ExpenseType;
  limit?: number;
  cursor?: string;
}

export interface IExpenseRepository {
  findById(id: string): Promise<Expense | null>;
  create(data: Partial<Expense>): Promise<Expense>;
  list(filters: ExpenseFilters): Promise<{ items: Expense[]; next_cursor: string | null; has_more: boolean }>;
}
