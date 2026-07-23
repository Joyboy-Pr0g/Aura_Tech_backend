import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductDiscountPrice1720600000000 implements MigrationInterface {
  name = 'ProductDiscountPrice1720600000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN "discount_price" DECIMAL(10,2)
    `);

    await queryRunner.query(`
      ALTER TABLE "product_variants"
      ADD COLUMN "discount_price" DECIMAL(10,2)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product_variants" DROP COLUMN "discount_price"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "discount_price"`);
  }
}
