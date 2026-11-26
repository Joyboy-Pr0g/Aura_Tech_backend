import { AppDataSource } from '../config/database';
import { WebsiteSettings } from '../models/WebsiteSettings';
import { ENGLISH_WEBSITE_SETTINGS } from '../constants/englishCatalogSeed';

export type SeedWebsiteSettingsOptions = {
  /** When true, overwrite the singleton row with English defaults (default: true). */
  overwrite?: boolean;
};

export async function seedWebsiteSettings(options: SeedWebsiteSettingsOptions = {}): Promise<void> {
  const overwrite = options.overwrite ?? true;
  const repo = AppDataSource.getRepository(WebsiteSettings);

  const existing = await repo.findOne({
    where: {},
    order: { created_at: 'ASC' },
  });

  if (!existing) {
    await repo.save(repo.create(ENGLISH_WEBSITE_SETTINGS));
    console.log('✅ Created website settings (English)');
    return;
  }

  if (!overwrite) {
    console.log('⏭️  Skipped website settings (already exists)');
    return;
  }

  await repo.update(existing.id, ENGLISH_WEBSITE_SETTINGS);
  console.log('✅ Updated website settings to English defaults');
}
