import Joi from 'joi';

const optionalText = Joi.string().allow('', null).max(500).optional();
const optionalLongText = Joi.string().allow('', null).max(2000).optional();

export const updateWebsiteSettingsSchema = Joi.object({
  title: Joi.string().max(200).optional(),
  website_email: Joi.string().email().allow('', null).optional(),
  website_phone: Joi.string().max(30).allow('', null).optional(),
  facebook: optionalText,
  instagram: optionalText,
  whatsapp: optionalText,
  tiktok: optionalText,
  description: optionalLongText,
  meta_title: Joi.string().allow('', null).max(200).optional(),
  meta_description: optionalLongText,
  meta_keywords: optionalLongText,
  site_url: Joi.string().pattern(/^https?:\/\/.+/).allow('', null).optional(),
  twitter_card: Joi.string().valid('summary', 'summary_large_image').optional(),
  twitter_handle: Joi.string().allow('', null).max(100).optional(),
  default_locale: Joi.string().allow('', null).max(10).optional(),
  theme_color: Joi.string().allow('', null).max(20).optional(),
  robots: Joi.string().allow('', null).max(100).optional(),
  sar_to_yer: Joi.alternatives()
    .try(Joi.number().precision(2).positive().max(99999999.99), Joi.string().pattern(/^\d+(\.\d{1,2})?$/), Joi.valid('', null))
    .optional(),
  remove_header_logo: Joi.boolean().truthy('true').falsy('false').optional(),
  remove_footer_logo: Joi.boolean().truthy('true').falsy('false').optional(),
  remove_favicon: Joi.boolean().truthy('true').falsy('false').optional(),
  remove_og_image: Joi.boolean().truthy('true').falsy('false').optional(),
}).unknown(false);
