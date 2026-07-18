import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { NotificationService } from '../../services/notification/NotificationService';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';

@injectable()
export class NotificationController {
  constructor(@inject(NotificationService) private notificationService: NotificationService) {}

  registerDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.notificationService.registerDeviceToken(
        req.user!.id,
        req.validatedData.token,
        req.validatedData.platform,
      );
      res.status(201).json(APIResponse.success('Device token registered'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.notificationService.getMyNotifications(req.user!.id);
      res.json(APIResponse.success('Notifications fetched', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  markRead = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.notificationService.markAsRead(req.params.id, req.user!.id);
      res.json(APIResponse.success('Notification marked as read'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };
}
