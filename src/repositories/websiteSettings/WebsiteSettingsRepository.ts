import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database';
import { WebsiteSettings } from '../../models/WebsiteSettings';
import {
  IWebsiteSettingsRepository,
  UpdateWebsiteSettingsDto,
} from '../../interfaces/repositories/IWebsiteSettingsRepository';
import { DEFAULT_WEBSITE_SETTINGS } from '../../constants/websiteSettingsDefaults';

@injectable()
export class WebsiteSettingsRepository implements IWebsiteSettingsRepository {
  private get repo() {
    return AppDataSource.getRepository(WebsiteSettings);
  }

  async getSingleton(): Promise<WebsiteSettings> {
    let settings = await this.repo.findOne({
      where: {},
      order: { created_at: 'ASC' },
    });

    if (!settings) {
      settings = this.repo.create({ ...DEFAULT_WEBSITE_SETTINGS });
      settings = await this.repo.save(settings);
    }

    return settings;
  }

  async update(id: string, data: UpdateWebsiteSettingsDto): Promise<WebsiteSettings> {
    await this.repo.update(id, data as Partial<WebsiteSettings>);
    const updated = await this.repo.findOne({ where: { id } });
    return updated!;
  }
}
