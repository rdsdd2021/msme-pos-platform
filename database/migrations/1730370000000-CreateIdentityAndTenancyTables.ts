import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIdentityAndTenancyTables1730370000000 implements MigrationInterface {
  name = 'CreateIdentityAndTenancyTables1730370000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TYPE "tenants_businesstype_enum" AS ENUM (
        'grocery', 'pharmacy', 'apparel', 'electronics', 'restaurant', 'wholesale', 'other'
      );
      CREATE TYPE "tenants_status_enum" AS ENUM (
        'trial', 'active', 'suspended', 'closed'
      );
      CREATE TYPE "users_status_enum" AS ENUM (
        'active', 'inactive', 'suspended'
      );
      CREATE TYPE "memberships_status_enum" AS ENUM (
        'active', 'invited', 'suspended'
      );

      CREATE TABLE "tenants" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "legal_name" VARCHAR(255) NOT NULL,
        "display_name" VARCHAR(255) NOT NULL,
        "business_type" "tenants_businesstype_enum" NOT NULL DEFAULT 'grocery',
        "status" "tenants_status_enum" NOT NULL DEFAULT 'trial',
        "default_currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
        "default_timezone" VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tenants_id" PRIMARY KEY ("id")
      );

      CREATE TABLE "users" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "password_hash" VARCHAR(255) NOT NULL,
        "full_name" VARCHAR(255) NOT NULL,
        "phone" VARCHAR(32),
        "preferred_language" VARCHAR(10) NOT NULL DEFAULT 'en',
        "status" "users_status_enum" NOT NULL DEFAULT 'active',
        "refresh_token_hash" VARCHAR(255),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      );

      CREATE TABLE "tenant_memberships" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "user_id" UUID NOT NULL,
        "status" "memberships_status_enum" NOT NULL DEFAULT 'active',
        "role" VARCHAR(64) NOT NULL DEFAULT 'owner',
        "joined_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tenant_memberships_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tenant_memberships_tenant_user" UNIQUE ("tenant_id", "user_id"),
        CONSTRAINT "FK_tenant_memberships_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_tenant_memberships_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );

      CREATE TABLE "branches" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "code" VARCHAR(64) NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "address_line1" VARCHAR(255),
        "address_line2" VARCHAR(255),
        "city" VARCHAR(100),
        "state_code" VARCHAR(10),
        "postal_code" VARCHAR(20),
        "gst_registration_id" UUID,
        "timezone" VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_branches_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_branches_tenant_code" UNIQUE ("tenant_id", "code"),
        CONSTRAINT "FK_branches_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      );

      CREATE TABLE "audit_logs" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "user_id" UUID,
        "action" VARCHAR(128) NOT NULL,
        "resource_type" VARCHAR(64) NOT NULL,
        "resource_id" VARCHAR(128),
        "details" JSONB,
        "ip_address" VARCHAR(64),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs_id" PRIMARY KEY ("id")
      );

      CREATE INDEX "IDX_audit_logs_tenant_created" ON "audit_logs" ("tenant_id", "created_at");
      CREATE INDEX "IDX_branches_tenant" ON "branches" ("tenant_id");
      CREATE INDEX "IDX_tenant_memberships_tenant" ON "tenant_memberships" ("tenant_id");
      CREATE INDEX "IDX_tenant_memberships_user" ON "tenant_memberships" ("user_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "audit_logs";
      DROP TABLE IF EXISTS "branches";
      DROP TABLE IF EXISTS "tenant_memberships";
      DROP TABLE IF EXISTS "users";
      DROP TABLE IF EXISTS "tenants";
      DROP TYPE IF EXISTS "memberships_status_enum";
      DROP TYPE IF EXISTS "users_status_enum";
      DROP TYPE IF EXISTS "tenants_status_enum";
      DROP TYPE IF EXISTS "tenants_businesstype_enum";
    `);
  }
}

