import { Router } from 'express';
import { container } from '../../di/container';
import userRoutes from './user.route';
import categoryRoutes from './category.route';
import productRoutes from './product.route';
import paymentRoutes from './payment.route';
import shippingFeeRoutes from './shippingFee.route';
import websiteSettingsRoutes from './websiteSettings.route';
import questionRoutes from './question.route';
import analyticsRoutes from './analytics.route';
import couponRoutes from './coupon.route';
import blogRoutes from './blog.route';
import actionLogRoutes from './actionLog.route';
import refundRequestRoutes from './refundRequest.route';
import expenseRoutes from './expense.route';
import { AdminDashboardController } from '../../controllers/admin/index';
import { protect } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { Role } from '../../types/rbac';

const router = Router();
const DashboardCtrl = container.resolve(AdminDashboardController);
const adminsMiddleware = [protect, authorize([Role.ADMIN, Role.SUB_ADMIN])];

router.use(...adminsMiddleware);

router.get('/', DashboardCtrl.dashboard);
router.get('/nav-badges', DashboardCtrl.navBadges);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/payments', paymentRoutes);
router.use('/shipping-fees', shippingFeeRoutes);
router.use('/website-settings', websiteSettingsRoutes);
router.use('/questions', questionRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/coupons', couponRoutes);
router.use('/blogs', blogRoutes);
router.use('/action-logs', actionLogRoutes);
router.use('/refund-requests', refundRequestRoutes);
router.use('/expenses', expenseRoutes);

export default router;
