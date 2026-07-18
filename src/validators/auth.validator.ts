import Joi from "joi";
import { DEFAULT_LIMIT } from "../utils/cursorPagination";

export const registerSchema = Joi.object({
  full_name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string()
    .min(8)
    .max(64)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      "string.pattern.base":
        "Password must have at least one uppercase letter, one lowercase letter, and one digit",
    }),
  confirm_password: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({ 'any.only': 'Passwords do not match' }),
  phone: Joi.string()
    .pattern(/^(\+967|0)(7[0137]\d{7})$/)
    .messages({
      "string.pattern.base": "Invalid phone number format, valid Yemeni mobile number required (e.g., +9677XXXXXXXX or 07XXXXXXXX).",
      "any.required": "Phone number is required",
    })
    .required(),
}).unknown(false);

export const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
}).unknown(false);

export const userFiltersSchema = Joi.object({
  role: Joi.string().valid('admin','sub_admin', 'customer').optional(),
  search: Joi.string().allow(null, '').optional(),
  cursor: Joi.string().allow(null, '').optional(),
  limit: Joi.number().default(DEFAULT_LIMIT).optional(),
  include_deleted: Joi.boolean().truthy('true', '1').falsy('false', '0', '').default(false).optional(),
}).unknown(false);

export const createUserSchema = Joi.object({
  full_name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
  phone: Joi.string().pattern(/^(\+967|0)(7[0137]\d{7})$/).messages({
    "string.pattern.base": "Invalid phone number format, valid Yemeni mobile number required (e.g., +9677XXXXXXXX or 07XXXXXXXX).",
    "any.required": "Phone number is required",
  }).required(),
  role: Joi.string().valid('admin', 'sub_admin', 'customer').required(),
}).unknown(false);

export const updateUserSchema = Joi.object({
  full_name: Joi.string().min(3).max(50).required(),
}).unknown(false);

export const updateProfileSchema = Joi.object({
  full_name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().lowercase().trim().required(),
  phone: Joi.string()
    .pattern(/^(\+967|0)(7[0137]\d{7})$/)
    .messages({
      'string.pattern.base':
        'Invalid phone number format, valid Yemeni mobile number required (e.g., +9677XXXXXXXX or 07XXXXXXXX).',
    })
    .required(),
}).unknown(false);

export const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string()
    .min(8)
    .max(64)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .invalid(Joi.ref('current_password'))
    .required()
    .messages({
      'string.pattern.base':
        'Password must have at least one uppercase letter, one lowercase letter, and one digit',
      'any.invalid': 'New password must be different from the current password',
    }),
  confirm_password: Joi.string()
    .valid(Joi.ref('new_password'))
    .required()
    .messages({ 'any.only': 'Passwords do not match' }),
}).unknown(false);

export const sendEmailVerificationSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
}).unknown(false);

export const verifyEmailChangeSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  code: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
    'string.length': 'Verification code must be 6 digits',
    'string.pattern.base': 'Verification code must be 6 digits',
  }),
}).unknown(false);

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
}).unknown(false);
