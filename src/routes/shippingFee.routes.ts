import { Router } from 'express';
import { container } from '../di/container';
import { ShippingFeeController } from '../controllers/shipping/ShippingFeeController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { Role } from '../types/rbac';

const router = Router();
const ctrl = container.resolve(ShippingFeeController);

router.get('/', protect, authorize([Role.CUSTOMER]), ctrl.getActiveFees);

export default router;
