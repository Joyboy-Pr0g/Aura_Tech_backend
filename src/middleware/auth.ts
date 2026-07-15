import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { getRedisClient } from '../config/redis';
import { APIResponse } from '../core/responses/api-response';

export async function protect(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json(APIResponse.error('Authentication required'));
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify JWT first — cheapest check
    const payload = verifyToken(token);

    // Check Redis blacklist (fail-open if Redis is down)
    try {
      const isBlacklisted = await getRedisClient().get(`blacklist:${token}`);
      if (isBlacklisted) {
        res.status(401).json(APIResponse.error('Token has been revoked'));
        return;
      }
    } catch {
      // Redis unavailable — log and continue (fail-open per architecture spec)
      console.warn('[auth] Redis unavailable, skipping blacklist check');
    }

    req.user = {
      id: payload.user_id,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch {
    res.status(401).json(APIResponse.error('Invalid or expired token'));
  }
}

export function optionalProtect(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.user_id,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch {
    next();
  }
}
