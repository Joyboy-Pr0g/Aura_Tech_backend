import Joi from 'joi';

export const createRefundRequestSchema = Joi.object({
  reason: Joi.string().trim().min(5).max(2000).required(),
}).unknown(false);

export const rejectRefundRequestSchema = Joi.object({
  rejection_reason: Joi.string().trim().min(3).max(1000).required(),
}).unknown(false);

export const refundRequestFiltersSchema = Joi.object({
  status: Joi.string().valid('pending', 'approved', 'rejected').optional(),
  order_number: Joi.string().trim().max(50).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20).optional(),
  cursor: Joi.string().optional(),
}).unknown(false);

export const createExpenseSchema = Joi.object({
  type: Joi.string().valid('expense', 'refund').required(),
  order_number: Joi.when('type', {
    is: 'refund',
    then: Joi.string().trim().min(3).max(50).required(),
    otherwise: Joi.string().trim().max(50).optional().allow(null, ''),
  }),
  amount: Joi.number().positive().precision(2).required(),
  reason: Joi.string().trim().min(3).max(2000).required(),
}).unknown(false);

const expenseQueryFields = {
  reason: Joi.string().trim().max(200).optional(),
  created_by_admin_id: Joi.string().uuid().optional(),
  from_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  order_id: Joi.string().uuid().optional(),
  order_number: Joi.string().trim().max(50).optional(),
};

export const expenseFiltersSchema = Joi.object({
  type: Joi.string().valid('expense', 'refund').optional(),
  limit: Joi.number().integer().min(1).max(100).default(20).optional(),
  cursor: Joi.string().optional(),
  ...expenseQueryFields,
}).unknown(false);

export const expenseTotalsSchema = Joi.object(expenseQueryFields).unknown(false);

export const updateExpenseSchema = Joi.object({
  amount: Joi.number().positive().precision(2).optional(),
  reason: Joi.string().trim().min(3).max(2000).optional(),
  order_number: Joi.string().trim().min(3).max(50).optional().allow(null, ''),
}).min(1).unknown(false);
