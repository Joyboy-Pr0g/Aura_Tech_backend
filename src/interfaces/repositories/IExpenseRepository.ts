import { Expense, ExpenseType } from '../../models/Expense';

export interface ExpenseFilters {
  type?: ExpenseType;
  limit?: number;
  cursor?: string;
  reason?: string;
  created_by_admin_id?: string;
  from_date?: string;
  to_date?: string;
  order_id?: string;
  order_number?: string;
}

export interface ExpenseTotals {
  expense_total: number;
  refund_total: number;
  grand_total: number;
  expense_count: number;
  refund_count: number;
}

export type ExpenseTotalsFilters = Omit<ExpenseFilters, 'type' | 'limit' | 'cursor'>;

export interface IExpenseRepository {
  findById(id: string): Promise<Expense | null>;
  create(data: Partial<Expense>): Promise<Expense>;
  update(id: string, data: Partial<Expense>): Promise<Expense | null>;
  list(filters: ExpenseFilters): Promise<{ items: Expense[]; next_cursor: string | null; has_more: boolean }>;
  summarize(filters: ExpenseTotalsFilters): Promise<ExpenseTotals>;
}
