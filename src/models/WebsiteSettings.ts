import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('website_settings')
export class WebsiteSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', default: 'AURA TECH' })
  title: string;

  @Column({ type: 'varchar', nullable: true, name: 'header_logo_public_id' })
  header_logo_public_id: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'header_logo_url' })
  header_logo_url: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'footer_logo_public_id' })
  footer_logo_public_id: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'footer_logo_url' })
  footer_logo_url: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'website_email' })
  website_email: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'website_phone' })
  website_phone: string | null;

  @Column({ type: 'varchar', nullable: true })
  facebook: string | null;

  @Column({ type: 'varchar', nullable: true })
  instagram: string | null;

  @Column({ type: 'varchar', nullable: true })
  whatsapp: string | null;

  @Column({ type: 'varchar', nullable: true })
  tiktok: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'meta_title' })
  meta_title: string | null;

  @Column({ type: 'text', nullable: true, name: 'meta_description' })
  meta_description: string | null;

  @Column({ type: 'text', nullable: true, name: 'meta_keywords' })
  meta_keywords: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'site_url' })
  site_url: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'favicon_public_id' })
  favicon_public_id: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'favicon_url' })
  favicon_url: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'og_image_public_id' })
  og_image_public_id: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'og_image_url' })
  og_image_url: string | null;

  @Column({ type: 'varchar', length: 50, default: 'summary_large_image', name: 'twitter_card' })
  twitter_card: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'twitter_handle' })
  twitter_handle: string | null;

  @Column({ type: 'varchar', length: 10, default: 'en_US', name: 'default_locale' })
  default_locale: string;

  @Column({ type: 'varchar', length: 20, default: '#00d9ff', name: 'theme_color' })
  theme_color: string;

  @Column({ type: 'varchar', length: 100, default: 'index, follow' })
  robots: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'sar_to_yer' })
  sar_to_yer: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
