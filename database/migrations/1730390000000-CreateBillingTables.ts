import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBillingTables1730390000000 implements MigrationInterface {
  name = 'CreateBillingTables1730390000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "invoices_status_enum" AS ENUM ('draft', 'posted', 'returned', 'voided');
      CREATE TYPE "invoices_payment_status_enum" AS ENUM ('paid', 'partial', 'unpaid');
      CREATE TYPE "payments_payment_method_enum" AS ENUM ('cash', 'upi', 'card', 'credit');

      CREATE TABLE "invoices" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "branch_id" UUID NOT NULL,
        "invoice_number" VARCHAR(64) NOT NULL,
        "idempotency_key" VARCHAR(128) NOT NULL,
        "status" "invoices_status_enum" NOT NULL DEFAULT 'posted',
        "customer_id" UUID,
        "cashier_user_id" UUID,
        "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
        "subtotal" NUMERIC(14,2) NOT NULL,
        "discount_total" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "taxable_total" NUMERIC(14,2) NOT NULL,
        "cgst_total" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "sgst_total" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "igst_total" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "grand_total" NUMERIC(14,2) NOT NULL,
        "rounding_adjustment" NUMERIC(6,2) NOT NULL DEFAULT 0,
        "payment_status" "invoices_payment_status_enum" NOT NULL DEFAULT 'paid',
        "is_interstate" BOOLEAN NOT NULL DEFAULT false,
        "branch_snapshot" JSONB,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "posted_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_invoices_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_invoices_tenant_branch_number" UNIQUE ("tenant_id", "branch_id", "invoice_number"),
        CONSTRAINT "UQ_invoices_tenant_idempotency" UNIQUE ("tenant_id", "idempotency_key"),
        CONSTRAINT "FK_invoices_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_invoices_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE
      );

      CREATE TABLE "invoice_lines" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "invoice_id" UUID NOT NULL,
        "product_id" UUID,
        "product_name_snapshot" VARCHAR(255) NOT NULL,
        "sku_snapshot" VARCHAR(64) NOT NULL,
        "hsn_snapshot" VARCHAR(16),
        "quantity" NUMERIC(12,3) NOT NULL,
        "unit_price" NUMERIC(14,2) NOT NULL,
        "discount_amount" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "taxable_value" NUMERIC(14,2) NOT NULL,
        "gst_rate_percent" NUMERIC(5,2) NOT NULL DEFAULT 0,
        "cgst_amount" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "sgst_amount" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "igst_amount" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "line_total" NUMERIC(14,2) NOT NULL,
        CONSTRAINT "PK_invoice_lines_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_invoice_lines_invoice" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE
      );

      CREATE TABLE "payments" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "branch_id" UUID NOT NULL,
        "invoice_id" UUID NOT NULL,
        "payment_method" "payments_payment_method_enum" NOT NULL,
        "amount" NUMERIC(14,2) NOT NULL,
        "external_reference" VARCHAR(128),
        "received_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payments_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_payments_invoice" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE
      );

      CREATE INDEX "IDX_invoices_tenant_created" ON "invoices" ("tenant_id", "created_at");
      CREATE INDEX "IDX_invoice_lines_tenant_invoice" ON "invoice_lines" ("tenant_id", "invoice_id");
      CREATE INDEX "IDX_payments_tenant_invoice" ON "payments" ("tenant_id", "invoice_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "payments";
      DROP TABLE IF EXISTS "invoice_lines";
      DROP TABLE IF EXISTS "invoices";
      DROP TYPE IF EXISTS "payments_payment_method_enum";
      DROP TYPE IF EXISTS "invoices_payment_status_enum";
      DROP TYPE IF EXISTS "invoices_status_enum";
    `);
  }
}

