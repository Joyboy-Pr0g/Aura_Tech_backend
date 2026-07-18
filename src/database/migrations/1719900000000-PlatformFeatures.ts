import { MigrationInterface, QueryRunner } from 'typeorm';

export class PlatformFeatures1719900000000 implements MigrationInterface {
  name = 'PlatformFeatures1719900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "cost_price" DECIMAL(10,2) NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "device_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "customer_id" uuid NOT NULL,
        "token" varchar NOT NULL,
        "platform" varchar NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_device_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_device_tokens_customer_token" UNIQUE ("customer_id", "token")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_device_tokens_customer_id" ON "device_tokens" ("customer_id")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "site_visits" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "visitor_id" varchar NULL,
        "customer_id" uuid NULL,
        "path" varchar NOT NULL,
        "referrer" varchar NULL,
        "user_agent" text NULL,
        "visited_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_site_visits" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_site_visits_visited_at" ON "site_visits" ("visited_at")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_site_visits_customer_id" ON "site_visits" ("customer_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "site_visits"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "device_tokens"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "cost_price"`);
  }
}
