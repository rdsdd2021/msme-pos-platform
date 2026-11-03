import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductImageUrl1730510000000 implements MigrationInterface {
  name = 'AddProductImageUrl1730510000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "image_url" TEXT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      DROP COLUMN IF EXISTS "image_url";
    `);
  }
}
