import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { REPOSITORY_TOKENS } from '../di/repository.tokens';
import { IPaymentBridgeRepository } from '../interfaces/repositories/IPaymentBridgeRepository';
import { comparePassword } from '../utils/password';
import { isSecureRequest } from '../utils/isSecureRequest';
import { APIResponse } from '../core/responses/api-response';
import { AppError } from '../core/errors/AppError';

@injectable()
export class PaymentDeviceAuthService {
  constructor(
    @inject(REPOSITORY_TOKENS.IPaymentBridgeRepository)
    private paymentBridgeRepo: IPaymentBridgeRepository,
  ) {}

  async authenticate(deviceUuid: string, apiKey: string) {
    const device = await this.paymentBridgeRepo.findDeviceByUuid(deviceUuid);
    if (!device) {
      throw new AppError(401, 'Device not registered');
    }

    if (!device.enabled) {
      throw new AppError(403, 'Device is disabled');
    }

    const validKey = await comparePassword(apiKey, device.api_key_hash);
    if (!validKey) {
      throw new AppError(401, 'Invalid device credentials');
    }

    await this.paymentBridgeRepo.touchDeviceLastSeen(device.id, new Date());

    return device;
  }
}

export function createAuthenticatePaymentDevice(authService: PaymentDeviceAuthService) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!isSecureRequest(req)) {
      res.status(403).json(APIResponse.error('HTTPS is required'));
      return;
    }

    const authHeader = req.headers.authorization;
    const deviceUuid = req.headers['x-device-id'];

    if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      res.status(401).json(APIResponse.error('Authentication required'));
      return;
    }

    if (typeof deviceUuid !== 'string' || !deviceUuid.trim()) {
      res.status(401).json(APIResponse.error('X-Device-Id header is required'));
      return;
    }

    const apiKey = authHeader.slice('Bearer '.length).trim();
    if (!apiKey) {
      res.status(401).json(APIResponse.error('Authentication required'));
      return;
    }

    try {
      req.paymentDevice = await authService.authenticate(deviceUuid.trim(), apiKey);
      next();
    } catch (err) {
      const status = err instanceof AppError ? err.statusCode : 401;
      const message = err instanceof Error ? err.message : 'Unauthorized';
      res.status(status).json(APIResponse.error(message));
    }
  };
}
