import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { AdminAnalyticsService } from '../../services/admin/AdminAnalyticsService';
import { AdminInventoryService } from '../../services/admin/AdminInventoryService';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';

@injectable()
export class AdminAnalyticsController {
  constructor(
    @inject(AdminAnalyticsService) private analyticsService: AdminAnalyticsService,
    @inject(AdminInventoryService) private inventoryService: AdminInventoryService,
  ) {}

  dashboard = async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.analyticsService.getDashboard();
      res.json(APIResponse.success('Dashboard analytics', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  revenue = async (req: Request, res: Response): Promise<void> => {
    try {
      const { from_date, to_date } = req.validatedData;
      const data = await this.analyticsService.getRevenue(new Date(from_date), new Date(to_date));
      res.json(APIResponse.success('Revenue analytics', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  topProducts = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.analyticsService.getTopProducts(req.validatedData.limit ?? 20);
      res.json(APIResponse.success('Top products', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  customers = async (req: Request, res: Response): Promise<void> => {
    try {
      const sort = req.validatedData.sort ?? 'lifetime_value';
      const limit = req.validatedData.limit ?? 50;
      const data = await this.analyticsService.getCustomers(sort, limit);
      res.json(APIResponse.success('Customer analytics', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  inventoryStatus = async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.analyticsService.getInventoryStatus();
      res.json(APIResponse.success('Inventory status', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  inventoryTurnover = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.analyticsService.getInventoryTurnover(req.validatedData.limit ?? 20);
      res.json(APIResponse.success('Inventory turnover', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  inventoryLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.inventoryService.getLogs({
        productId: req.validatedData.product_id,
        reason: req.validatedData.reason,
        changedById: req.validatedData.changed_by_id,
        limit: req.validatedData.limit ?? 50,
      });
      res.json(APIResponse.success('Inventory logs', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  paymentStatus = async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.analyticsService.getPaymentStatus();
      res.json(APIResponse.success('Payment status', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  paymentHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, from_date, to_date, limit } = req.validatedData;
      const data = await this.analyticsService.getPaymentHistory({
        status,
        fromDate: from_date ? new Date(from_date) : undefined,
        toDate: to_date ? new Date(to_date) : undefined,
        limit: limit ?? 50,
      });
      res.json(APIResponse.success('Payment history', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  financial = async (req: Request, res: Response): Promise<void> => {
    try {
      const { from_date, to_date } = req.validatedData;
      const data = await this.analyticsService.getFinancialSummary(
        from_date ? new Date(from_date) : undefined,
        to_date ? new Date(to_date) : undefined,
      );
      res.json(APIResponse.success('Financial summary', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  expensesHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { from_date, to_date, limit } = req.validatedData;
      const data = await this.analyticsService.getExpensesHistory({
        fromDate: from_date ? new Date(from_date) : undefined,
        toDate: to_date ? new Date(to_date) : undefined,
        limit: limit ?? 50,
      });
      res.json(APIResponse.success('Expenses history', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };
}
