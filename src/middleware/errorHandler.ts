import { Request, Response, NextFunction } from 'express';
import { AppError } from '../core/errors/AppError';
import { APIResponse } from '../core/responses/api-response';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('[Error]', err.message);

  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json(APIResponse.error(err.message));
    return;
  }

  // Unexpected errors — never leak internals
  res.status(500).json(APIResponse.error('Internal server error'));
}
