import { WebsiteSettings } from '../models/WebsiteSettings';
import { DEFAULT_WEBSITE_SETTINGS } from '../constants/websiteSettingsDefaults';

export function applyWebsiteSettingsDefaults(settings: WebsiteSettings): WebsiteSettings {
  return {
    ...settings,
    title: settings.title?.trim() || DEFAULT_WEBSITE_SETTINGS.title,
    website_email: settings.website_email?.trim() || DEFAULT_WEBSITE_SETTINGS.website_email,
    website_phone: settings.website_phone?.trim() || DEFAULT_WEBSITE_SETTINGS.website_phone,
    facebook: settings.facebook?.trim() || DEFAULT_WEBSITE_SETTINGS.facebook,
    instagram: settings.instagram?.trim() || DEFAULT_WEBSITE_SETTINGS.instagram,
    whatsapp: settings.whatsapp?.trim() || DEFAULT_WEBSITE_SETTINGS.whatsapp,
    tiktok: settings.tiktok?.trim() || DEFAULT_WEBSITE_SETTINGS.tiktok,
    description: settings.description?.trim() || DEFAULT_WEBSITE_SETTINGS.description,
  };
}
