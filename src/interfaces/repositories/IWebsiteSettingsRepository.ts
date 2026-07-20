import { WebsiteSettings } from '../../models/WebsiteSettings';

export interface UpdateWebsiteSettingsDto {
  title?: string;
  header_logo_public_id?: string | null;
  header_logo_url?: string | null;
  footer_logo_public_id?: string | null;
  footer_logo_url?: string | null;
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
  favicon_public_id?: string | null;
  favicon_url?: string | null;
  og_image_public_id?: string | null;
  og_image_url?: string | null;
  twitter_card?: string | null;
  twitter_handle?: string | null;
  default_locale?: string | null;
  theme_color?: string | null;
  robots?: string | null;
  sar_to_yer?: number | null;
}

export interface IWebsiteSettingsRepository {
  getSingleton(): Promise<WebsiteSettings>;
  update(id: string, data: UpdateWebsiteSettingsDto): Promise<WebsiteSettings>;
}
