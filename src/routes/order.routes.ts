import { Router } from 'express';
import { container } from '../di/container';
import { OrderController } from '../controllers/order/OrderController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validateRequest, validateQuery } from '../middleware/validation';
import { Role } from '../types/rbac';
import { checkoutSchema, updateOrderStatusSchema, orderFiltersSchema } from '../validators/order.validator';
import { RefundRequestController } from '../controllers/refund/RefundRequestController';
import { upload } from '../config/multer';
import { createRefundRequestSchema } from '../validators/refund.validator';

const router = Router();
const ctrl = container.resolve(OrderController);
const refundCtrl = container.resolve(RefundRequestController);

// Customer routes
router.post('/checkout', protect, authorize([Role.CUSTOMER]), validateRequest(checkoutSchema), ctrl.checkout);
router.get('/my', protect, authorize([Role.CUSTOMER]), validateQuery(orderFiltersSchema), ctrl.getMyOrders);
router.get('/my/:orderNumber', protect, authorize([Role.CUSTOMER]), ctrl.getMyOrder);
router.get('/my/:orderNumber/refund-request', protect, authorize([Role.CUSTOMER]), refundCtrl.getMyOrderRefundRequest);
router.post(
  '/my/:orderNumber/refund-request',
  protect,
  authorize([Role.CUSTOMER]),
  upload.single('image'),
  validateRequest(createRefundRequestSchema),
  refundCtrl.createMyOrderRefundRequest,
);

// Admin routes
router.get('/', protect, authorize([Role.ADMIN, Role.SUB_ADMIN]), validateQuery(orderFiltersSchema), ctrl.listAllOrders);
router.get('/:id/history', protect, authorize([Role.ADMIN, Role.SUB_ADMIN]), ctrl.getAdminOrderHistory);
router.get('/:id', protect, authorize([Role.ADMIN, Role.SUB_ADMIN]), ctrl.getAdminOrder);
router.patch('/:id/status', protect, authorize([Role.ADMIN, Role.SUB_ADMIN]), validateRequest(updateOrderStatusSchema), ctrl.updateOrderStatus);

export default router;
