import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { AdminSuspiciousUserService } from '../../services/admin/AdminSuspiciousUserService';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';

@injectable()
export class AdminSuspiciousUserController {
  constructor(
    @inject(AdminSuspiciousUserService)
    private suspiciousUserService: AdminSuspiciousUserService,
  ) {}

  async list(req: Request, res: Response): Promise<void> {
    try {
      const { status, cursor, limit } = req.validatedData ?? {};
      const result = await this.suspiciousUserService.listReports({
        status: status as 'open' | 'dismissed' | 'blocked' | 'deleted' | undefined,
        cursor: typeof cursor === 'string' ? cursor : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      res.status(200).json(APIResponse.success('Suspicious users fetched', result));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(
        APIResponse.error(err instanceof Error ? err.message : 'Failed to fetch suspicious users'),
      );
    }
  }

  async dismiss(req: Request, res: Response): Promise<void> {
    try {
      const report = await this.suspiciousUserService.dismissReport(
        req.params.id,
        req.user!.id,
        req.validatedData?.note,
      );
      res.status(200).json(APIResponse.success('Suspicious user report dismissed', report));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(
        APIResponse.error(err instanceof Error ? err.message : 'Failed to dismiss report'),
      );
    }
  }

  async block(req: Request, res: Response): Promise<void> {
    try {
      const report = await this.suspiciousUserService.blockUserFromReport(
        req.params.id,
        req.user!.id,
        req.validatedData?.note,
      );
      res.status(200).json(APIResponse.success('User blocked from suspicious activity report', report));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(
        APIResponse.error(err instanceof Error ? err.message : 'Failed to block user'),
      );
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const report = await this.suspiciousUserService.deleteUserFromReport(
        req.params.id,
        req.user!.id,
        req.validatedData?.note,
      );
      res.status(200).json(APIResponse.success('User deleted from suspicious activity report', report));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(
        APIResponse.error(err instanceof Error ? err.message : 'Failed to delete user'),
      );
    }
  }
}
