import { Router } from 'express';
import { container } from '../../di/container';
import { AdminShippingFeeController } from '../../controllers/admin/Admin.ShippingFeeController';
import { validateRequest } from '../../middleware/validation';
import { createShippingFeeSchema, updateShippingFeeSchema } from '../../validators/shippingFee.validator';

const router = Router();
const ctrl = container.resolve(AdminShippingFeeController);

router.get('/', ctrl.getFees);
router.get('/:id', ctrl.getFeeById);
router.post('/', validateRequest(createShippingFeeSchema), ctrl.createFee);
router.put('/:id', validateRequest(updateShippingFeeSchema), ctrl.updateFee);
router.delete('/:id', ctrl.deleteFee);
router.post('/:id/activate', ctrl.activateFee);
router.post('/:id/deactivate', ctrl.deactivateFee);

export default router;
