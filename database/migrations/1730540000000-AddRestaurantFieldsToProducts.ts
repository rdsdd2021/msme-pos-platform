import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRestaurantFieldsToProducts1730540000000 implements MigrationInterface {
  name = 'AddRestaurantFieldsToProducts1730540000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "food_type" VARCHAR(32) NULL,
      ADD COLUMN IF NOT EXISTS "kitchen_station" VARCHAR(64) NULL,
      ADD COLUMN IF NOT EXISTS "prep_time_minutes" INTEGER NULL,
      ADD COLUMN IF NOT EXISTS "is_available" BOOLEAN NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "is_made_to_order" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "variants" JSONB NULL;
    `);

    // Ensure index on food_type and is_available for fast restaurant menu queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_food_type" ON "products" ("food_type");
      CREATE INDEX IF NOT EXISTS "IDX_products_is_available" ON "products" ("is_available");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_products_is_available";
      DROP INDEX IF EXISTS "IDX_products_food_type";
      ALTER TABLE "products"
      DROP COLUMN IF EXISTS "variants",
      DROP COLUMN IF EXISTS "is_made_to_order",
      DROP COLUMN IF EXISTS "is_available",
      DROP COLUMN IF EXISTS "prep_time_minutes",
      DROP COLUMN IF EXISTS "kitchen_station",
      DROP COLUMN IF EXISTS "food_type";
    `);
  }
}
