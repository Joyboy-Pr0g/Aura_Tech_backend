import { Router } from 'express';
import { container } from '../di/container';
import { PaymentController } from '../controllers/payment/PaymentController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validateRequest } from '../middleware/validation';
import { Role } from '../types/rbac';
import { rejectPaymentSchema, paymentMethodSchema, updatePaymentMethodSchema } from '../validators/order.validator';
import { upload } from '../config/multer';

const router = Router();
const ctrl = container.resolve(PaymentController);

// Public — show bank details to all authenticated users
router.get('/methods', protect, ctrl.getPaymentMethods);

// Customer — submit payment receipt for an order
router.post('/orders/:orderId', protect, authorize([Role.CUSTOMER]), upload.single('receipt'), ctrl.submitPayment);
router.get('/orders/:orderId', protect, authorize([Role.CUSTOMER]), ctrl.getPaymentByOrder);

// Admin — approval queue
router.get('/pending', protect, authorize([Role.ADMIN, Role.SUB_ADMIN]), ctrl.getPendingPayments);
router.patch('/:id/approve', protect, authorize([Role.ADMIN, Role.SUB_ADMIN]), ctrl.approvePayment);
router.patch('/:id/reject', protect, authorize([Role.ADMIN, Role.SUB_ADMIN]), validateRequest(rejectPaymentSchema), ctrl.rejectPayment);

// Admin — manage bank accounts
router.post('/methods', protect, authorize([Role.ADMIN]), validateRequest(paymentMethodSchema), ctrl.createPaymentMethod);
router.put('/methods/:id', protect, authorize([Role.ADMIN]), validateRequest(updatePaymentMethodSchema), ctrl.updatePaymentMethod);
router.delete('/methods/:id', protect, authorize([Role.ADMIN]), ctrl.deletePaymentMethod);

export default router;
