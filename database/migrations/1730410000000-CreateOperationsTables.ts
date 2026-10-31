import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOperationsTables1730410000000 implements MigrationInterface {
  name = 'CreateOperationsTables1730410000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "customer_ledger_entrytype_enum" AS ENUM (
        'invoice_debit', 'payment_credit', 'adjustment', 'refund'
      );
      CREATE TYPE "shift_status_enum" AS ENUM ('open', 'closed');

      CREATE TABLE "customers" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "phone" VARCHAR(32),
        "email" VARCHAR(255),
        "gstin" VARCHAR(32),
        "credit_limit" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "current_balance" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_customers_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_customers_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      );

      CREATE TABLE "customer_ledger" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "customer_id" UUID NOT NULL,
        "branch_id" UUID NOT NULL,
        "entry_type" "customer_ledger_entrytype_enum" NOT NULL,
        "debit" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "credit" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "source_type" VARCHAR(64) NOT NULL,
        "source_id" VARCHAR(128) NOT NULL,
        "idempotency_key" VARCHAR(128),
        "notes" TEXT,
        "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_customer_ledger_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_customer_ledger_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_customer_ledger_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE
      );

      CREATE TABLE "cashier_shifts" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "branch_id" UUID NOT NULL,
        "device_id" UUID,
        "cashier_user_id" UUID NOT NULL,
        "status" "shift_status_enum" NOT NULL DEFAULT 'open',
        "opening_cash" NUMERIC(14,2) NOT NULL,
        "closing_cash" NUMERIC(14,2),
        "expected_cash" NUMERIC(14,2),
        "variance" NUMERIC(14,2),
        "opened_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "closed_at" TIMESTAMPTZ,
        CONSTRAINT "PK_cashier_shifts_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cashier_shifts_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_cashier_shifts_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE
      );

      CREATE INDEX "IDX_customers_tenant_phone" ON "customers" ("tenant_id", "phone");
      CREATE INDEX "IDX_customer_ledger_tenant_customer" ON "customer_ledger" ("tenant_id", "customer_id");
      CREATE INDEX "IDX_cashier_shifts_tenant_branch" ON "cashier_shifts" ("tenant_id", "branch_id", "status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "cashier_shifts";
      DROP TABLE IF EXISTS "customer_ledger";
      DROP TABLE IF EXISTS "customers";
      DROP TYPE IF EXISTS "shift_status_enum";
      DROP TYPE IF EXISTS "customer_ledger_entrytype_enum";
    `);
  }
}

