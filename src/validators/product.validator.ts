import Joi from 'joi';

export const createProductSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().min(10).required(),
  price: Joi.number().positive().precision(2).required(),
  category_id: Joi.string().uuid().required(),
  brand: Joi.string().max(100).optional().allow(null, ''),
  features: Joi.object().default({}),
  variants: Joi.array()
    .items(
      Joi.object({
        sku: Joi.string().required(),
        size: Joi.string().optional().allow(null, ''),
        color: Joi.string().optional().allow(null, ''),
        price: Joi.number().positive().optional().allow(null),
        stock_quantity: Joi.number().integer().min(0).default(0),
      }),
    )
    .optional()
    .default([]),
});

export const updateProductSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().min(10).optional(),
  price: Joi.number().positive().precision(2).optional(),
  category_id: Joi.string().uuid().optional(),
  brand: Joi.string().max(100).optional().allow(null, ''),
  features: Joi.object().optional(),
  deleteImagePublicIds: Joi.array().items(Joi.string()).optional().default([]),
});

export const addStockSchema = Joi.object({
  quantity: Joi.number().integer().positive().required(),
  variant_id: Joi.string().uuid().optional().allow(null),
  notes: Joi.string().max(500).optional().allow('', null),
});

export const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional().allow('', null),
  parent_category_id: Joi.string().uuid().optional().allow(null),
  is_active: Joi.boolean().optional().default(true),
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(500).optional().allow('', null),
  parent_category_id: Joi.string().uuid().optional().allow(null),
});
