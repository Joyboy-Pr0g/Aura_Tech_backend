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

export const expenseFiltersSchema = Joi.object({
  type: Joi.string().valid('expense', 'refund').optional(),
  limit: Joi.number().integer().min(1).max(100).default(20).optional(),
  cursor: Joi.string().optional(),
}).unknown(false);
