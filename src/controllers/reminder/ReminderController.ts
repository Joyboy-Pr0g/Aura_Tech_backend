import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { NotificationService } from '../../services/notification/NotificationService';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';

@injectable()
export class ReminderController {
  constructor(@inject(NotificationService) private notificationService: NotificationService) {}

  createProductReminder = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.notificationService.createStockReminder(
        req.user!.id,
        req.params.id,
        req.validatedData.variant_id ?? null,
      );
      res.status(201).json(APIResponse.success('Reminder created', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };
}
