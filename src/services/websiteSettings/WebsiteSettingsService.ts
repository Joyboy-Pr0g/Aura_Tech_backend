import { injectable, inject } from 'tsyringe';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { IWebsiteSettingsRepository, UpdateWebsiteSettingsDto } from '../../interfaces/repositories/IWebsiteSettingsRepository';
import { WebsiteSettings } from '../../models/WebsiteSettings';
import { deleteFromCloudinary, uploadToCloudinary } from '../../config/cloudinary';
import { applyWebsiteSettingsDefaults } from '../../utils/websiteSettingsDefaults';

export interface UpdateWebsiteSettingsInput {
  title?: string;
  website_email?: string | null;
  website_phone?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  whatsapp?: string | null;
  tiktok?: string | null;
  description?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  site_url?: string | null;
  twitter_card?: string | null;
  twitter_handle?: string | null;
  default_locale?: string | null;
  theme_color?: string | null;
  robots?: string | null;
  sar_to_yer?: number | string | null;
  remove_header_logo?: boolean;
  remove_footer_logo?: boolean;
  remove_favicon?: boolean;
  remove_og_image?: boolean;
  headerLogoFile?: { buffer: Buffer; mimetype: string };
  footerLogoFile?: { buffer: Buffer; mimetype: string };
  faviconFile?: { buffer: Buffer; mimetype: string };
  ogImageFile?: { buffer: Buffer; mimetype: string };
}

function toNullableString(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed === '' ? null : trimmed;
}

@injectable()
export class WebsiteSettingsService {
  constructor(
    @inject(REPOSITORY_TOKENS.IWebsiteSettingsRepository)
    private websiteSettingsRepo: IWebsiteSettingsRepository,
  ) {}

  async getSettings(): Promise<WebsiteSettings> {
    return this.websiteSettingsRepo.getSingleton();
  }

  async getPublicSettings(): Promise<WebsiteSettings> {
    const settings = await this.websiteSettingsRepo.getSingleton();
    return applyWebsiteSettingsDefaults(settings);
  }

  async updateSettings(data: UpdateWebsiteSettingsInput): Promise<WebsiteSettings> {
    const current = await this.websiteSettingsRepo.getSingleton();
    const patch: Record<string, unknown> = {};

    if (data.title !== undefined) patch.title = data.title.trim();
    if (data.website_email !== undefined) patch.website_email = toNullableString(data.website_email);
    if (data.website_phone !== undefined) patch.website_phone = toNullableString(data.website_phone);
    if (data.facebook !== undefined) patch.facebook = toNullableString(data.facebook);
    if (data.instagram !== undefined) patch.instagram = toNullableString(data.instagram);
    if (data.whatsapp !== undefined) patch.whatsapp = toNullableString(data.whatsapp);
    if (data.tiktok !== undefined) patch.tiktok = toNullableString(data.tiktok);
    if (data.description !== undefined) patch.description = toNullableString(data.description);
    if (data.meta_title !== undefined) patch.meta_title = toNullableString(data.meta_title);
    if (data.meta_description !== undefined) patch.meta_description = toNullableString(data.meta_description);
    if (data.meta_keywords !== undefined) patch.meta_keywords = toNullableString(data.meta_keywords);
    if (data.site_url !== undefined) patch.site_url = toNullableString(data.site_url);
    if (data.twitter_card !== undefined) patch.twitter_card = toNullableString(data.twitter_card) ?? 'summary_large_image';
    if (data.twitter_handle !== undefined) patch.twitter_handle = toNullableString(data.twitter_handle);
    if (data.default_locale !== undefined) patch.default_locale = toNullableString(data.default_locale) ?? 'en_US';
    if (data.theme_color !== undefined) patch.theme_color = toNullableString(data.theme_color) ?? '#00d9ff';
    if (data.robots !== undefined) patch.robots = toNullableString(data.robots) ?? 'index, follow';
    if (data.sar_to_yer !== undefined) {
      const raw = data.sar_to_yer;
      if (raw === null || raw === '') {
        patch.sar_to_yer = null;
      } else {
        const parsed = Number(raw);
        patch.sar_to_yer = Number.isFinite(parsed) ? parsed : null;
      }
    }

    if (data.remove_header_logo) {
      if (current.header_logo_public_id) await deleteFromCloudinary(current.header_logo_public_id);
      patch.header_logo_public_id = null;
      patch.header_logo_url = null;
    }

    if (data.remove_footer_logo) {
      if (current.footer_logo_public_id) await deleteFromCloudinary(current.footer_logo_public_id);
      patch.footer_logo_public_id = null;
      patch.footer_logo_url = null;
    }

    if (data.remove_favicon) {
      if (current.favicon_public_id) await deleteFromCloudinary(current.favicon_public_id);
      patch.favicon_public_id = null;
      patch.favicon_url = null;
    }

    if (data.remove_og_image) {
      if (current.og_image_public_id) await deleteFromCloudinary(current.og_image_public_id);
      patch.og_image_public_id = null;
      patch.og_image_url = null;
    }

    const uploadMap: Array<{
      file?: { buffer: Buffer; mimetype: string };
      folder: string;
      currentId: string | null;
      publicIdKey: keyof UpdateWebsiteSettingsDto;
      urlKey: keyof UpdateWebsiteSettingsDto;
    }> = [
      {
        file: data.headerLogoFile,
        folder: 'aura-tech/website/header',
        currentId: current.header_logo_public_id,
        publicIdKey: 'header_logo_public_id',
        urlKey: 'header_logo_url',
      },
      {
        file: data.footerLogoFile,
        folder: 'aura-tech/website/footer',
        currentId: current.footer_logo_public_id,
        publicIdKey: 'footer_logo_public_id',
        urlKey: 'footer_logo_url',
      },
      {
        file: data.faviconFile,
        folder: 'aura-tech/website/favicon',
        currentId: current.favicon_public_id,
        publicIdKey: 'favicon_public_id',
        urlKey: 'favicon_url',
      },
      {
        file: data.ogImageFile,
        folder: 'aura-tech/website/og',
        currentId: current.og_image_public_id,
        publicIdKey: 'og_image_public_id',
        urlKey: 'og_image_url',
      },
    ];

    for (const item of uploadMap) {
      if (!item.file) continue;
      if (item.currentId) await deleteFromCloudinary(item.currentId);
      const uploaded = await uploadToCloudinary(item.file.buffer, item.folder, item.file.mimetype);
      patch[item.publicIdKey] = uploaded.public_id;
      patch[item.urlKey] = uploaded.url;
    }

    return this.websiteSettingsRepo.update(current.id, patch as UpdateWebsiteSettingsDto);
  }
}
