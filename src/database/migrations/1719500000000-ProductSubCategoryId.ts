import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductSubCategoryId1719500000000 implements MigrationInterface {
  name = 'ProductSubCategoryId1719500000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "sub_category_id" UUID
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_products_sub_category'
        ) THEN
          ALTER TABLE "products"
          ADD CONSTRAINT "FK_products_sub_category"
            FOREIGN KEY ("sub_category_id") REFERENCES "categories"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_sub_category_id" ON "products" ("sub_category_id")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_sub_category_id"`);
    await queryRunner.query(`
      ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "FK_products_sub_category"
    `);
    await queryRunner.query(`
      ALTER TABLE "products" DROP COLUMN IF EXISTS "sub_category_id"
    `);
  }
}
