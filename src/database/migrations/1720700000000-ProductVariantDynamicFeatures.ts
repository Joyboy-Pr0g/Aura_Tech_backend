import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductVariantDynamicFeatures1720700000000 implements MigrationInterface {
  name = 'ProductVariantDynamicFeatures1720700000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "product_variants"
      ADD COLUMN "features" JSONB NOT NULL DEFAULT '{}'::jsonb
    `);

    await queryRunner.query(`
      UPDATE "product_variants"
      SET "features" = jsonb_strip_nulls(
        jsonb_build_object(
          'Color', NULLIF(TRIM("color"), ''),
          'Size', NULLIF(TRIM("size"), '')
        )
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "product_variants"
      DROP COLUMN "size",
      DROP COLUMN "color"
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "product_variants"
      ADD COLUMN "size" VARCHAR,
      ADD COLUMN "color" VARCHAR
    `);

    await queryRunner.query(`
      UPDATE "product_variants"
      SET
        "color" = NULLIF("features"->>'Color', ''),
        "size" = NULLIF("features"->>'Size', '')
    `);

    await queryRunner.query(`
      ALTER TABLE "product_variants"
      DROP COLUMN "features"
    `);
  }
}
