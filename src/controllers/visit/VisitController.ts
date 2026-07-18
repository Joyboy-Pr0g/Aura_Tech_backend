import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { AdminAnalyticsService } from '../../services/admin/AdminAnalyticsService';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';

@injectable()
export class VisitController {
  constructor(@inject(AdminAnalyticsService) private analyticsService: AdminAnalyticsService) {}

  log = async (req: Request, res: Response): Promise<void> => {
    try {
      const { path, visitor_id, referrer } = req.validatedData;
      await this.analyticsService.logVisit({
        visitorId: visitor_id ?? null,
        customerId: req.user?.id ?? null,
        path,
        referrer: referrer ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });
      res.status(201).json(APIResponse.success('Visit logged'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };
}
