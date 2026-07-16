import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { ShippingFeeService } from '../../services/shipping/ShippingFeeService';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';

@injectable()
export class AdminShippingFeeController {
  constructor(@inject(ShippingFeeService) private shippingFeeService: ShippingFeeService) {}

  getFees = async (_req: Request, res: Response): Promise<void> => {
    try {
      const fees = await this.shippingFeeService.getAllFees();
      res.json(APIResponse.success('Shipping fees retrieved', fees));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  getFeeById = async (req: Request, res: Response): Promise<void> => {
    try {
      const fee = await this.shippingFeeService.getFeeById(req.params.id);
      res.json(APIResponse.success('Shipping fee retrieved', fee));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  createFee = async (req: Request, res: Response): Promise<void> => {
    try {
      const fee = await this.shippingFeeService.createFee(req.validatedData);
      res.status(201).json(APIResponse.success('Shipping fee created', fee));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  updateFee = async (req: Request, res: Response): Promise<void> => {
    try {
      const fee = await this.shippingFeeService.updateFee(req.params.id, req.validatedData);
      res.json(APIResponse.success('Shipping fee updated', fee));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  deleteFee = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.shippingFeeService.deleteFee(req.params.id);
      res.json(APIResponse.success('Shipping fee deleted'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  activateFee = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.shippingFeeService.activateFee(req.params.id);
      res.json(APIResponse.success('Shipping fee activated'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  deactivateFee = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.shippingFeeService.deactivateFee(req.params.id);
      res.json(APIResponse.success('Shipping fee deactivated'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };
}
