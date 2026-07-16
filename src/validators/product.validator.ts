import Joi from 'joi';

export const productFiltersSchema = Joi.object({
  category_id: Joi.string().uuid().optional(),
  sub_category_id: Joi.string().uuid().optional(),
  brand: Joi.string().max(100).optional(),
  min_price: Joi.number().min(0).optional(),
  max_price: Joi.number().min(0).optional(),
  in_stock: Joi.boolean().optional(),
  search: Joi.string().max(200).optional().allow(''),
  limit: Joi.number().integer().min(1).max(100).optional(),
  cursor: Joi.string().optional().allow(''),
  include_deleted: Joi.boolean().optional(),
}).unknown(false);

export const listProductsQuerySchema = Joi.object({
  category_id: Joi.string().uuid().optional(),
  sub_category_id: Joi.string().uuid().optional(),
  brand: Joi.string().max(100).optional(),
  min_price: Joi.number().min(0).optional(),
  max_price: Joi.number().min(0).optional(),
  in_stock: Joi.boolean().optional(),
  search: Joi.string().max(200).optional().allow(''),
  limit: Joi.number().integer().min(1).max(100).optional(),
  cursor: Joi.string().optional().allow(''),
}).unknown(false);

const productVariantSchema = Joi.object({
  id: Joi.string().uuid().optional(),
  sku: Joi.string().required(),
  size: Joi.string().optional().allow(null, ''),
  color: Joi.string().optional().allow(null, ''),
  price: Joi.number().positive().optional().allow(null),
  stock_quantity: Joi.number().integer().min(0).default(0),
  delete_image_public_id: Joi.string().optional().allow(null, ''),
});

export const createProductSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().min(10).required(),
  price: Joi.number().positive().precision(2).required(),
  category_id: Joi.string().uuid().required(),
  sub_category_id: Joi.string().uuid().optional().allow(null, ''),
  brand: Joi.string().max(100).optional().allow(null, ''),
  features: Joi.object().default({}),
  stock_quantity: Joi.number().integer().min(0).optional().default(0),
  variants: Joi.array().items(productVariantSchema).optional().default([]),
});

export const updateProductSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().min(10).optional(),
  price: Joi.number().positive().precision(2).optional(),
  category_id: Joi.string().uuid().optional(),
  sub_category_id: Joi.string().uuid().optional().allow(null, ''),
  brand: Joi.string().max(100).optional().allow(null, ''),
  features: Joi.object().optional(),
  stock_quantity: Joi.number().integer().min(0).optional(),
  deleteImagePublicIds: Joi.array().items(Joi.string()).optional().default([]),
  variants: Joi.array().items(productVariantSchema).optional(),
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
  is_active: Joi.boolean().optional(),
});

export const categoryFiltersSchema = Joi.object({
  search: Joi.string().max(200).optional().allow('', null),
  is_active: Joi.boolean().optional(),
  parent_category_id: Joi.string().uuid().optional().allow(null),
  cursor: Joi.string().optional().allow('', null),
  limit: Joi.number().integer().min(1).max(100).optional(),
  include_deleted: Joi.boolean().optional(),
}).unknown(false);

export const setPrimaryImageSchema = Joi.object({
  image_id: Joi.string().required(),
});

export const removeImageSchema = Joi.object({
  image_id: Joi.string().required(),
});
