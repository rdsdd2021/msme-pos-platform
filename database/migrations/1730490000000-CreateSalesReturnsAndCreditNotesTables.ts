import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSalesReturnsAndCreditNotesTables1730490000000 implements MigrationInterface {
  name = 'CreateSalesReturnsAndCreditNotesTables1730490000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "credit_notes" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "branch_id" UUID NOT NULL,
        "credit_note_number" VARCHAR(64) NOT NULL,
        "idempotency_key" VARCHAR(128) NOT NULL,
        "original_invoice_id" UUID NOT NULL,
        "original_invoice_number" VARCHAR(64) NOT NULL,
        "customer_id" UUID,
        "customer_gstin_snapshot" VARCHAR(32),
        "place_of_supply" VARCHAR(10),
        "is_interstate" BOOLEAN NOT NULL DEFAULT false,
        "issued_by_user_id" UUID NOT NULL,
        "reason" VARCHAR(255) NOT NULL,
        "subtotal" NUMERIC(14,2) NOT NULL,
        "taxable_total" NUMERIC(14,2) NOT NULL,
        "cgst_total" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "sgst_total" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "igst_total" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "grand_total" NUMERIC(14,2) NOT NULL,
        "rounding_adjustment" NUMERIC(6,2) NOT NULL DEFAULT 0,
        "refund_payment_method" VARCHAR(32) NOT NULL,
        "refund_reference" VARCHAR(128),
        "status" VARCHAR(32) NOT NULL DEFAULT 'issued',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_credit_notes_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_credit_notes_tenant_number" UNIQUE ("tenant_id", "credit_note_number"),
        CONSTRAINT "UQ_credit_notes_tenant_idempotency" UNIQUE ("tenant_id", "idempotency_key"),
        CONSTRAINT "FK_credit_notes_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_credit_notes_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_credit_notes_original_invoice" FOREIGN KEY ("original_invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT
      );

      CREATE TABLE IF NOT EXISTS "credit_note_lines" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "credit_note_id" UUID NOT NULL,
        "original_invoice_line_id" UUID,
        "product_id" UUID NOT NULL,
        "product_name_snapshot" VARCHAR(255) NOT NULL,
        "sku_snapshot" VARCHAR(64) NOT NULL,
        "hsn_snapshot" VARCHAR(16),
        "quantity_returned" NUMERIC(12,3) NOT NULL,
        "resellable_quantity" NUMERIC(12,3) NOT NULL DEFAULT 0,
        "damaged_quantity" NUMERIC(12,3) NOT NULL DEFAULT 0,
        "unit_price" NUMERIC(14,2) NOT NULL,
        "taxable_value" NUMERIC(14,2) NOT NULL,
        "gst_rate_percent" NUMERIC(5,2) NOT NULL DEFAULT 0,
        "cgst_amount" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "sgst_amount" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "igst_amount" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "line_total" NUMERIC(14,2) NOT NULL,
        "return_reason" VARCHAR(255),
        CONSTRAINT "PK_credit_note_lines_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_credit_note_lines_credit_note" FOREIGN KEY ("credit_note_id") REFERENCES "credit_notes"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_credit_note_lines_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT
      );

      CREATE INDEX IF NOT EXISTS "IDX_credit_notes_tenant_invoice" ON "credit_notes" ("tenant_id", "original_invoice_id");
      CREATE INDEX IF NOT EXISTS "IDX_credit_notes_tenant_created" ON "credit_notes" ("tenant_id", "created_at");
      CREATE INDEX IF NOT EXISTS "IDX_credit_note_lines_tenant_note" ON "credit_note_lines" ("tenant_id", "credit_note_id");
      CREATE INDEX IF NOT EXISTS "IDX_credit_note_lines_tenant_prod" ON "credit_note_lines" ("tenant_id", "product_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "credit_note_lines";
      DROP TABLE IF EXISTS "credit_notes";
    `);
  }
}

