import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';
import { AdminDashboardService } from '../../services/admin';

@injectable()
export class AdminDashboardController {
    constructor(
        @inject(AdminDashboardService) private adminDashboardService: AdminDashboardService,
    ) { }

    dashboard = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
        try {
            const data = await this.adminDashboardService.getAdminDashboardData();
            res.json(APIResponse.success('Admin dashboard data', data));
        } catch (err) {
            res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
        }
    };
}