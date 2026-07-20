import Joi from 'joi';

export const deviceTokenSchema = Joi.object({
  token: Joi.string().min(10).max(500).required(),
  platform: Joi.string().max(50).optional(),
}).unknown(false);

export const validateCouponSchema = Joi.object({
  code: Joi.string().trim().min(2).max(50).required(),
  subtotal: Joi.number().min(0).precision(2).required(),
  items: Joi.array().items(
    Joi.object({
      product_id: Joi.string().uuid().required(),
      category_id: Joi.string().uuid().required(),
      sub_category_id: Joi.string().uuid().optional().allow(null),
      line_total: Joi.number().min(0).precision(2).required(),
    }),
  ).optional(),
}).unknown(false);

export const createCouponSchema = Joi.object({
  code: Joi.string().trim().min(2).max(50).required(),
  discount_type: Joi.string().valid('percentage', 'fixed_amount').required(),
  discount_value: Joi.number().positive().precision(2).required(),
  max_uses: Joi.number().integer().min(1).optional().allow(null),
  min_purchase_amount: Joi.number().min(0).precision(2).default(0),
  max_discount_amount: Joi.number().min(0).precision(2).optional().allow(null),
  expires_at: Joi.date().iso().optional().allow(null),
  is_active: Joi.boolean().default(true),
  category_id: Joi.string().uuid().optional().allow(null),
  sub_category_id: Joi.string().uuid().optional().allow(null),
  product_id: Joi.string().uuid().optional().allow(null),
}).unknown(false);

export const updateCouponSchema = createCouponSchema.fork(
  ['code', 'discount_type', 'discount_value'],
  (s) => s.optional(),
);

export const stockReminderSchema = Joi.object({
  variant_id: Joi.string().uuid().optional().allow(null),
}).unknown(false);

export const logVisitSchema = Joi.object({
  path: Joi.string().max(500).required(),
  visitor_id: Joi.string().max(100).optional().allow(null, ''),
  referrer: Joi.string().max(500).optional().allow(null, ''),
}).unknown(false);

export const analyticsDateRangeSchema = Joi.object({
  from_date: Joi.date().iso().required(),
  to_date: Joi.date().iso().required(),
}).unknown(false);

export const analyticsLimitSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20).optional(),
}).unknown(false);

export const analyticsCustomersSchema = Joi.object({
  sort: Joi.string().valid('lifetime_value', 'order_count').default('lifetime_value').optional(),
  limit: Joi.number().integer().min(1).max(100).default(50).optional(),
}).unknown(false);

export const inventoryLogsSchema = Joi.object({
  product_id: Joi.string().uuid().optional(),
  reason: Joi.string().valid(
    'order_placed',
    'order_cancelled',
    'order_delivered',
    'restock',
    'return_received',
    'adjustment',
  ).optional(),
  changed_by_id: Joi.string().uuid().optional(),
  limit: Joi.number().integer().min(1).max(100).default(50).optional(),
}).unknown(false);

export const paymentHistorySchema = Joi.object({
  status: Joi.string().valid('pending', 'approved', 'rejected', 'refunded', 'manual_approved').optional(),
  from_date: Joi.date().iso().optional(),
  to_date: Joi.date().iso().optional(),
  limit: Joi.number().integer().min(1).max(100).default(50).optional(),
}).unknown(false);

export const analyticsFinancialSchema = Joi.object({
  from_date: Joi.date().iso().optional(),
  to_date: Joi.date().iso().optional(),
}).unknown(false);

export const expenseHistorySchema = Joi.object({
  from_date: Joi.date().iso().optional(),
  to_date: Joi.date().iso().optional(),
  limit: Joi.number().integer().min(1).max(100).default(50).optional(),
}).unknown(false);

export const latestActionLogsSchema = Joi.object({
  entity_type: Joi.string().valid('product', 'category', 'order', 'payment', 'coupon', 'blog', 'refund_request').required(),
  ids: Joi.string().required(),
}).unknown(false);
