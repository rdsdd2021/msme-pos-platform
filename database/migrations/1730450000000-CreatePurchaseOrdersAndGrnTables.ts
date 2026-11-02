import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePurchaseOrdersAndGrnTables1730450000000 implements MigrationInterface {
  name = 'CreatePurchaseOrdersAndGrnTables1730450000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "purchase_order_status_enum" AS ENUM ('draft', 'ordered', 'received', 'cancelled');

      CREATE TABLE "purchase_orders" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "branch_id" UUID NOT NULL,
        "supplier_id" UUID NOT NULL,
        "order_number" VARCHAR(64) NOT NULL,
        "status" "purchase_order_status_enum" NOT NULL DEFAULT 'draft',
        "expected_delivery_date" TIMESTAMPTZ,
        "subtotal" NUMERIC(14,2) NOT NULL DEFAULT 0.00,
        "tax_amount" NUMERIC(14,2) NOT NULL DEFAULT 0.00,
        "total_amount" NUMERIC(14,2) NOT NULL DEFAULT 0.00,
        "notes" TEXT,
        "created_by" UUID,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_purchase_orders_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_purchase_orders_tenant_number" UNIQUE ("tenant_id", "order_number"),
        CONSTRAINT "FK_purchase_orders_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_purchase_orders_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_purchase_orders_supplier" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT
      );

      CREATE TABLE "purchase_order_lines" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "purchase_order_id" UUID NOT NULL,
        "product_id" UUID NOT NULL,
        "quantity_ordered" NUMERIC(12,3) NOT NULL,
        "quantity_received" NUMERIC(12,3) NOT NULL DEFAULT 0.000,
        "unit_cost" NUMERIC(14,2) NOT NULL DEFAULT 0.00,
        "tax_rate_percent" NUMERIC(5,2) NOT NULL DEFAULT 0.00,
        "line_total" NUMERIC(14,2) NOT NULL DEFAULT 0.00,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_purchase_order_lines_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_purchase_order_lines_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_purchase_order_lines_po" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_purchase_order_lines_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT
      );

      CREATE INDEX "IDX_purchase_orders_tenant_branch" ON "purchase_orders" ("tenant_id", "branch_id");
      CREATE INDEX "IDX_purchase_orders_tenant_supplier" ON "purchase_orders" ("tenant_id", "supplier_id");
      CREATE INDEX "IDX_purchase_orders_tenant_status" ON "purchase_orders" ("tenant_id", "status");
      CREATE INDEX "IDX_purchase_order_lines_po" ON "purchase_order_lines" ("purchase_order_id");
      CREATE INDEX "IDX_purchase_order_lines_product" ON "purchase_order_lines" ("product_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "purchase_order_lines";
      DROP TABLE IF EXISTS "purchase_orders";
      DROP TYPE IF EXISTS "purchase_order_status_enum";
    `);
  }
}

