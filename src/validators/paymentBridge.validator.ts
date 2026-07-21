import Joi from 'joi';

const uuidSchema = Joi.string().uuid({ version: 'uuidv4' });

export const registerPaymentDeviceSchema = Joi.object({
  device_uuid: uuidSchema.required(),
  label: Joi.string().trim().max(100).optional().allow(null, ''),
}).unknown(false);

export const updatePaymentDeviceSchema = Joi.object({
  label: Joi.string().trim().max(100).optional().allow(null, ''),
  enabled: Joi.boolean().optional(),
}).unknown(false);

export const createPaymentProviderSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  aliases: Joi.array().items(Joi.string().trim().min(1).max(50)).default([]),
  is_active: Joi.boolean().default(true),
}).unknown(false);

export const updatePaymentProviderSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).optional(),
  aliases: Joi.array().items(Joi.string().trim().min(1).max(50)).optional(),
  is_active: Joi.boolean().optional(),
}).unknown(false);

export const ingestPaymentEventSchema = Joi.object({
  provider: Joi.string().trim().min(1).max(50).required(),
  senderAddress: Joi.string().trim().min(1).max(100).required(),
  receivedAt: Joi.string().isoDate().required(),
  rawMessage: Joi.string().trim().min(1).max(5000).required(),
}).unknown(false);
