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
      const { shipping_address_id, billing_address_id, shipping_fee_id, notes, payment_type, coupon_code } = req.validatedData;
      const order = await this.orderService.createFromCart(
        req.user!.id,
        shipping_address_id ?? null,
        billing_address_id ?? null,
        shipping_fee_id,
        notes ?? null,
        payment_type,
        coupon_code?.trim() || null,
      );
      res.status(201).json(APIResponse.success('Order created successfully', order));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  getMyOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, search, limit, cursor } = req.validatedData;
      const page = await this.orderService.getMyOrders(req.user!.id, {
        status,
        search: search?.trim() || undefined,
        limit: Math.min(Number(limit) || 10, 50),
        cursor,
      });
      res.json(
        APIResponse.success('Orders retrieved', page.items, {
          next_cursor: page.next_cursor,
          has_more: page.has_more,
        }),
      );
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  getMyOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await this.orderService.getOrderByCustomerIdAndOrderNumber(req.user!.id, req.params.orderNumber);
      res.json(APIResponse.success('Order retrieved', order));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  // Admin
  listAllOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, search, limit, cursor } = req.validatedData;
      const page = await this.orderService.getAdminOrders({
        status,
        search: search?.trim() || undefined,
        limit: Math.min(Number(limit) || 20, 100),
        cursor,
      });
      res.json(
        APIResponse.success('Orders retrieved', page.items, {
          next_cursor: page.next_cursor,
          has_more: page.has_more,
        }),
      );
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  getAdminOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await this.orderService.getOrderById(req.params.id);
      res.json(APIResponse.success('Order retrieved', order));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  getAdminOrderHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const history = await this.orderService.getStatusHistory(req.params.id);
      res.json(APIResponse.success('Order history fetched', history));
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
