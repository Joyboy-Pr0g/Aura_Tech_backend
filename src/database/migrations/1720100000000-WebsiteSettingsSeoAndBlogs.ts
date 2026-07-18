import { MigrationInterface, QueryRunner } from 'typeorm';

export class WebsiteSettingsSeoAndBlogs1720100000000 implements MigrationInterface {
  name = 'WebsiteSettingsSeoAndBlogs1720100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "website_settings"
        ADD COLUMN IF NOT EXISTS "meta_title" VARCHAR(200),
        ADD COLUMN IF NOT EXISTS "meta_description" TEXT,
        ADD COLUMN IF NOT EXISTS "meta_keywords" TEXT,
        ADD COLUMN IF NOT EXISTS "site_url" VARCHAR(500),
        ADD COLUMN IF NOT EXISTS "favicon_public_id" VARCHAR,
        ADD COLUMN IF NOT EXISTS "favicon_url" VARCHAR,
        ADD COLUMN IF NOT EXISTS "og_image_public_id" VARCHAR,
        ADD COLUMN IF NOT EXISTS "og_image_url" VARCHAR,
        ADD COLUMN IF NOT EXISTS "twitter_card" VARCHAR(50) DEFAULT 'summary_large_image',
        ADD COLUMN IF NOT EXISTS "twitter_handle" VARCHAR(100),
        ADD COLUMN IF NOT EXISTS "default_locale" VARCHAR(10) DEFAULT 'en_US',
        ADD COLUMN IF NOT EXISTS "theme_color" VARCHAR(20) DEFAULT '#00d9ff',
        ADD COLUMN IF NOT EXISTS "robots" VARCHAR(100) DEFAULT 'index, follow'
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "blogs" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "title" VARCHAR(200) NOT NULL,
        "slug" VARCHAR(220) NOT NULL UNIQUE,
        "excerpt" TEXT,
        "content" TEXT NOT NULL,
        "cover_image_public_id" VARCHAR,
        "cover_image_url" VARCHAR,
        "meta_title" VARCHAR(200),
        "meta_description" TEXT,
        "is_published" BOOLEAN NOT NULL DEFAULT false,
        "published_at" TIMESTAMP,
        "author_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_blogs_slug" ON "blogs" ("slug")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_blogs_is_published" ON "blogs" ("is_published")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_blogs_published_at" ON "blogs" ("published_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "blogs"`);
    await queryRunner.query(`
      ALTER TABLE "website_settings"
        DROP COLUMN IF EXISTS "meta_title",
        DROP COLUMN IF EXISTS "meta_description",
        DROP COLUMN IF EXISTS "meta_keywords",
        DROP COLUMN IF EXISTS "site_url",
        DROP COLUMN IF EXISTS "favicon_public_id",
        DROP COLUMN IF EXISTS "favicon_url",
        DROP COLUMN IF EXISTS "og_image_public_id",
        DROP COLUMN IF EXISTS "og_image_url",
        DROP COLUMN IF EXISTS "twitter_card",
        DROP COLUMN IF EXISTS "twitter_handle",
        DROP COLUMN IF EXISTS "default_locale",
        DROP COLUMN IF EXISTS "theme_color",
        DROP COLUMN IF EXISTS "robots"
    `);
  }
}
