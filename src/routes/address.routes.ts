import { Router } from 'express';
import { container } from '../di/container';
import { AddressController } from '../controllers/address/AddressController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validateRequest } from '../middleware/validation';
import { Role } from '../types/rbac';
import { addressSchema } from '../validators/order.validator';

const router = Router();
const ctrl = container.resolve(AddressController);

router.use(protect, authorize([Role.CUSTOMER]));

router.get('/', ctrl.getAddresses);
router.post('/', validateRequest(addressSchema), ctrl.addAddress);
router.put('/:id', validateRequest(addressSchema), ctrl.updateAddress);
router.patch('/:id/default', ctrl.setDefault);
router.delete('/:id', ctrl.deleteAddress);

export default router;
