import { MigrationInterface, QueryRunner } from 'typeorm';

export class CouponsRefundsExpenses1720200000000 implements MigrationInterface {
  name = 'CouponsRefundsExpenses1720200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "coupons"
      ADD COLUMN IF NOT EXISTS "category_id" UUID NULL REFERENCES "categories"("id") ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS "sub_category_id" UUID NULL REFERENCES "categories"("id") ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS "product_id" UUID NULL REFERENCES "products"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_coupons_category_id" ON "coupons" ("category_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_coupons_sub_category_id" ON "coupons" ("sub_category_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_coupons_product_id" ON "coupons" ("product_id")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "refund_requests" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "order_id" UUID NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
        "customer_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "reason" TEXT NOT NULL,
        "image_url" VARCHAR NULL,
        "image_public_id" VARCHAR NULL,
        "status" VARCHAR NOT NULL DEFAULT 'pending',
        "processed_by_admin_id" UUID NULL REFERENCES "users"("id") ON DELETE SET NULL,
        "processed_at" TIMESTAMP NULL,
        "rejection_reason" TEXT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refund_requests" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_refund_requests_order_id" UNIQUE ("order_id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_refund_requests_status" ON "refund_requests" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_refund_requests_customer_id" ON "refund_requests" ("customer_id")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "expenses" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "type" VARCHAR NOT NULL,
        "order_id" UUID NULL REFERENCES "orders"("id") ON DELETE SET NULL,
        "amount" DECIMAL(10,2) NOT NULL,
        "receipt_url" VARCHAR NOT NULL,
        "receipt_public_id" VARCHAR NULL,
        "reason" TEXT NOT NULL,
        "created_by_admin_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_expenses" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_expenses_type" ON "expenses" ("type")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_expenses_order_id" ON "expenses" ("order_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_expenses_created_at" ON "expenses" ("created_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "expenses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refund_requests"`);
    await queryRunner.query(`ALTER TABLE "coupons" DROP COLUMN IF EXISTS "product_id"`);
    await queryRunner.query(`ALTER TABLE "coupons" DROP COLUMN IF EXISTS "sub_category_id"`);
    await queryRunner.query(`ALTER TABLE "coupons" DROP COLUMN IF EXISTS "category_id"`);
  }
}
