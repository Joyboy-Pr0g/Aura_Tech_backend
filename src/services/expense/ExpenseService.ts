import { injectable, inject } from 'tsyringe';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { IExpenseRepository } from '../../interfaces/repositories/IExpenseRepository';
import { IOrderRepository } from '../../interfaces/repositories/IOrderRepository';
import { AppError } from '../../core/errors/AppError';
import { Expense, ExpenseType } from '../../models/Expense';
import { uploadToCloudinary } from '../../config/cloudinary';
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

  async listExpenses(filters: {
    type?: ExpenseType;
    limit?: number;
    cursor?: string;
  }) {
    return this.expenseRepo.list(filters);
  }
}
