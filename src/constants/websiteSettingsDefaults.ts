import { ENGLISH_WEBSITE_SETTINGS } from './englishCatalogSeed';

/** Runtime fallback when no website_settings row exists (matches English seed). */
export const DEFAULT_WEBSITE_SETTINGS = {
  title: ENGLISH_WEBSITE_SETTINGS.title,
  website_email: ENGLISH_WEBSITE_SETTINGS.website_email,
  website_phone: ENGLISH_WEBSITE_SETTINGS.website_phone,
  facebook: ENGLISH_WEBSITE_SETTINGS.facebook,
  instagram: ENGLISH_WEBSITE_SETTINGS.instagram,
  whatsapp: ENGLISH_WEBSITE_SETTINGS.whatsapp,
  tiktok: ENGLISH_WEBSITE_SETTINGS.tiktok,
  description: ENGLISH_WEBSITE_SETTINGS.description,
  header_logo_public_id: ENGLISH_WEBSITE_SETTINGS.header_logo_public_id,
  header_logo_url: ENGLISH_WEBSITE_SETTINGS.header_logo_url,
  footer_logo_public_id: ENGLISH_WEBSITE_SETTINGS.footer_logo_public_id,
  footer_logo_url: ENGLISH_WEBSITE_SETTINGS.footer_logo_url,
};
