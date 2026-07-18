import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { RefundRequestService } from '../../services/refund/RefundRequestService';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';

@injectable()
export class RefundRequestController {
  constructor(@inject(RefundRequestService) private refundService: RefundRequestService) {}

  getMyOrderRefundRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.refundService.getForCustomerOrder(
        req.user!.id,
        req.params.orderNumber,
      );
      res.json(APIResponse.success('Refund request fetched', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  createMyOrderRefundRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.refundService.createRequest(
        req.user!.id,
        req.params.orderNumber,
        req.validatedData.reason,
        req.file,
      );
      res.status(201).json(APIResponse.success('Refund request submitted', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };
}

@injectable()
export class AdminRefundRequestController {
  constructor(@inject(RefundRequestService) private refundService: RefundRequestService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.refundService.listAdmin(req.validatedData);
      res.json(APIResponse.success('Refund requests fetched', data.items, {
        next_cursor: data.next_cursor,
        has_more: data.has_more,
      }));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  approve = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.refundService.approve(req.params.id, req.user!.id);
      res.json(APIResponse.success('Refund request approved', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  reject = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.refundService.reject(
        req.params.id,
        req.user!.id,
        req.validatedData.rejection_reason,
      );
      res.json(APIResponse.success('Refund request rejected', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };
}
