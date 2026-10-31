import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSyncTables1730400000000 implements MigrationInterface {
  name = 'CreateSyncTables1730400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sync_ingested_operations" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "device_id" UUID NOT NULL,
        "operation_id" UUID NOT NULL,
        "operation_type" VARCHAR(64) NOT NULL,
        "sequence" INTEGER NOT NULL,
        "schema_version" INTEGER NOT NULL DEFAULT 1,
        "status" VARCHAR(32) NOT NULL DEFAULT 'accepted',
        "server_entity_id" VARCHAR(128),
        "error_code" VARCHAR(64),
        "error_message" TEXT,
        "ingested_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sync_ingested_operations_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_sync_tenant_device_operation" UNIQUE ("tenant_id", "device_id", "operation_id"),
        CONSTRAINT "FK_sync_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      );

      CREATE TABLE "device_invoice_ranges" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "branch_id" UUID NOT NULL,
        "device_id" UUID NOT NULL,
        "series_prefix" VARCHAR(32) NOT NULL DEFAULT 'INV',
        "start_number" INTEGER NOT NULL,
        "end_number" INTEGER NOT NULL,
        "next_number" INTEGER NOT NULL,
        "is_exhausted" BOOLEAN NOT NULL DEFAULT false,
        "allocated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_device_invoice_ranges_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_device_invoice_ranges_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_device_invoice_ranges_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE
      );

      CREATE INDEX "IDX_sync_tenant_device" ON "sync_ingested_operations" ("tenant_id", "device_id");
      CREATE INDEX "IDX_device_ranges_tenant_branch_device" ON "device_invoice_ranges" ("tenant_id", "branch_id", "device_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "device_invoice_ranges";
      DROP TABLE IF EXISTS "sync_ingested_operations";
    `);
  }
}

