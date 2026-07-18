import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';
import { AdminEngagementService } from '../../services/admin/AdminEngagementService';

@injectable()
export class AdminEngagementController {
  constructor(@inject(AdminEngagementService) private adminEngagementService: AdminEngagementService) {}

  listQuestions = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { search, limit, cursor } = req.validatedData;
      const page = await this.adminEngagementService.getQuestions({
        search: search?.trim() || undefined,
        limit: Math.min(Number(limit) || 20, 100),
        cursor,
      });
      res.json(
        APIResponse.success('Questions retrieved', page.items, {
          next_cursor: page.next_cursor,
          has_more: page.has_more,
        }),
      );
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  answerQuestion = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { answer } = req.validatedData;
      const saved = await this.adminEngagementService.answerQuestion(
        req.params.id,
        req.user!.id,
        answer,
      );
      res.status(201).json(APIResponse.success('Answer submitted', saved));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };
}
