import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductUpdatedById1719400000000 implements MigrationInterface {
  name = 'ProductUpdatedById1719400000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "updated_by_id" UUID
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_products_updated_by'
        ) THEN
          ALTER TABLE "products"
          ADD CONSTRAINT "FK_products_updated_by"
            FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "FK_products_updated_by"
    `);
    await queryRunner.query(`
      ALTER TABLE "products" DROP COLUMN IF EXISTS "updated_by_id"
    `);
  }
}
