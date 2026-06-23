import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { APIResponse } from '../core/responses/api-response';

export function validateRequest(schema: Joi.Schema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const message = error.details.map((d) => d.message).join('; ');
      res.status(400).json(APIResponse.error(message));
      return;
    }

    req.validatedData = value;
    next();
  };
}
