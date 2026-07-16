import { Router } from 'express';
import { container } from '../../di/container';
import userRoutes from './user.route';
import categoryRoutes from './category.route';
import productRoutes from './product.route';
import paymentRoutes from './payment.route';
import shippingFeeRoutes from './shippingFee.route';
import { AdminDashboardController } from '../../controllers/admin/index';
import { protect } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { Role } from '../../types/rbac';

const router = Router();
const DashboardCtrl = container.resolve(AdminDashboardController);
const adminsMiddleware = [protect, authorize([Role.ADMIN, Role.SUB_ADMIN])];

router.use(...adminsMiddleware);

router.get('/', DashboardCtrl.dashboard);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/payments', paymentRoutes);
router.use('/shipping-fees', shippingFeeRoutes);

export default router;
