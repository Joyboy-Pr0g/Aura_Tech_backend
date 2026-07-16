import Joi from 'joi';
import { DEFAULT_LIMIT } from '../utils/cursorPagination';

export const cartItemSchema = Joi.object({
  product_id: Joi.string().uuid().required(),
  variant_id: Joi.string().uuid().optional(),
  quantity: Joi.number().integer().min(1).max(100).required(),
});

export const editQuantitySchema = Joi.object({
  itemId: Joi.string().uuid().required(),
  quantity: Joi.number().integer().min(1).max(100).required(),
});

export const checkoutSchema = Joi.object({
  shipping_address_id: Joi.string().uuid().optional(),
  billing_address_id: Joi.string().uuid().required(),
  shipping_fee_id: Joi.string().uuid().required(),
  notes: Joi.string().max(500).optional(),
});

export const submitPaymentSchema = Joi.object({
  payment_method_id: Joi.string().uuid().required(),
}).unknown(false);

export const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('payment_confirmed', 'processing', 'ready_to_ship', 'shipped', 'delivered', 'cancelled', 'refunded')
    .required(),
  reason: Joi.string().max(500).optional(),
});

export const rejectPaymentSchema = Joi.object({
  reason: Joi.string().min(5).max(500).required(),
});

export const orderFiltersSchema = Joi.object({
  status: Joi.string().valid('payment_confirmed', 'processing', 'ready_to_ship', 'shipped', 'delivered', 'cancelled', 'refunded').optional(),
  cursor: Joi.string().allow(null, '').optional(),
  limit: Joi.number().default(DEFAULT_LIMIT).optional(),
}).unknown(false);

export const paymentFiltersQuerySchema = Joi.object({
  order_id: Joi.string().uuid().optional(),
  payment_method_id: Joi.string().uuid().optional(),
  status: Joi.string().valid('pending', 'approved', 'rejected', 'refunded').optional(),
  min_amount: Joi.number().min(0).precision(2).optional(),
  max_amount: Joi.number().min(0).precision(2).optional(),
  cursor: Joi.string().allow(null, '').optional(),
  limit: Joi.number().integer().min(1).max(100).default(DEFAULT_LIMIT).optional(),
}).unknown(false);

export const addressSchema = Joi.object({
  label: Joi.string().max(50).required(),
  full_name: Joi.string().max(100).required(),
  phone: Joi.string().max(20).required(),
  city: Joi.string().max(100).required(),
  governorate: Joi.string().max(100).required(),
  district: Joi.string().max(100).optional(),
  street_address: Joi.string().max(500).required(),
  postal_code: Joi.string().max(20).optional(),
  type: Joi.string().valid('shipping', 'billing', 'both').default('both'),
  is_default: Joi.boolean().default(false),
});

export const paymentMethodSchema = Joi.object({
  name: Joi.string().max(100).required(),
  bank_name: Joi.string().max(100).required(),
  account_number: Joi.string().max(50).optional(),
  iban: Joi.string().max(50).optional(),
  description: Joi.string().max(500).optional(),
});

export const updatePaymentMethodSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  bank_name: Joi.string().max(100).optional(),
  account_number: Joi.string().max(50).optional(),
  iban: Joi.string().max(50).optional(),
  description: Joi.string().max(500).optional(),
  is_active: Joi.boolean().optional(),
});
