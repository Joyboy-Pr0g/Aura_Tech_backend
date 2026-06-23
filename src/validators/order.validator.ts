import Joi from 'joi';

export const cartItemSchema = Joi.object({
  product_id: Joi.string().uuid().required(),
  variant_id: Joi.string().uuid().optional(),
  quantity: Joi.number().integer().min(1).max(100).required(),
});

export const checkoutSchema = Joi.object({
  shipping_address_id: Joi.string().uuid().optional(),
  billing_address_id: Joi.string().uuid().optional(),
  notes: Joi.string().max(500).optional(),
});

export const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('payment_confirmed', 'processing', 'ready_to_ship', 'shipped', 'delivered', 'cancelled', 'refunded')
    .required(),
  reason: Joi.string().max(500).optional(),
});

export const rejectPaymentSchema = Joi.object({
  reason: Joi.string().min(5).max(500).required(),
});

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
