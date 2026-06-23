import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../../services/payment/PaymentService';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';

@injectable()
export class PaymentController {
  constructor(@inject(PaymentService) private paymentService: PaymentService) {}

  getPaymentMethods = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const methods = await this.paymentService.getPaymentMethods();
      res.json(APIResponse.success('Payment methods retrieved', methods));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  submitPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

  getPaymentByOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payment = await this.paymentService.getPaymentByOrder(req.params.orderId, req.user!.id);
      res.json(APIResponse.success('Payment retrieved', payment));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  // Admin
  getPendingPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const result = await this.paymentService.getPendingPayments(page, limit);
      res.json(APIResponse.success('Pending payments retrieved', result));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  approvePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.paymentService.approvePayment(req.params.id, req.user!.id);
      res.json(APIResponse.success('Payment approved'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  rejectPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reason } = req.validatedData;
      await this.paymentService.rejectPayment(req.params.id, req.user!.id, reason);
      res.json(APIResponse.success('Payment rejected'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  createPaymentMethod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const method = await this.paymentService.createPaymentMethod(req.validatedData);
      res.status(201).json(APIResponse.success('Payment method created', method));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  updatePaymentMethod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.paymentService.updatePaymentMethod(req.params.id, req.validatedData);
      res.json(APIResponse.success('Payment method updated'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  deletePaymentMethod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.paymentService.deletePaymentMethod(req.params.id);
      res.json(APIResponse.success('Payment method deleted'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };
}
