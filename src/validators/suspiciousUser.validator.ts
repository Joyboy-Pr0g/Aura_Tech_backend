import Joi from 'joi';
import { DEFAULT_LIMIT } from '../utils/cursorPagination';

export const suspiciousUserListSchema = Joi.object({
  status: Joi.string().valid('open', 'dismissed', 'blocked', 'deleted').optional(),
  cursor: Joi.string().allow(null, '').optional(),
  limit: Joi.number().integer().min(1).max(50).default(DEFAULT_LIMIT).optional(),
}).unknown(false);

export const suspiciousUserReviewSchema = Joi.object({
  note: Joi.string().max(500).allow(null, '').optional(),
}).unknown(false);
