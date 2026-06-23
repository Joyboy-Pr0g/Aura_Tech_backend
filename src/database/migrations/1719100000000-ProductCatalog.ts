import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductCatalog1719100000000 implements MigrationInterface {
  name = 'ProductCatalog1719100000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // ─── Categories ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id"                 UUID      NOT NULL DEFAULT gen_random_uuid(),
        "name"               VARCHAR   NOT NULL,
        "slug"               VARCHAR   NOT NULL,
        "description"        TEXT,
        "image_url"          VARCHAR,
        "image_public_id"    VARCHAR,
        "parent_category_id" UUID,
        "deleted_at"         TIMESTAMP,
        "created_at"         TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"         TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_categories_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_categories"      PRIMARY KEY ("id"),
        CONSTRAINT "FK_categories_parent"
          FOREIGN KEY ("parent_category_id") REFERENCES "categories"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_categories_slug"              ON "categories" ("slug")`);
    await queryRunner.query(`CREATE INDEX "IDX_categories_parent_category_id" ON "categories" ("parent_category_id")`);

    // ─── Products ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id"                UUID         NOT NULL DEFAULT gen_random_uuid(),
        "category_id"       UUID         NOT NULL,
        "slug"              VARCHAR      NOT NULL,
        "title"             VARCHAR      NOT NULL,
        "description"       TEXT         NOT NULL,
        "price"             DECIMAL(10,2) NOT NULL,
        "brand"             VARCHAR,
        "features"          JSONB        NOT NULL DEFAULT '{}',
        "stock_quantity"    INTEGER      NOT NULL DEFAULT 0,
        "reserved_quantity" INTEGER      NOT NULL DEFAULT 0,
        "images"            JSONB,
        "created_by_id"     UUID,
        "deleted_at"        TIMESTAMP,
        "created_at"        TIMESTAMP    NOT NULL DEFAULT now(),
        "updated_at"        TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_products_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_products"      PRIMARY KEY ("id"),
        CONSTRAINT "FK_products_category"
          FOREIGN KEY ("category_id") REFERENCES "categories"("id"),
        CONSTRAINT "FK_products_created_by"
          FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_products_category_id" ON "products" ("category_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_products_brand"        ON "products" ("brand")`);
    await queryRunner.query(`CREATE INDEX "IDX_products_created_at"   ON "products" ("created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_products_deleted_at"   ON "products" ("deleted_at")`);

    // ─── Product Variants ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "product_variants" (
        "id"                UUID         NOT NULL DEFAULT gen_random_uuid(),
        "product_id"        UUID         NOT NULL,
        "sku"               VARCHAR      NOT NULL,
        "size"              VARCHAR,
        "color"             VARCHAR,
        "price"             DECIMAL(10,2),
        "stock_quantity"    INTEGER      NOT NULL DEFAULT 0,
        "reserved_quantity" INTEGER      NOT NULL DEFAULT 0,
        "images"            JSONB,
        "deleted_at"        TIMESTAMP,
        "created_at"        TIMESTAMP    NOT NULL DEFAULT now(),
        "updated_at"        TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_product_variants_sku" UNIQUE ("sku"),
        CONSTRAINT "PK_product_variants"     PRIMARY KEY ("id"),
        CONSTRAINT "FK_product_variants_product"
          FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_product_variants_product_id" ON "product_variants" ("product_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_product_variants_sku"        ON "product_variants" ("sku")`);

    // ─── Inventory Logs ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "inventory_reason_enum" AS ENUM (
        'order_placed', 'order_cancelled', 'order_delivered',
        'restock', 'return_received', 'adjustment'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "inventory_logs" (
        "id"              UUID      NOT NULL DEFAULT gen_random_uuid(),
        "product_id"      UUID      NOT NULL,
        "variant_id"      UUID,
        "quantity_change" INTEGER   NOT NULL,
        "reason"          "inventory_reason_enum" NOT NULL,
        "reference_id"    UUID,
        "changed_by_id"   UUID,
        "notes"           TEXT,
        "created_at"      TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_inventory_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_inventory_logs_product"
          FOREIGN KEY ("product_id") REFERENCES "products"("id"),
        CONSTRAINT "FK_inventory_logs_variant"
          FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_inventory_logs_changed_by"
          FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_inventory_logs_product_id"  ON "inventory_logs" ("product_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_inventory_logs_created_at"  ON "inventory_logs" ("created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_inventory_logs_reason"      ON "inventory_logs" ("reason")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "inventory_logs"`);
    await queryRunner.query(`DROP TYPE  IF EXISTS "inventory_reason_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_variants"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
  }
}
