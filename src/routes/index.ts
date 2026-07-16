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
// Admin before engagement: engagement is mounted at `/` and must not intercept /admin/*
router.use('/admin', adminRoutes);
router.use('/', engagementRoutes);

export default router;
