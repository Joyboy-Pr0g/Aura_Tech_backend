import rateLimit from 'express-rate-limit';
import { APIResponse } from '../core/responses/api-response';

function createAuthActionLimiter(max: number, windowMs: number, message: string) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json(APIResponse.error(message));
    },
  });
}

export const registrationEmailSendLimiter = createAuthActionLimiter(
  12,
  60 * 60 * 1000,
  'Too many verification requests. Please try again later.',
);

export const registrationEmailVerifyLimiter = createAuthActionLimiter(
  30,
  60 * 60 * 1000,
  'Too many verification attempts. Please try again later.',
);

export const forgotPasswordLimiter = createAuthActionLimiter(
  8,
  60 * 60 * 1000,
  'Too many password reset requests. Please try again later.',
);
