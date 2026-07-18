import { Router } from 'express';
import { container } from '../../di/container';
import { AdminAnalyticsController } from '../../controllers/admin/Admin.AnalyticsController';
import { validateQuery } from '../../middleware/validation';
import {
  analyticsCustomersSchema,
  analyticsDateRangeSchema,
  analyticsLimitSchema,
  inventoryLogsSchema,
  paymentHistorySchema,
  analyticsFinancialSchema,
  expenseHistorySchema,
} from '../../validators/platform.validator';

const router = Router();
const ctrl = container.resolve(AdminAnalyticsController);

router.get('/dashboard', (req, res) => ctrl.dashboard(req, res));
router.get('/revenue', validateQuery(analyticsDateRangeSchema), (req, res) => ctrl.revenue(req, res));
router.get('/products/top', validateQuery(analyticsLimitSchema), (req, res) => ctrl.topProducts(req, res));
router.get('/customers', validateQuery(analyticsCustomersSchema), (req, res) => ctrl.customers(req, res));
router.get('/inventory/status', (req, res) => ctrl.inventoryStatus(req, res));
router.get('/inventory/turnover', validateQuery(analyticsLimitSchema), (req, res) => ctrl.inventoryTurnover(req, res));
router.get('/inventory/logs', validateQuery(inventoryLogsSchema), (req, res) => ctrl.inventoryLogs(req, res));
router.get('/payments/status', (req, res) => ctrl.paymentStatus(req, res));
router.get('/payments/history', validateQuery(paymentHistorySchema), (req, res) => ctrl.paymentHistory(req, res));
router.get('/financial', validateQuery(analyticsFinancialSchema), (req, res) => ctrl.financial(req, res));
router.get('/expenses/history', validateQuery(expenseHistorySchema), (req, res) => ctrl.expensesHistory(req, res));

export default router;
