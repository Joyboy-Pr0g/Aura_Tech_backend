import { Router } from 'express';
import { container } from '../di/container';
import { CouponController } from '../controllers/coupon/CouponController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { Role } from '../types/rbac';
import { validateRequest } from '../middleware/validation';
import { validateCouponSchema } from '../validators/platform.validator';

const router = Router();
const ctrl = container.resolve(CouponController);

router.post(
  '/validate',
  protect,
  authorize([Role.CUSTOMER]),
  validateRequest(validateCouponSchema),
  (req, res) => ctrl.validate(req, res),
);

export default router;
