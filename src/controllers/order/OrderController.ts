import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../../services/order/OrderService';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';

@injectable()
export class OrderController {
  constructor(@inject(OrderService) private orderService: OrderService) {}

  checkout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { shipping_address_id, billing_address_id, notes } = req.validatedData;
      const order = await this.orderService.createFromCart(
        req.user!.id,
        shipping_address_id ?? null,
        billing_address_id ?? null,
        notes ?? null,
      );
      res.status(201).json(APIResponse.success('Order created successfully', order));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  getMyOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Math.min(Number(req.query.limit) || 10, 50);
      const result = await this.orderService.getMyOrders(req.user!.id, page, limit);
      res.json(APIResponse.success('Orders retrieved', result));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  getMyOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await this.orderService.getOrderById(req.params.id, req.user!.id);
      res.json(APIResponse.success('Order retrieved', order));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  // Admin
  listAllOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const status = req.query.status as any;
      const result = await this.orderService.getAdminOrders({ status, page, limit });
      res.json(APIResponse.success('Orders retrieved', result));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  updateOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, reason } = req.validatedData;
      const order = await this.orderService.updateStatus(req.params.id, status, req.user!.id, reason ?? null);
      res.json(APIResponse.success('Order status updated', order));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };
}
