import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { ShippingFeeService } from '../../services/shipping/ShippingFeeService';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';

@injectable()
export class ShippingFeeController {
  constructor(@inject(ShippingFeeService) private shippingFeeService: ShippingFeeService) {}

  getActiveFees = async (_req: Request, res: Response): Promise<void> => {
    try {
      const fees = await this.shippingFeeService.getActiveFees();
      res.json(APIResponse.success('Shipping fees retrieved', fees));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };
}
