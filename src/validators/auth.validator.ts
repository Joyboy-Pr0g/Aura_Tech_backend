import Joi from "joi";

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
