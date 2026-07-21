import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { PaymentBridgeService } from '../../services/paymentBridge/PaymentBridgeService';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';

@injectable()
export class AdminPaymentBridgeController {
  constructor(@inject(PaymentBridgeService) private paymentBridgeService: PaymentBridgeService) {}

  listDevices = async (_req: Request, res: Response): Promise<void> => {
    try {
      const devices = await this.paymentBridgeService.listDevices();
      res.json(APIResponse.success('Payment devices fetched', devices.map(sanitizeDevice)));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  registerDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const { device, api_key } = await this.paymentBridgeService.registerDevice(
        req.validatedData.device_uuid,
        req.validatedData.label,
      );
      res.status(201).json(APIResponse.success('Payment device registered', {
        ...sanitizeDevice(device),
        api_key,
      }));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  updateDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const device = await this.paymentBridgeService.updateDevice(req.params.id, req.validatedData);
      res.json(APIResponse.success('Payment device updated', sanitizeDevice(device)));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  deleteDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.paymentBridgeService.deleteDevice(req.params.id);
      res.json(APIResponse.success('Payment device deleted'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  listProviders = async (_req: Request, res: Response): Promise<void> => {
    try {
      const providers = await this.paymentBridgeService.listProvidersAdmin();
      res.json(APIResponse.success('Payment providers fetched', providers));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  createProvider = async (req: Request, res: Response): Promise<void> => {
    try {
      const provider = await this.paymentBridgeService.createProvider(req.validatedData);
      res.status(201).json(APIResponse.success('Payment provider created', provider));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  updateProvider = async (req: Request, res: Response): Promise<void> => {
    try {
      const provider = await this.paymentBridgeService.updateProvider(req.params.id, req.validatedData);
      res.json(APIResponse.success('Payment provider updated', provider));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  deleteProvider = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.paymentBridgeService.deleteProvider(req.params.id);
      res.json(APIResponse.success('Payment provider deleted'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };
}

function sanitizeDevice(device: {
  id: string;
  device_uuid: string;
  label: string | null;
  enabled: boolean;
  last_seen: Date | null;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    id: device.id,
    device_uuid: device.device_uuid,
    label: device.label,
    enabled: device.enabled,
    last_seen: device.last_seen,
    created_at: device.created_at,
    updated_at: device.updated_at,
  };
}
