import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { WebsiteSettingsService } from '../../services/websiteSettings/WebsiteSettingsService';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';

@injectable()
export class AdminWebsiteSettingsController {
  constructor(@inject(WebsiteSettingsService) private websiteSettingsService: WebsiteSettingsService) {}

  getSettings = async (_req: Request, res: Response): Promise<void> => {
    try {
      const settings = await this.websiteSettingsService.getSettings();
      res.json(APIResponse.success('Website settings retrieved', settings));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  updateSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const pick = (name: string) => files?.[name]?.[0];

      const settings = await this.websiteSettingsService.updateSettings({
        ...req.validatedData,
        headerLogoFile: pick('header_logo')
          ? { buffer: pick('header_logo')!.buffer, mimetype: pick('header_logo')!.mimetype }
          : undefined,
        footerLogoFile: pick('footer_logo')
          ? { buffer: pick('footer_logo')!.buffer, mimetype: pick('footer_logo')!.mimetype }
          : undefined,
        faviconFile: pick('favicon')
          ? { buffer: pick('favicon')!.buffer, mimetype: pick('favicon')!.mimetype }
          : undefined,
        ogImageFile: pick('og_image')
          ? { buffer: pick('og_image')!.buffer, mimetype: pick('og_image')!.mimetype }
          : undefined,
      });

      res.json(APIResponse.success('Website settings updated', settings));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };
}
