import { Router } from 'express';
import { container } from '../di/container';
import { ReminderController } from '../controllers/reminder/ReminderController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { Role } from '../types/rbac';
import { validateRequest } from '../middleware/validation';
import { stockReminderSchema } from '../validators/platform.validator';

const router = Router();
const ctrl = container.resolve(ReminderController);

router.post(
  '/products/:id',
  protect,
  authorize([Role.CUSTOMER]),
  validateRequest(stockReminderSchema),
  (req, res) => ctrl.createProductReminder(req, res),
);

export default router;
