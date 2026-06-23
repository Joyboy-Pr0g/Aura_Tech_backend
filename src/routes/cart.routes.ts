import { Router } from 'express';
import { container } from '../di/container';
import { CartController } from '../controllers/cart/CartController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validateRequest } from '../middleware/validation';
import { Role } from '../types/rbac';
import { cartItemSchema } from '../validators/order.validator';

const router = Router();
const ctrl = container.resolve(CartController);

router.use(protect, authorize([Role.CUSTOMER]));

router.get('/', ctrl.getCart);
router.post('/items', validateRequest(cartItemSchema), ctrl.addItem);
router.delete('/items/:itemId', ctrl.removeItem);
router.delete('/', ctrl.clearCart);

export default router;
