import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSupplierInvoicesAndGstReporting1730470000000 implements MigrationInterface {
  name = 'CreateSupplierInvoicesAndGstReporting1730470000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add GSTIN to branches table if not present
    await queryRunner.query(`
      ALTER TABLE "branches"
      ADD COLUMN IF NOT EXISTS "gstin" VARCHAR(15);
    `);

    // 2. Add customer GSTIN snapshot and place of supply to invoices table
    await queryRunner.query(`
      ALTER TABLE "invoices"
      ADD COLUMN IF NOT EXISTS "customer_gstin_snapshot" VARCHAR(32),
      ADD COLUMN IF NOT EXISTS "place_of_supply" VARCHAR(10);
    `);

    // 3. Create supplier_invoices (Vendor Tax Invoices for ITC)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "supplier_invoices" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "branch_id" UUID NOT NULL,
        "supplier_id" UUID NOT NULL,
        "purchase_order_id" UUID,
        "supplier_invoice_number" VARCHAR(64) NOT NULL,
        "supplier_invoice_date" TIMESTAMPTZ NOT NULL,
        "subtotal" NUMERIC(14, 2) NOT NULL DEFAULT 0,
        "cgst_amount" NUMERIC(14, 2) NOT NULL DEFAULT 0,
        "sgst_amount" NUMERIC(14, 2) NOT NULL DEFAULT 0,
        "igst_amount" NUMERIC(14, 2) NOT NULL DEFAULT 0,
        "total_amount" NUMERIC(14, 2) NOT NULL DEFAULT 0,
        "is_itc_eligible" BOOLEAN NOT NULL DEFAULT true,
        "ineligibility_reason" VARCHAR(255),
        "is_reverse_charge" BOOLEAN NOT NULL DEFAULT false,
        "place_of_supply" VARCHAR(10),
        "notes" TEXT,
        "created_by" UUID,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_supplier_invoices_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_supplier_invoices_vendor_num" UNIQUE ("tenant_id", "supplier_id", "supplier_invoice_number"),
        CONSTRAINT "FK_supplier_invoices_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_supplier_invoices_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_supplier_invoices_supplier" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_supplier_invoices_purchase_order" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_supplier_invoices_tenant_date" ON "supplier_invoices" ("tenant_id", "supplier_invoice_date");
      CREATE INDEX IF NOT EXISTS "IDX_supplier_invoices_tenant_branch" ON "supplier_invoices" ("tenant_id", "branch_id");
      CREATE INDEX IF NOT EXISTS "IDX_supplier_invoices_tenant_supplier" ON "supplier_invoices" ("tenant_id", "supplier_id");
    `);

    // 4. Create supplier_invoice_lines
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "supplier_invoice_lines" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "supplier_invoice_id" UUID NOT NULL,
        "product_id" UUID,
        "description" VARCHAR(255) NOT NULL,
        "hsn_code" VARCHAR(16),
        "quantity" NUMERIC(12, 3) NOT NULL DEFAULT 1,
        "unit_cost" NUMERIC(14, 2) NOT NULL DEFAULT 0,
        "taxable_value" NUMERIC(14, 2) NOT NULL DEFAULT 0,
        "gst_rate_percent" NUMERIC(5, 2) NOT NULL DEFAULT 0,
        "cgst_amount" NUMERIC(14, 2) NOT NULL DEFAULT 0,
        "sgst_amount" NUMERIC(14, 2) NOT NULL DEFAULT 0,
        "igst_amount" NUMERIC(14, 2) NOT NULL DEFAULT 0,
        "line_total" NUMERIC(14, 2) NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_supplier_invoice_lines_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_supplier_invoice_lines_invoice" FOREIGN KEY ("supplier_invoice_id") REFERENCES "supplier_invoices"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_supplier_invoice_lines_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_supplier_invoice_lines_invoice" ON "supplier_invoice_lines" ("supplier_invoice_id");
    `);

    // 5. Update default branch with registered demo GSTIN if not present (DEVELOPMENT ONLY)
    if (process.env.NODE_ENV !== 'production') {
      await queryRunner.query(`
        UPDATE "branches"
        SET "gstin" = '27AABCK1234F1Z5'
        WHERE "code" = 'BR-001' AND ("gstin" IS NULL OR "gstin" = '');
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "supplier_invoice_lines";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "supplier_invoices";`);
    await queryRunner.query(`
      ALTER TABLE "invoices"
      DROP COLUMN IF EXISTS "customer_gstin_snapshot",
      DROP COLUMN IF EXISTS "place_of_supply";
    `);
    await queryRunner.query(`
      ALTER TABLE "branches"
      DROP COLUMN IF EXISTS "gstin";
    `);
  }
}

