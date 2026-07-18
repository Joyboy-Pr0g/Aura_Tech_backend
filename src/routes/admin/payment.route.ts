import { Router } from 'express';
import { container } from '../../di/container';
import { AdminPaymentController } from '../../controllers/admin/index';
import { validateRequest, validateQuery } from '../../middleware/validation';
import { authorize } from '../../middleware/rbac';
import { Role } from '../../types/rbac';
import {
  rejectPaymentSchema,
  paymentMethodSchema,
  updatePaymentMethodSchema,
  paymentFiltersQuerySchema,
  createManualPaymentSchema,
} from '../../validators/order.validator';

const router = Router();
const PaymentCtrl = container.resolve(AdminPaymentController);
const adminOnly = authorize([Role.ADMIN]);

router.get('/', validateQuery(paymentFiltersQuerySchema), PaymentCtrl.getPayments);
router.post('/', adminOnly, validateRequest(createManualPaymentSchema), PaymentCtrl.createManualPayment);
router.get('/methods', PaymentCtrl.getPaymentMethods);
router.post('/methods', adminOnly, validateRequest(paymentMethodSchema), PaymentCtrl.createPaymentMethod);
router.put('/methods/:id', adminOnly, validateRequest(updatePaymentMethodSchema), PaymentCtrl.updatePaymentMethod);
router.delete('/methods/:id', adminOnly, PaymentCtrl.deletePaymentMethod);
router.get('/orders/:orderId', PaymentCtrl.getPaymentByOrder);
router.patch('/:id/approve', PaymentCtrl.approvePayment);
router.patch('/:id/reject', validateRequest(rejectPaymentSchema), PaymentCtrl.rejectPayment);

export default router;
