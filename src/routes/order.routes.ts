import { Router } from 'express';
import { container } from '../di/container';
import { OrderController } from '../controllers/order/OrderController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validateRequest } from '../middleware/validation';
import { Role } from '../types/rbac';
import { checkoutSchema, updateOrderStatusSchema } from '../validators/order.validator';

const router = Router();
const ctrl = container.resolve(OrderController);

// Customer routes
router.post('/checkout', protect, authorize([Role.CUSTOMER]), validateRequest(checkoutSchema), ctrl.checkout);
router.get('/my', protect, authorize([Role.CUSTOMER]), ctrl.getMyOrders);
router.get('/my/:id', protect, authorize([Role.CUSTOMER]), ctrl.getMyOrder);

// Admin routes
router.get('/', protect, authorize([Role.ADMIN, Role.SUB_ADMIN]), ctrl.listAllOrders);
router.patch('/:id/status', protect, authorize([Role.ADMIN, Role.SUB_ADMIN]), validateRequest(updateOrderStatusSchema), ctrl.updateOrderStatus);

export default router;
