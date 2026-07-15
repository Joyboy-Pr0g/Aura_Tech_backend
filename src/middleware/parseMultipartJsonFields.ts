import { Request, Response, NextFunction } from 'express';

export function parseMultipartJsonFields(fields: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    for (const field of fields) {
      const value = req.body[field];
      if (typeof value === 'string' && (value.trim().startsWith('{') || value.trim().startsWith('['))) {
        try {
          req.body[field] = JSON.parse(value);
        } catch {
          // leave as string; Joi validation will surface the error
        }
      }
    }
    next();
  };
}
