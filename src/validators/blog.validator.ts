import Joi from 'joi';
import { toSlug } from '../utils/slug';

export const createBlogSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  slug: Joi.string().allow('', null).max(220).optional(),
  excerpt: Joi.string().allow('', null).max(500).optional(),
  content: Joi.string().min(10).max(50000).required(),
  meta_title: Joi.string().allow('', null).max(200).optional(),
  meta_description: Joi.string().allow('', null).max(500).optional(),
  is_published: Joi.boolean().optional(),
  remove_cover_image: Joi.boolean().truthy('true').falsy('false').optional(),
}).unknown(false);

export const updateBlogSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  slug: Joi.string().allow('', null).max(220).optional(),
  excerpt: Joi.string().allow('', null).max(500).optional(),
  content: Joi.string().min(10).max(50000).optional(),
  meta_title: Joi.string().allow('', null).max(200).optional(),
  meta_description: Joi.string().allow('', null).max(500).optional(),
  is_published: Joi.boolean().optional(),
  remove_cover_image: Joi.boolean().truthy('true').falsy('false').optional(),
}).unknown(false);

export function blogToSlug(value: string): string {
  return toSlug(value);
}
