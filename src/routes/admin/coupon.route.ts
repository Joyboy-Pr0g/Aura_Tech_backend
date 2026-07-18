import { Router } from 'express';
import { container } from '../../di/container';
import { AdminCouponController } from '../../controllers/admin/Admin.CouponController';
import { validateRequest } from '../../middleware/validation';
import { createCouponSchema, updateCouponSchema } from '../../validators/platform.validator';

const router = Router();
const ctrl = container.resolve(AdminCouponController);

router.get('/', (req, res) => ctrl.list(req, res));
router.post('/', validateRequest(createCouponSchema), (req, res) => ctrl.create(req, res));
router.put('/:id', validateRequest(updateCouponSchema), (req, res) => ctrl.update(req, res));
router.delete('/:id', (req, res) => ctrl.remove(req, res));

export default router;
