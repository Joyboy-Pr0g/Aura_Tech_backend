import { AppError } from '../errors/AppError';

export function getErrorStatusCode(error: unknown, defaultCode = 500): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  return defaultCode;
}
