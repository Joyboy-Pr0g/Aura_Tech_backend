import { Request, Response, NextFunction } from 'express';
import { Role } from '../types/rbac';
import { APIResponse } from '../core/responses/api-response';

export function authorize(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.user?.role;
    if (!role || !allowedRoles.includes(role)) {
      res.status(403).json(APIResponse.error('Access denied'));
      return;
    }
    next();
  };
}
