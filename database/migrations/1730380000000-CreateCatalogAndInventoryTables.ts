import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCatalogAndInventoryTables1730380000000 implements MigrationInterface {
  name = 'CreateCatalogAndInventoryTables1730380000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "products_producttype_enum" AS ENUM ('stock', 'service', 'composite');
      CREATE TYPE "stock_movement_type_enum" AS ENUM (
        'opening', 'purchase', 'sale', 'sale_return', 'purchase_return',
        'transfer_in', 'transfer_out', 'adjustment', 'damage', 'expiry'
      );

      CREATE TABLE "categories" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "parent_id" UUID,
        "name" VARCHAR(255) NOT NULL,
        "code" VARCHAR(64) NOT NULL,
        "sort_order" INTEGER NOT NULL DEFAULT 0,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_categories_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_categories_tenant_code" UNIQUE ("tenant_id", "code"),
        CONSTRAINT "FK_categories_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      );

      CREATE TABLE "units" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID,
        "name" VARCHAR(64) NOT NULL,
        "symbol" VARCHAR(16) NOT NULL,
        "decimal_places" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_units_id" PRIMARY KEY ("id")
      );

      CREATE TABLE "suppliers" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "contact_person" VARCHAR(255),
        "phone" VARCHAR(32),
        "email" VARCHAR(255),
        "gstin" VARCHAR(32),
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_suppliers_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_suppliers_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      );

      CREATE TABLE "products" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "category_id" UUID,
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "product_type" "products_producttype_enum" NOT NULL DEFAULT 'stock',
        "base_unit_id" UUID,
        "sku" VARCHAR(64) NOT NULL,
        "barcode_primary" VARCHAR(128),
        "purchase_cost" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "selling_price" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "mrp" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "tax_category_id" UUID,
        "hsn_code" VARCHAR(16),
        "track_inventory" BOOLEAN NOT NULL DEFAULT true,
        "allow_fractional_quantity" BOOLEAN NOT NULL DEFAULT false,
        "version" INTEGER NOT NULL DEFAULT 1,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "archived_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_products_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_products_tenant_sku" UNIQUE ("tenant_id", "sku"),
        CONSTRAINT "FK_products_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_products_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_products_unit" FOREIGN KEY ("base_unit_id") REFERENCES "units"("id") ON DELETE SET NULL
      );

      CREATE TABLE "stock_ledger" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "branch_id" UUID NOT NULL,
        "product_id" UUID NOT NULL,
        "movement_type" "stock_movement_type_enum" NOT NULL,
        "quantity_delta" NUMERIC(12,3) NOT NULL,
        "unit_cost" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "source_type" VARCHAR(64) NOT NULL,
        "source_id" VARCHAR(128) NOT NULL,
        "idempotency_key" VARCHAR(128) NOT NULL,
        "created_by" UUID,
        "reason" TEXT,
        "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "recorded_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stock_ledger_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_stock_ledger_tenant_idempotency" UNIQUE ("tenant_id", "idempotency_key"),
        CONSTRAINT "FK_stock_ledger_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_stock_ledger_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_stock_ledger_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
      );

      CREATE TABLE "stock_balances" (
        "tenant_id" UUID NOT NULL,
        "branch_id" UUID NOT NULL,
        "product_id" UUID NOT NULL,
        "quantity_on_hand" NUMERIC(12,3) NOT NULL DEFAULT 0,
        "low_stock_threshold" NUMERIC(12,3) NOT NULL DEFAULT 5,
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stock_balances" PRIMARY KEY ("tenant_id", "branch_id", "product_id"),
        CONSTRAINT "FK_stock_balances_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_stock_balances_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_stock_balances_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
      );

      CREATE INDEX "IDX_categories_tenant_parent" ON "categories" ("tenant_id", "parent_id");
      CREATE INDEX "IDX_products_tenant_barcode" ON "products" ("tenant_id", "barcode_primary");
      CREATE INDEX "IDX_products_tenant_category" ON "products" ("tenant_id", "category_id");
      CREATE INDEX "IDX_stock_ledger_tenant_branch_product" ON "stock_ledger" ("tenant_id", "branch_id", "product_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "stock_balances";
      DROP TABLE IF EXISTS "stock_ledger";
      DROP TABLE IF EXISTS "products";
      DROP TABLE IF EXISTS "suppliers";
      DROP TABLE IF EXISTS "units";
      DROP TABLE IF EXISTS "categories";
      DROP TYPE IF EXISTS "stock_movement_type_enum";
      DROP TYPE IF EXISTS "products_producttype_enum";
    `);
  }
}

