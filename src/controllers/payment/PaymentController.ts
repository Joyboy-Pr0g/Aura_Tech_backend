import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../../services/payment/PaymentService';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';

@injectable()
export class PaymentController {
  constructor(@inject(PaymentService) private paymentService: PaymentService) {}

  getPaymentMethods = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const methods = await this.paymentService.getPaymentMethods();
      res.json(APIResponse.success('Payment methods retrieved', methods));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  submitPayment = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      if (!req.file) throw { statusCode: 400, message: 'Receipt file is required' };
      const payment = await this.paymentService.submitPayment(
        req.user!.id,
        req.params.orderId,
        req.file,
      );
      res.status(201).json(APIResponse.success('Payment submitted successfully', payment));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  getPaymentByOrder = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const payment = await this.paymentService.getPaymentByOrder(req.params.orderId, req.user!.id);
      res.json(APIResponse.success('Payment retrieved', payment));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };
}
