import { MigrationInterface, QueryRunner } from 'typeorm';

export class WebsiteSettingsSarToYer1720300000000 implements MigrationInterface {
  name = 'WebsiteSettingsSarToYer1720300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "website_settings"
      ADD COLUMN IF NOT EXISTS "sar_to_yer" numeric(10,2) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "website_settings"
      DROP COLUMN IF EXISTS "sar_to_yer"
    `);
  }
}
