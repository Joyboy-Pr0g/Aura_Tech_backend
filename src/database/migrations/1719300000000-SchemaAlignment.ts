import { MigrationInterface, QueryRunner } from 'typeorm';

export class SchemaAlignment1719300000000 implements MigrationInterface {
  name = 'SchemaAlignment1719300000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // ─── users.full_name (missing from initial migration) ───────────────────
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "full_name" VARCHAR(50)
    `);
    await queryRunner.query(`
      UPDATE "users" SET "full_name" = split_part("email", '@', 1)
      WHERE "full_name" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "users" ALTER COLUMN "full_name" SET NOT NULL
    `);

    // ─── customer_addresses.country ─────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "customer_addresses"
      ADD COLUMN IF NOT EXISTS "country" VARCHAR NOT NULL DEFAULT 'Yemen'
    `);

    // ─── carts.expires_at default ───────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "carts"
      ALTER COLUMN "expires_at" SET DEFAULT (now() + interval '30 days')
    `);
    await queryRunner.query(`
      UPDATE "carts" SET "expires_at" = now() + interval '30 days'
      WHERE "expires_at" IS NULL
    `);

    // ─── payment_methods extra columns ────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "payment_methods"
      ADD COLUMN IF NOT EXISTS "account_holder_name" VARCHAR
    `);
    await queryRunner.query(`
      UPDATE "payment_methods" SET "account_holder_name" = "name"
      WHERE "account_holder_name" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "payment_methods" ALTER COLUMN "account_holder_name" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "payment_methods"
      ADD COLUMN IF NOT EXISTS "swift_code" VARCHAR
    `);

    // ─── payments.payment_method_id ───────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD COLUMN IF NOT EXISTS "payment_method_id" UUID
        REFERENCES "payment_methods"("id") ON DELETE SET NULL
    `);

    // ─── Customer engagement ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "wishlists" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "customer_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wishlists" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_wishlists_customer_product" UNIQUE ("customer_id", "product_id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_wishlists_customer_id" ON "wishlists" ("customer_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_wishlists_product_id" ON "wishlists" ("product_id")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "search_queries" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "customer_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "query" VARCHAR NOT NULL,
        "results_count" INTEGER,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_search_queries" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_search_queries_customer_id" ON "search_queries" ("customer_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_search_queries_created_at" ON "search_queries" ("created_at")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_search_queries_query" ON "search_queries" ("query")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_views" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "customer_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "viewed_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_views" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_product_views_product_id" ON "product_views" ("product_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_product_views_customer_id" ON "product_views" ("customer_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_product_views_viewed_at" ON "product_views" ("viewed_at")`);

    // ─── Returns & refunds ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "returns" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "return_number" VARCHAR NOT NULL UNIQUE,
        "order_id" UUID NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
        "order_item_id" UUID NOT NULL REFERENCES "order_items"("id") ON DELETE CASCADE,
        "return_reason" VARCHAR NOT NULL,
        "status" VARCHAR NOT NULL DEFAULT 'requested',
        "requested_by_customer_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "requested_at" TIMESTAMP NOT NULL DEFAULT now(),
        "approved_by_admin_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "approved_at" TIMESTAMP,
        "received_at" TIMESTAMP,
        "rejection_reason" TEXT,
        "notes" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_returns" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_returns_order_id" ON "returns" ("order_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_returns_status" ON "returns" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_returns_requested_at" ON "returns" ("requested_at")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_returns_approved_at" ON "returns" ("approved_at")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "refunds" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "return_id" UUID NOT NULL REFERENCES "returns"("id") ON DELETE CASCADE,
        "amount" DECIMAL(10,2) NOT NULL,
        "refund_method" VARCHAR,
        "status" VARCHAR NOT NULL DEFAULT 'pending',
        "processed_by_admin_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "processed_at" TIMESTAMP,
        "transaction_reference" VARCHAR,
        "notes" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refunds" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_refunds_return_id" ON "refunds" ("return_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_refunds_status" ON "refunds" ("status")`);

    // ─── Ratings & reviews ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_ratings" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "order_item_id" UUID NOT NULL UNIQUE REFERENCES "order_items"("id") ON DELETE CASCADE,
        "customer_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "rating" INTEGER NOT NULL CHECK ("rating" BETWEEN 1 AND 5),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_ratings" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_product_ratings_product_id" ON "product_ratings" ("product_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_product_ratings_customer_id" ON "product_ratings" ("customer_id")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_reviews" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "order_item_id" UUID NOT NULL UNIQUE REFERENCES "order_items"("id") ON DELETE CASCADE,
        "customer_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "rating_id" UUID REFERENCES "product_ratings"("id") ON DELETE SET NULL,
        "title" VARCHAR NOT NULL,
        "content" TEXT NOT NULL,
        "helpful_count" INTEGER NOT NULL DEFAULT 0,
        "moderation_status" VARCHAR NOT NULL DEFAULT 'pending',
        "moderation_notes" TEXT,
        "rejected_reason" TEXT,
        "is_verified_purchase" BOOLEAN NOT NULL DEFAULT true,
        "deleted_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_reviews" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_product_reviews_product_id" ON "product_reviews" ("product_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_product_reviews_customer_id" ON "product_reviews" ("customer_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_product_reviews_moderation_status" ON "product_reviews" ("moderation_status")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "review_helpful_votes" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "review_id" UUID NOT NULL REFERENCES "product_reviews"("id") ON DELETE CASCADE,
        "customer_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "is_helpful" BOOLEAN NOT NULL,
        CONSTRAINT "PK_review_helpful_votes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_review_helpful_votes_review_customer" UNIQUE ("review_id", "customer_id")
      )
    `);

    // ─── Q&A ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_questions" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "customer_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "question" TEXT NOT NULL,
        "helpful_count" INTEGER NOT NULL DEFAULT 0,
        "is_published" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_questions" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_product_questions_product_id" ON "product_questions" ("product_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_product_questions_customer_id" ON "product_questions" ("customer_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_product_questions_created_at" ON "product_questions" ("created_at")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "question_answers" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "question_id" UUID NOT NULL REFERENCES "product_questions"("id") ON DELETE CASCADE,
        "answered_by_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "answer" TEXT NOT NULL,
        "helpful_count" INTEGER NOT NULL DEFAULT 0,
        "is_seller_answer" BOOLEAN NOT NULL DEFAULT false,
        "moderation_status" VARCHAR NOT NULL DEFAULT 'pending',
        "is_published" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_question_answers" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_question_answers_question_id" ON "question_answers" ("question_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_question_answers_answered_by_id" ON "question_answers" ("answered_by_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_question_answers_created_at" ON "question_answers" ("created_at")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "answer_helpful_votes" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "answer_id" UUID NOT NULL REFERENCES "question_answers"("id") ON DELETE CASCADE,
        "customer_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "is_helpful" BOOLEAN NOT NULL,
        CONSTRAINT "PK_answer_helpful_votes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_answer_helpful_votes_answer_customer" UNIQUE ("answer_id", "customer_id")
      )
    `);

    // ─── Coupons & discounts ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "coupons" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "code" VARCHAR NOT NULL UNIQUE,
        "discount_type" VARCHAR NOT NULL,
        "discount_value" DECIMAL(10,2) NOT NULL,
        "max_uses" INTEGER,
        "current_uses" INTEGER NOT NULL DEFAULT 0,
        "min_purchase_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "max_discount_amount" DECIMAL(10,2),
        "expires_at" TIMESTAMP,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_coupons" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_coupons_code" ON "coupons" ("code")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_coupons_expires_at" ON "coupons" ("expires_at")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_coupons_is_active" ON "coupons" ("is_active")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "coupon_usage" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "coupon_id" UUID NOT NULL REFERENCES "coupons"("id") ON DELETE CASCADE,
        "order_id" UUID NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
        "customer_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "discount_amount" DECIMAL(10,2) NOT NULL,
        "used_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_coupon_usage" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_coupon_usage_coupon_id" ON "coupon_usage" ("coupon_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_coupon_usage_customer_id" ON "coupon_usage" ("customer_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_coupon_usage_used_at" ON "coupon_usage" ("used_at")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "order_discounts" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "order_id" UUID NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
        "coupon_id" UUID REFERENCES "coupons"("id") ON DELETE SET NULL,
        "discount_type" VARCHAR NOT NULL,
        "discount_amount" DECIMAL(10,2) NOT NULL,
        "applied_by_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "applied_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_order_discounts" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_order_discounts_order_id" ON "order_discounts" ("order_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_order_discounts_coupon_id" ON "order_discounts" ("coupon_id")`);

    // ─── Notifications ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "customer_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "notification_type" VARCHAR NOT NULL,
        "title" VARCHAR NOT NULL,
        "message" TEXT NOT NULL,
        "related_order_id" UUID REFERENCES "orders"("id") ON DELETE SET NULL,
        "related_product_id" UUID REFERENCES "products"("id") ON DELETE SET NULL,
        "status" VARCHAR NOT NULL DEFAULT 'pending',
        "channels" VARCHAR,
        "read_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notifications_customer_id" ON "notifications" ("customer_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notifications_notification_type" ON "notifications" ("notification_type")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notifications_created_at" ON "notifications" ("created_at")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notifications_status" ON "notifications" ("status")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_logs" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "notification_id" UUID NOT NULL REFERENCES "notifications"("id") ON DELETE CASCADE,
        "channel" VARCHAR NOT NULL,
        "status" VARCHAR NOT NULL,
        "error_message" TEXT,
        "sent_at" TIMESTAMP,
        "attempted_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_logs" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notification_logs_notification_id" ON "notification_logs" ("notification_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notification_logs_channel" ON "notification_logs" ("channel")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notification_logs_status" ON "notification_logs" ("status")`);

    // ─── Reminders & trending ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "out_of_stock_reminders" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "product_variant_id" UUID REFERENCES "product_variants"("id") ON DELETE CASCADE,
        "customer_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "status" VARCHAR NOT NULL DEFAULT 'active',
        "requested_at" TIMESTAMP NOT NULL DEFAULT now(),
        "notified_at" TIMESTAMP,
        "cancelled_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_out_of_stock_reminders" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_oos_reminders_product_variant_customer"
          UNIQUE ("product_id", "product_variant_id", "customer_id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_oos_reminders_product_id" ON "out_of_stock_reminders" ("product_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_oos_reminders_customer_id" ON "out_of_stock_reminders" ("customer_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_oos_reminders_status" ON "out_of_stock_reminders" ("status")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "trending_products" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "view_count" INTEGER,
        "purchase_count" INTEGER,
        "rating_average" DECIMAL(3,2),
        "trend_score" DECIMAL(10,4),
        "calculated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "valid_until" TIMESTAMP,
        CONSTRAINT "PK_trending_products" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_trending_products_trend_score" ON "trending_products" ("trend_score")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_trending_products_calculated_at" ON "trending_products" ("calculated_at")`);

    // ─── categories.is_active (app model extension) ─────────────────────────
    await queryRunner.query(`
      ALTER TABLE "categories"
      ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true
    `);

    // ─── Missing indexes on existing tables ─────────────────────────────────
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_customer_addresses_type" ON "customer_addresses" ("type")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_customer_addresses_is_default" ON "customer_addresses" ("is_default")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_carts_expires_at" ON "carts" ("expires_at")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_orders_order_number" ON "orders" ("order_number")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "trending_products"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "out_of_stock_reminders"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "order_discounts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "coupon_usage"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "coupons"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "answer_helpful_votes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "question_answers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_questions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "review_helpful_votes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_reviews"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_ratings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refunds"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "returns"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_views"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "search_queries"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "wishlists"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN IF EXISTS "payment_method_id"`);
    await queryRunner.query(`ALTER TABLE "payment_methods" DROP COLUMN IF EXISTS "swift_code"`);
    await queryRunner.query(`ALTER TABLE "payment_methods" DROP COLUMN IF EXISTS "account_holder_name"`);
    await queryRunner.query(`ALTER TABLE "customer_addresses" DROP COLUMN IF EXISTS "country"`);
  }
}
