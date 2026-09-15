import { Router } from 'express';
import { container } from '../../di/container';
import { AdminExpenseController } from '../../controllers/expense/AdminExpenseController';
import { upload } from '../../config/multer';
import { validateQuery, validateRequest } from '../../middleware/validation';
import {
  createExpenseSchema,
  expenseFiltersSchema,
  expenseTotalsSchema,
  updateExpenseSchema,
} from '../../validators/refund.validator';

const router = Router();
const ctrl = container.resolve(AdminExpenseController);

router.get('/totals', validateQuery(expenseTotalsSchema), (req, res) => ctrl.totals(req, res));
router.get('/', validateQuery(expenseFiltersSchema), (req, res) => ctrl.list(req, res));
router.post('/', upload.single('receipt'), validateRequest(createExpenseSchema), (req, res) => ctrl.create(req, res));
router.patch('/:id', upload.single('receipt'), validateRequest(updateExpenseSchema), (req, res) => ctrl.update(req, res));

export default router;
