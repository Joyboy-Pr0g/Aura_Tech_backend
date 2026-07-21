import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { PaymentBridgeService } from '../../services/paymentBridge/PaymentBridgeService';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';

@injectable()
export class PaymentBridgeController {
  constructor(@inject(PaymentBridgeService) private paymentBridgeService: PaymentBridgeService) {}

  getProviders = async (_req: Request, res: Response): Promise<void> => {
    try {
      const providers = await this.paymentBridgeService.listProvidersForDevice();
      res.json({ providers });
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  ingestEvent = async (req: Request, res: Response): Promise<void> => {
    try {
      const event = await this.paymentBridgeService.ingestSmsEvent(
        req.paymentDevice!.id,
        req.validatedData,
      );
      res.status(201).json(APIResponse.success('Payment event received', {
        id: event.id,
        provider: event.provider,
        received_at: event.received_at,
      }));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  ping = async (req: Request, res: Response): Promise<void> => {
    try {
      const message = this.paymentBridgeService.buildPingMessage(req.paymentDevice!.device_uuid);
      res.json({ message });
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };
}
