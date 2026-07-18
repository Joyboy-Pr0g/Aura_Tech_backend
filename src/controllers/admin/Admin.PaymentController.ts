import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';
import { PaymentService } from '../../services/payment/PaymentService';

@injectable()
export class AdminPaymentController {
  constructor(@inject(PaymentService) private paymentService: PaymentService) {}

  getPayments = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { search, payment_method_id, status, min_amount, max_amount, limit, cursor } = req.validatedData;
      const page = await this.paymentService.getPayments({
        search: search?.trim() || undefined,
        payment_method_id,
        status,
        min_amount,
        max_amount,
        limit,
        cursor,
      });
      res.json(
        APIResponse.success('Payments retrieved', page.items, {
          next_cursor: page.next_cursor,
          has_more: page.has_more,
        }),
      );
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  getPaymentByOrder = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const payment = await this.paymentService.getPaymentByOrder(req.params.orderId);
      res.json(APIResponse.success('Payment retrieved', payment));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  approvePayment = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      await this.paymentService.approvePayment(req.params.id, req.user!.id);
      res.json(APIResponse.success('Payment approved'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  rejectPayment = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { reason } = req.validatedData;
      await this.paymentService.rejectPayment(req.params.id, req.user!.id, reason);
      res.json(APIResponse.success('Payment rejected'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  createManualPayment = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { order_number, amount } = req.validatedData;
      const payment = await this.paymentService.createManualPayment(
        req.user!.id,
        order_number,
        amount,
      );
      res.status(201).json(APIResponse.success('Payment recorded', payment));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  getPaymentMethods = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const methods = await this.paymentService.getPaymentMethods();
      res.json(APIResponse.success('Payment methods retrieved', methods));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  createPaymentMethod = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const method = await this.paymentService.createPaymentMethod(req.validatedData);
      res.status(201).json(APIResponse.success('Payment method created', method));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  updatePaymentMethod = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      await this.paymentService.updatePaymentMethod(req.params.id, req.validatedData);
      res.json(APIResponse.success('Payment method updated'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  deletePaymentMethod = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      await this.paymentService.deletePaymentMethod(req.params.id);
      res.json(APIResponse.success('Payment method deleted'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };
}
