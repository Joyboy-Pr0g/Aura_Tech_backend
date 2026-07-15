import Joi from 'joi';

export const createReviewSchema = Joi.object({
  product_id: Joi.string().uuid().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  title: Joi.string().min(3).max(100).required(),
  content: Joi.string().min(10).max(2000).required(),
  order_item_id: Joi.string().uuid().required(),
}).unknown(false);

export const askQuestionSchema = Joi.object({
  question: Joi.string().min(5).max(500).required(),
}).unknown(false);

export const wishlistSchema = Joi.object({
  product_id: Joi.string().uuid().required(),
}).unknown(false);
