import { MigrationInterface, QueryRunner } from 'typeorm';

export class PaymentBridge1720400000000 implements MigrationInterface {
  name = 'PaymentBridge1720400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_devices" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "device_uuid" uuid NOT NULL,
        "label" varchar,
        "api_key_hash" varchar NOT NULL,
        "enabled" boolean NOT NULL DEFAULT true,
        "last_seen" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payment_devices" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_payment_devices_device_uuid" UNIQUE ("device_uuid")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_payment_devices_enabled" ON "payment_devices" ("enabled")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_providers" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar NOT NULL,
        "aliases" jsonb NOT NULL DEFAULT '[]',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payment_providers" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_payment_providers_name" UNIQUE ("name")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_payment_providers_is_active" ON "payment_providers" ("is_active")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_sms_events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "device_id" uuid NOT NULL,
        "provider" varchar NOT NULL,
        "sender_address" varchar NOT NULL,
        "raw_message" text NOT NULL,
        "received_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payment_sms_events" PRIMARY KEY ("id"),
        CONSTRAINT "FK_payment_sms_events_device" FOREIGN KEY ("device_id")
          REFERENCES "payment_devices"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_payment_sms_events_device_id" ON "payment_sms_events" ("device_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_payment_sms_events_received_at" ON "payment_sms_events" ("received_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_sms_events"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_providers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_devices"`);
  }
}
