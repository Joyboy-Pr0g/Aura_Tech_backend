import { MigrationInterface, QueryRunner } from 'typeorm';

export class PaymentAutoVerify1720500000000 implements MigrationInterface {
  name = 'PaymentAutoVerify1720500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD COLUMN IF NOT EXISTS "payer_account_number" varchar(32) NULL,
      ADD COLUMN IF NOT EXISTS "expected_amount_yer" numeric(12,2) NULL,
      ADD COLUMN IF NOT EXISTS "auto_verify_status" varchar(20) NOT NULL DEFAULT 'pending'
    `);

    await queryRunner.query(`
      ALTER TABLE "payment_sms_events"
      ADD COLUMN IF NOT EXISTS "parsed_provider" varchar(100) NULL,
      ADD COLUMN IF NOT EXISTS "parsed_amount" numeric(12,2) NULL,
      ADD COLUMN IF NOT EXISTS "parsed_currency" varchar(20) NULL,
      ADD COLUMN IF NOT EXISTS "parsed_account_number" varchar(32) NULL,
      ADD COLUMN IF NOT EXISTS "parsed_balance" numeric(12,2) NULL,
      ADD COLUMN IF NOT EXISTS "parsed_sender" varchar(255) NULL,
      ADD COLUMN IF NOT EXISTS "parse_method" varchar(20) NULL,
      ADD COLUMN IF NOT EXISTS "parse_status" varchar(20) NOT NULL DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS "matched_order_id" uuid NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "payment_sms_events"
      DROP COLUMN IF EXISTS "matched_order_id",
      DROP COLUMN IF EXISTS "parse_status",
      DROP COLUMN IF EXISTS "parse_method",
      DROP COLUMN IF EXISTS "parsed_sender",
      DROP COLUMN IF EXISTS "parsed_balance",
      DROP COLUMN IF EXISTS "parsed_account_number",
      DROP COLUMN IF EXISTS "parsed_currency",
      DROP COLUMN IF EXISTS "parsed_amount",
      DROP COLUMN IF EXISTS "parsed_provider"
    `);

    await queryRunner.query(`
      ALTER TABLE "payments"
      DROP COLUMN IF EXISTS "auto_verify_status",
      DROP COLUMN IF EXISTS "expected_amount_yer",
      DROP COLUMN IF EXISTS "payer_account_number"
    `);
  }
}
