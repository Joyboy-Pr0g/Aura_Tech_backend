import { MigrationInterface, QueryRunner } from 'typeorm';

export class ShippingFees1719600000000 implements MigrationInterface {
  name = 'ShippingFees1719600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "shipping_fees" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "price" DECIMAL(10,2) NOT NULL,
        "duration" VARCHAR NOT NULL,
        "delivery_way" VARCHAR NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_shipping_fees_is_active"
      ON "shipping_fees" ("is_active")
    `);

    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN IF NOT EXISTS "shipping_fee_id" UUID
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_orders_shipping_fee_id'
        ) THEN
          ALTER TABLE "orders"
          ADD CONSTRAINT "FK_orders_shipping_fee_id"
          FOREIGN KEY ("shipping_fee_id") REFERENCES "shipping_fees"("id")
          ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_orders_shipping_fee_id"
      ON "orders" ("shipping_fee_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "FK_orders_shipping_fee_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_shipping_fee_id"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "shipping_fee_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_shipping_fees_is_active"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "shipping_fees"`);
  }
}
