import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCommercialTables1730420000000 implements MigrationInterface {
  name = 'CreateCommercialTables1730420000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "devices_platform_enum" AS ENUM ('android', 'web', 'windows');
      CREATE TYPE "devices_status_enum" AS ENUM ('active', 'inactive', 'revoked');
      CREATE TYPE "subscriptions_plancode_enum" AS ENUM ('basic_kirana', 'pro_retail', 'enterprise');
      CREATE TYPE "subscriptions_status_enum" AS ENUM ('trial', 'active', 'past_due', 'cancelled');

      CREATE TABLE "devices" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "branch_id" UUID NOT NULL,
        "device_identifier" VARCHAR(128) NOT NULL,
        "device_name" VARCHAR(255) NOT NULL,
        "platform" "devices_platform_enum" NOT NULL DEFAULT 'android',
        "app_version" VARCHAR(32),
        "status" "devices_status_enum" NOT NULL DEFAULT 'active',
        "last_seen_at" TIMESTAMPTZ,
        "revoked_at" TIMESTAMPTZ,
        "revocation_reason" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_devices_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_devices_tenant_identifier" UNIQUE ("tenant_id", "device_identifier"),
        CONSTRAINT "FK_devices_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_devices_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE
      );

      CREATE TABLE "tenant_subscriptions" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL UNIQUE,
        "plan_code" "subscriptions_plancode_enum" NOT NULL DEFAULT 'basic_kirana',
        "status" "subscriptions_status_enum" NOT NULL DEFAULT 'trial',
        "max_branches" INTEGER NOT NULL DEFAULT 1,
        "max_devices" INTEGER NOT NULL DEFAULT 2,
        "max_users" INTEGER NOT NULL DEFAULT 5,
        "trial_ends_at" TIMESTAMPTZ,
        "current_period_end" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tenant_subscriptions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tenant_subscriptions_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      );

      CREATE INDEX "IDX_devices_tenant_branch" ON "devices" ("tenant_id", "branch_id");
      CREATE INDEX "IDX_tenant_subscriptions_tenant_status" ON "tenant_subscriptions" ("tenant_id", "status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "tenant_subscriptions";
      DROP TABLE IF EXISTS "devices";
      DROP TYPE IF EXISTS "subscriptions_status_enum";
      DROP TYPE IF EXISTS "subscriptions_plancode_enum";
      DROP TYPE IF EXISTS "devices_status_enum";
      DROP TYPE IF EXISTS "devices_platform_enum";
    `);
  }
}

