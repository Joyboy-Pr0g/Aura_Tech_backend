import { MigrationInterface, QueryRunner } from 'typeorm';

export class PayOnDeliveryAndManualPayment1719800000000 implements MigrationInterface {
  name = 'PayOnDeliveryAndManualPayment1719800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN IF NOT EXISTS "payment_type" VARCHAR NOT NULL DEFAULT 'bank_transfer'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "payment_type"`);
  }
}
