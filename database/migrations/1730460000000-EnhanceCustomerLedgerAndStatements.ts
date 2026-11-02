import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhanceCustomerLedgerAndStatements1730460000000 implements MigrationInterface {
  name = 'EnhanceCustomerLedgerAndStatements1730460000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "customer_ledger" 
      ADD COLUMN IF NOT EXISTS "payment_method" VARCHAR(32),
      ADD COLUMN IF NOT EXISTS "created_by" UUID;

      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_customer_ledger_tenant_idempotency" 
      ON "customer_ledger" ("tenant_id", "idempotency_key") 
      WHERE "idempotency_key" IS NOT NULL;

      CREATE INDEX IF NOT EXISTS "IDX_customer_ledger_occurred" 
      ON "customer_ledger" ("tenant_id", "customer_id", "occurred_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_customer_ledger_occurred";
      DROP INDEX IF EXISTS "UQ_customer_ledger_tenant_idempotency";
      ALTER TABLE "customer_ledger" 
      DROP COLUMN IF EXISTS "created_by",
      DROP COLUMN IF EXISTS "payment_method";
    `);
  }
}

