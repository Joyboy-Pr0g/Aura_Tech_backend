import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { ExpenseService } from '../../services/expense/ExpenseService';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';

@injectable()
export class AdminExpenseController {
  constructor(@inject(ExpenseService) private expenseService: ExpenseService) {}

  totals = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.expenseService.getExpenseTotals(req.validatedData);
      res.json(APIResponse.success('Expense totals fetched', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.expenseService.listExpenses(req.validatedData);
      res.json(APIResponse.success('Expenses fetched', data.items, {
        next_cursor: data.next_cursor,
        has_more: data.has_more,
      }));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json(APIResponse.error('Receipt is required'));
        return;
      }
      const data = await this.expenseService.createExpense(req.user!.id, req.validatedData, req.file);
      res.status(201).json(APIResponse.success('Expense recorded', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.expenseService.updateExpense(
        req.user!.id,
        req.params.id,
        req.validatedData,
        req.file,
      );
      res.json(APIResponse.success('Expense updated', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };
}
