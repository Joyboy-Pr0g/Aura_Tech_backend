import { Request, Response, NextFunction } from 'express';
import { Role } from '../types/rbac';
import { APIResponse } from '../core/responses/api-response';

export function authorize(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json(APIResponse.error('Access denied'));
      return;
    }
    next();
  };
}
