import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { WebsiteSettingsService } from '../../services/websiteSettings/WebsiteSettingsService';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';

@injectable()
export class WebsiteSettingsController {
  constructor(@inject(WebsiteSettingsService) private websiteSettingsService: WebsiteSettingsService) {}

  getSettings = async (_req: Request, res: Response): Promise<void> => {
    try {
      const settings = await this.websiteSettingsService.getPublicSettings();
      res.json(APIResponse.success('Website settings retrieved', settings));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };
}
