import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStockTransfersTables1730480000000 implements MigrationInterface {
  name = 'CreateStockTransfersTables1730480000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "stock_transfers_status_enum" AS ENUM ('draft', 'dispatched', 'in_transit', 'received', 'cancelled');

      CREATE TABLE "stock_transfers" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "transfer_number" VARCHAR(64) NOT NULL,
        "source_branch_id" UUID NOT NULL,
        "destination_branch_id" UUID NOT NULL,
        "status" "stock_transfers_status_enum" NOT NULL DEFAULT 'draft',
        "dispatched_at" TIMESTAMPTZ,
        "dispatched_by" UUID,
        "received_at" TIMESTAMPTZ,
        "received_by" UUID,
        "total_items_requested" NUMERIC(12,3) NOT NULL DEFAULT 0.000,
        "total_items_dispatched" NUMERIC(12,3) NOT NULL DEFAULT 0.000,
        "total_items_received" NUMERIC(12,3) NOT NULL DEFAULT 0.000,
        "has_discrepancy" BOOLEAN NOT NULL DEFAULT false,
        "discrepancy_reason" TEXT,
        "notes" TEXT,
        "created_by" UUID,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stock_transfers_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_stock_transfers_tenant_number" UNIQUE ("tenant_id", "transfer_number"),
        CONSTRAINT "FK_stock_transfers_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_stock_transfers_source_branch" FOREIGN KEY ("source_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_stock_transfers_dest_branch" FOREIGN KEY ("destination_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT
      );

      CREATE TABLE "stock_transfer_lines" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "transfer_id" UUID NOT NULL,
        "product_id" UUID NOT NULL,
        "quantity_requested" NUMERIC(12,3) NOT NULL,
        "quantity_dispatched" NUMERIC(12,3) NOT NULL DEFAULT 0.000,
        "quantity_received" NUMERIC(12,3) NOT NULL DEFAULT 0.000,
        "unit_cost" NUMERIC(14,2) NOT NULL DEFAULT 0.00,
        "has_discrepancy" BOOLEAN NOT NULL DEFAULT false,
        "discrepancy_quantity" NUMERIC(12,3) NOT NULL DEFAULT 0.000,
        "discrepancy_reason" TEXT,
        "notes" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stock_transfer_lines_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_stock_transfer_lines_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_stock_transfer_lines_transfer" FOREIGN KEY ("transfer_id") REFERENCES "stock_transfers"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_stock_transfer_lines_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT
      );

      CREATE INDEX "IDX_stock_transfers_tenant_source" ON "stock_transfers" ("tenant_id", "source_branch_id");
      CREATE INDEX "IDX_stock_transfers_tenant_dest" ON "stock_transfers" ("tenant_id", "destination_branch_id");
      CREATE INDEX "IDX_stock_transfers_tenant_status" ON "stock_transfers" ("tenant_id", "status");
      CREATE INDEX "IDX_stock_transfer_lines_transfer" ON "stock_transfer_lines" ("transfer_id");
      CREATE INDEX "IDX_stock_transfer_lines_product" ON "stock_transfer_lines" ("product_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "stock_transfer_lines";
      DROP TABLE IF EXISTS "stock_transfers";
      DROP TYPE IF EXISTS "stock_transfers_status_enum";
    `);
  }
}

