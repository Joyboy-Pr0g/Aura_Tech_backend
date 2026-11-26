/**
 * English storefront catalog defaults for seeding.
 * Products are defined in src/seeds/productSeeder.ts (large catalog).
 */

export const ENGLISH_WEBSITE_SETTINGS = {
  title: 'AURA TECH',
  header_logo_public_id: null as string | null,
  header_logo_url: null as string | null,
  footer_logo_public_id: null as string | null,
  footer_logo_url: null as string | null,
  website_email: 'hello@auratech.com',
  website_phone: '+967 777 000 000',
  facebook: 'https://facebook.com/auratech',
  instagram: 'https://instagram.com/auratech',
  whatsapp: '+967777000000',
  tiktok: 'https://tiktok.com/@auratech',
  description:
    'Your premier mobile gaming and tech store in Yemen. Premium phones, laptops, gaming gear, and accessories with fast delivery and expert support.',
  meta_title: 'AURA TECH — Mobile Gaming & Tech Store | Yemen',
  meta_description:
    'Shop gaming phones, laptops, consoles, and accessories at AURA TECH. Competitive prices, secure checkout, and delivery across Yemen.',
  meta_keywords:
    'AURA TECH, gaming store Yemen, gaming phones, laptops, PlayStation, Xbox, accessories, mobile gaming, tech shop Sanaa',
  site_url: 'https://auratech.com',
  favicon_public_id: null as string | null,
  favicon_url: null as string | null,
  og_image_public_id: null as string | null,
  og_image_url: null as string | null,
  twitter_card: 'summary_large_image',
  twitter_handle: '@auratech',
  default_locale: 'en_US',
  theme_color: '#00d9ff',
  robots: 'index, follow',
  sar_to_yer: '530.00',
};

export interface EnglishShippingFeeSeed {
  price: number;
  duration: string;
  delivery_way: string;
  is_active: boolean;
}

export const ENGLISH_SHIPPING_FEES: EnglishShippingFeeSeed[] = [
  {
    price: 0,
    duration: 'Same day (pickup hours)',
    delivery_way: 'In-store pickup — Sanaa',
    is_active: true,
  },
  {
    price: 4.99,
    duration: '2–4 business days',
    delivery_way: 'Standard courier — Sanaa',
    is_active: true,
  },
  {
    price: 8.99,
    duration: '3–5 business days',
    delivery_way: 'Standard courier — major cities',
    is_active: true,
  },
  {
    price: 14.99,
    duration: '5–8 business days',
    delivery_way: 'Nationwide delivery',
    is_active: true,
  },
  {
    price: 24.99,
    duration: '2–3 business days',
    delivery_way: 'Express delivery — priority handling',
    is_active: true,
  },
];

export interface EnglishPaymentMethodSeed {
  name: string;
  account_holder_name: string;
  bank_name: string;
  account_number: string | null;
  iban: string | null;
  swift_code: string | null;
  description: string | null;
  is_active: boolean;
}

export const ENGLISH_PAYMENT_METHODS: EnglishPaymentMethodSeed[] = [
  {
    name: 'Bank of Yemen — Business account',
    account_holder_name: 'AURA TECH LLC',
    bank_name: 'Bank of Yemen',
    account_number: '1234567890',
    iban: 'YE1234567890123456789012',
    swift_code: 'BOYMYE22',
    description: 'Primary bank transfer for order payments. Include your order number in the transfer reference.',
    is_active: true,
  },
  {
    name: 'CAC Bank — Secondary account',
    account_holder_name: 'AURA TECH LLC',
    bank_name: 'CAC Bank',
    account_number: '9876543210',
    iban: null,
    swift_code: null,
    description: 'Backup bank account when the primary account is unavailable.',
    is_active: true,
  },
  {
    name: 'Kuraimi Bank — Retail transfers',
    account_holder_name: 'AURA TECH LLC',
    bank_name: 'Kuraimi Bank',
    account_number: '5550123456',
    iban: null,
    swift_code: null,
    description: 'Accepts customer transfers via Kuraimi Bank branches and mobile banking.',
    is_active: true,
  },
  {
    name: 'Jaib — Mobile wallet',
    account_holder_name: 'AURA TECH LLC',
    bank_name: 'Jaib',
    account_number: '777000111',
    iban: null,
    swift_code: null,
    description: 'Send payment to our Jaib wallet number and upload the SMS receipt at checkout.',
    is_active: true,
  },
  {
    name: 'Cash at branch',
    account_holder_name: 'AURA TECH LLC',
    bank_name: 'In-person',
    account_number: null,
    iban: null,
    swift_code: null,
    description: 'Pay in cash at our Sanaa showroom during business hours. Order must be confirmed first.',
    is_active: true,
  },
];
