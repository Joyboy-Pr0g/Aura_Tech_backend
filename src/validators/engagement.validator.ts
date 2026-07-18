import Joi from 'joi';
import { DEFAULT_LIMIT } from '../utils/cursorPagination';

export const adminQuestionFiltersSchema = Joi.object({
  search: Joi.string().allow(null, '').max(100).optional(),
  cursor: Joi.string().allow(null, '').optional(),
  limit: Joi.number().integer().min(1).max(100).default(DEFAULT_LIMIT).optional(),
}).unknown(false);

export const answerQuestionSchema = Joi.object({
  answer: Joi.string().trim().min(2).max(2000).required(),
}).unknown(false);

export const userSubResourceQuerySchema = Joi.object({
  cursor: Joi.string().allow(null, '').optional(),
  limit: Joi.number().integer().min(1).max(50).default(20).optional(),
}).unknown(false);

export const wishlistSchema = Joi.object({
  product_id: Joi.string().uuid().required(),
}).unknown(false);

export const createReviewSchema = Joi.object({
  product_id: Joi.string().uuid().required(),
  order_item_id: Joi.string().uuid().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  title: Joi.string().trim().max(200).optional().allow(null, ''),
  content: Joi.string().trim().max(2000).optional().allow(null, ''),
}).unknown(false);

export const askQuestionSchema = Joi.object({
  question: Joi.string().trim().min(3).max(1000).required(),
}).unknown(false);
