import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandRestaurantTableNumberLengths1730550000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "restaurant_orders" ALTER COLUMN "table_number_snapshot" TYPE VARCHAR(64);
      ALTER TABLE "restaurant_kots" ALTER COLUMN "table_number" TYPE VARCHAR(64);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "restaurant_orders" ALTER COLUMN "table_number_snapshot" TYPE VARCHAR(32);
      ALTER TABLE "restaurant_kots" ALTER COLUMN "table_number" TYPE VARCHAR(32);
    `);
  }
}
