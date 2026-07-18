import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';
import { OrderService } from '../../services/order/OrderService';

@injectable()
export class AdminOrderController {
    constructor(
        @inject(OrderService) private orderService: OrderService,
    ) { }

    getOrders = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        try {
            const { status, search, cursor, limit } = req.validatedData;
            const orders = await this.orderService.getAdminOrders({
              status,
              search: search?.trim() || undefined,
              cursor,
              limit,
            });
            res.json(
              APIResponse.success('Orders fetched successfully', orders.items, {
                next_cursor: orders.next_cursor,
                has_more: orders.has_more,
              }),
            );
        } catch (err) {
            res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
        }
    };
}
