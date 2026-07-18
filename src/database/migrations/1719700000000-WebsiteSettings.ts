import { MigrationInterface, QueryRunner } from 'typeorm';

export class WebsiteSettings1719700000000 implements MigrationInterface {
  name = 'WebsiteSettings1719700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "website_settings" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "title" VARCHAR NOT NULL DEFAULT 'AURA TECH',
        "header_logo_public_id" VARCHAR,
        "header_logo_url" VARCHAR,
        "footer_logo_public_id" VARCHAR,
        "footer_logo_url" VARCHAR,
        "website_email" VARCHAR,
        "website_phone" VARCHAR,
        "facebook" VARCHAR,
        "instagram" VARCHAR,
        "whatsapp" VARCHAR,
        "tiktok" VARCHAR,
        "description" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      INSERT INTO "website_settings" (
        "title",
        "website_email",
        "website_phone",
        "facebook",
        "instagram",
        "whatsapp",
        "tiktok",
        "description"
      )
      SELECT
        'AURA TECH',
        'hello@auratech.com',
        '+967 777 000 000',
        'https://facebook.com/auratech',
        'https://instagram.com/auratech',
        '+967777000000',
        'https://tiktok.com/@auratech',
        'Your premier mobile gaming store in Yemen. Premium devices, accessories, and expert support.'
      WHERE NOT EXISTS (SELECT 1 FROM "website_settings" LIMIT 1)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "website_settings"`);
  }
}
