import { Router } from 'express';
import authRoutes from './auth.routes';
import categoryRoutes from './category.routes';
import productRoutes from './product.routes';
import cartRoutes from './cart.routes';
import orderRoutes from './order.routes';
import paymentRoutes from './payment.routes';
import addressRoutes from './address.routes';
import engagementRoutes from './engagement.routes';
import shippingFeeRoutes from './shippingFee.routes';
import websiteSettingsRoutes from './websiteSettings.routes';
import searchRoutes from './search.routes';
import notificationRoutes from './notification.routes';
import reminderRoutes from './reminder.routes';
import couponRoutes from './coupon.routes';
import visitRoutes from './visit.routes';
import blogRoutes from './blog.routes';
import adminRoutes from './admin';

const router = Router();

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/addresses', addressRoutes);
router.use('/shipping-fees', shippingFeeRoutes);
router.use('/website-settings', websiteSettingsRoutes);
router.use('/search-queries', searchRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reminders', reminderRoutes);
router.use('/coupons', couponRoutes);
router.use('/visits', visitRoutes);
router.use('/blogs', blogRoutes);
// Admin before engagement: engagement is mounted at `/` and must not intercept /admin/*
router.use('/admin', adminRoutes);
router.use('/', engagementRoutes);

export default router;
