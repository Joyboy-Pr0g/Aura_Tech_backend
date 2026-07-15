import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';
import { AdminService } from '../../services/admin/AdminDashboardService';

@injectable()
export class AdminOrderController {
    constructor(
        @inject(AdminService) private adminService: AdminService,
    ) { }

    getOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { status, cursor, limit } = req.validatedData;
            const orders = await this.adminService.getOrders({ status, cursor, limit });
            res.json(APIResponse.success('Orders fetched successfully', orders));
        } catch (err) {
            res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
        }
    }
}