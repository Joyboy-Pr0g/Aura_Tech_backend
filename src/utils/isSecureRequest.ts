import { Request } from 'express';

export function isSecureRequest(req: Request): boolean {
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  if (req.secure) {
    return true;
  }

  const forwardedProto = req.headers['x-forwarded-proto'];
  if (typeof forwardedProto === 'string') {
    return forwardedProto.split(',')[0]?.trim() === 'https';
  }

  return false;
}
