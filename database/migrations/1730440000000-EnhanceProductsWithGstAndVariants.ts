import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhanceProductsWithGstAndVariants1730440000000 implements MigrationInterface {
  name = 'EnhanceProductsWithGstAndVariants1730440000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add gst_rate_percent to products table
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN "gst_rate_percent" NUMERIC(5,2) NOT NULL DEFAULT 0.00;
    `);

    // 2. Add package_size to products table
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN "package_size" VARCHAR(64) NULL;
    `);

    // 3. Drop non-unique barcode index if present and create unique index on (tenant_id, barcode_primary)
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_products_tenant_barcode";
      CREATE UNIQUE INDEX "UQ_products_tenant_barcode_active"
      ON "products" ("tenant_id", "barcode_primary")
      WHERE "barcode_primary" IS NOT NULL AND "is_active" = true;
    `);

    // 4. Update seeded kirana products with appropriate GST slabs and packaging sizes
    await queryRunner.query(`
      UPDATE "products" SET "gst_rate_percent" = 0.00, "package_size" = '5 kg' WHERE "sku" = 'GROC-001';
      UPDATE "products" SET "gst_rate_percent" = 12.00, "package_size" = '500 g' WHERE "sku" = 'DAIRY-001';
      UPDATE "products" SET "gst_rate_percent" = 0.00, "package_size" = '1 kg' WHERE "sku" = 'GROC-002';
      UPDATE "products" SET "gst_rate_percent" = 5.00, "package_size" = '1 L' WHERE "sku" = 'GROC-003';
      UPDATE "products" SET "gst_rate_percent" = 18.00, "package_size" = '800 g' WHERE "sku" = 'SNACK-001';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_products_tenant_barcode_active";
      CREATE INDEX "IDX_products_tenant_barcode" ON "products" ("tenant_id", "barcode_primary");
      ALTER TABLE "products" DROP COLUMN IF EXISTS "package_size";
      ALTER TABLE "products" DROP COLUMN IF EXISTS "gst_rate_percent";
    `);
  }
}

