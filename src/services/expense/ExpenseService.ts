import { injectable, inject } from 'tsyringe';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { IExpenseRepository } from '../../interfaces/repositories/IExpenseRepository';
import { IOrderRepository } from '../../interfaces/repositories/IOrderRepository';
import { AppError } from '../../core/errors/AppError';
import { Expense, ExpenseType } from '../../models/Expense';
import { deleteFromCloudinary, uploadToCloudinary } from '../../config/cloudinary';
import { logAdminAction } from '../../utils/logAdminAction';

@injectable()
export class ExpenseService {
  constructor(
    @inject(REPOSITORY_TOKENS.IExpenseRepository) private expenseRepo: IExpenseRepository,
    @inject(REPOSITORY_TOKENS.IOrderRepository) private orderRepo: IOrderRepository,
  ) {}

  async createExpense(
    adminId: string,
    data: {
      type: ExpenseType;
      order_number?: string | null;
      amount: number;
      reason: string;
    },
    receiptFile: Express.Multer.File,
  ): Promise<Expense> {
    let orderId: string | null = null;
    if (data.type === 'refund') {
      const order = await this.orderRepo.findByOrderNumber(String(data.order_number).trim());
      if (!order) throw new AppError(404, 'Order not found');
      orderId = order.id;
    }

    const uploaded = await uploadToCloudinary(
      receiptFile.buffer,
      `aura-tech/expenses/${data.type}`,
      receiptFile.mimetype,
    );

    const expense = await this.expenseRepo.create({
      type: data.type,
      order_id: orderId,
      amount: data.amount,
      receipt_url: uploaded.url,
      receipt_public_id: uploaded.public_id,
      reason: data.reason,
      created_by_admin_id: adminId,
    });

    void logAdminAction({
      admin_id: adminId,
      action: 'create',
      entity_type: 'expense',
      entity_id: expense.id,
      changes_json: {
        type: data.type,
        amount: data.amount,
        order_id: orderId,
      },
    });

    return expense;
  }

  async updateExpense(
    adminId: string,
    id: string,
    data: {
      amount?: number;
      reason?: string;
      order_number?: string | null;
    },
    receiptFile?: Express.Multer.File,
  ): Promise<Expense> {
    const existing = await this.expenseRepo.findById(id);
    if (!existing) throw new AppError(404, 'Expense not found');

    const patch: Partial<Expense> = {};

    if (data.amount !== undefined) {
      patch.amount = data.amount;
    }

    if (data.reason !== undefined) {
      patch.reason = data.reason;
    }

    if (existing.type === 'refund' && data.order_number !== undefined) {
      const trimmed = String(data.order_number ?? '').trim();
      if (!trimmed) {
        throw new AppError(400, 'Order number is required for refund expenses');
      }
      const order = await this.orderRepo.findByOrderNumber(trimmed);
      if (!order) throw new AppError(404, 'Order not found');
      patch.order_id = order.id;
    }

    if (receiptFile) {
      if (existing.receipt_public_id) {
        await deleteFromCloudinary(existing.receipt_public_id).catch(() => {});
      }
      const uploaded = await uploadToCloudinary(
        receiptFile.buffer,
        `aura-tech/expenses/${existing.type}`,
        receiptFile.mimetype,
      );
      patch.receipt_url = uploaded.url;
      patch.receipt_public_id = uploaded.public_id;
    }

    if (Object.keys(patch).length === 0) {
      throw new AppError(400, 'No changes provided');
    }

    const updated = await this.expenseRepo.update(id, patch);
    if (!updated) throw new AppError(404, 'Expense not found');

    void logAdminAction({
      admin_id: adminId,
      action: 'update',
      entity_type: 'expense',
      entity_id: id,
      changes_json: patch,
    });

    return updated;
  }

  async listExpenses(filters: {
    type?: ExpenseType;
    limit?: number;
    cursor?: string;
    reason?: string;
    created_by_admin_id?: string;
    from_date?: string;
    to_date?: string;
    order_id?: string;
    order_number?: string;
  }) {
    return this.expenseRepo.list(filters);
  }

  async getExpenseTotals(filters: {
    reason?: string;
    created_by_admin_id?: string;
    from_date?: string;
    to_date?: string;
    order_id?: string;
    order_number?: string;
  }) {
    return this.expenseRepo.summarize(filters);
  }
}
