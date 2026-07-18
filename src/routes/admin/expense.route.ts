import { Router } from 'express';
import { container } from '../../di/container';
import { AdminExpenseController } from '../../controllers/expense/AdminExpenseController';
import { upload } from '../../config/multer';
import { validateQuery, validateRequest } from '../../middleware/validation';
import { createExpenseSchema, expenseFiltersSchema } from '../../validators/refund.validator';

const router = Router();
const ctrl = container.resolve(AdminExpenseController);

router.get('/', validateQuery(expenseFiltersSchema), (req, res) => ctrl.list(req, res));
router.post('/', upload.single('receipt'), validateRequest(createExpenseSchema), (req, res) => ctrl.create(req, res));

export default router;
