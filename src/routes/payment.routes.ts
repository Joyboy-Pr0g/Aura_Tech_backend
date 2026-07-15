import { Router } from 'express';
import { container } from '../di/container';
import { PaymentController } from '../controllers/payment/PaymentController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { Role } from '../types/rbac';
import { upload } from '../config/multer';

const router = Router();
const ctrl = container.resolve(PaymentController);

router.get('/methods', protect, ctrl.getPaymentMethods);
router.post('/orders/:orderId', protect, authorize([Role.CUSTOMER]), upload.single('receipt'), ctrl.submitPayment);
router.get('/orders/:orderId', protect, authorize([Role.CUSTOMER]), ctrl.getPaymentByOrder);

export default router;
