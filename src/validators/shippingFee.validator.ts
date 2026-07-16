import Joi from 'joi';

export const createShippingFeeSchema = Joi.object({
  price: Joi.number().min(0).precision(2).required(),
  duration: Joi.string().min(1).max(100).required(),
  delivery_way: Joi.string().min(1).max(100).required(),
  is_active: Joi.boolean().optional(),
}).unknown(false);

export const updateShippingFeeSchema = Joi.object({
  price: Joi.number().min(0).precision(2).optional(),
  duration: Joi.string().min(1).max(100).optional(),
  delivery_way: Joi.string().min(1).max(100).optional(),
  is_active: Joi.boolean().optional(),
}).unknown(false);
