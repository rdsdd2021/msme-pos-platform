import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRestaurantTables1730520000000 implements MigrationInterface {
  name = 'CreateRestaurantTables1730520000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "restaurant_tables" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "branch_id" UUID NOT NULL,
        "table_number" VARCHAR(32) NOT NULL,
        "table_name" VARCHAR(128),
        "section" VARCHAR(64) NOT NULL DEFAULT 'Main Dining',
        "seating_capacity" INT NOT NULL DEFAULT 4,
        "status" VARCHAR(32) NOT NULL DEFAULT 'vacant',
        "current_guest_count" INT NOT NULL DEFAULT 0,
        "occupied_at" TIMESTAMPTZ,
        "sort_order" INT NOT NULL DEFAULT 0,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_restaurant_tables_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_restaurant_tables_tenant_branch_number" UNIQUE ("tenant_id", "branch_id", "table_number"),
        CONSTRAINT "FK_restaurant_tables_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_restaurant_tables_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "restaurant_orders" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "branch_id" UUID NOT NULL,
        "order_number" VARCHAR(64) NOT NULL,
        "order_type" VARCHAR(32) NOT NULL DEFAULT 'dine_in',
        "table_id" UUID,
        "table_number_snapshot" VARCHAR(32),
        "section_snapshot" VARCHAR(64),
        "guest_count" INT NOT NULL DEFAULT 1,
        "customer_id" UUID,
        "customer_name_snapshot" VARCHAR(255),
        "customer_phone_snapshot" VARCHAR(32),
        "status" VARCHAR(32) NOT NULL DEFAULT 'open',
        "captain_user_id" UUID,
        "captain_name_snapshot" VARCHAR(255),
        "notes" TEXT,
        "subtotal" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "tax_total" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "discount_total" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "grand_total" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "invoice_id" UUID,
        "opened_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "closed_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_restaurant_orders_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_restaurant_orders_tenant_number" UNIQUE ("tenant_id", "order_number"),
        CONSTRAINT "FK_restaurant_orders_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_restaurant_orders_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_restaurant_orders_table" FOREIGN KEY ("table_id") REFERENCES "restaurant_tables"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_restaurant_orders_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_restaurant_orders_captain" FOREIGN KEY ("captain_user_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_restaurant_orders_invoice" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS "restaurant_kots" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "branch_id" UUID NOT NULL,
        "order_id" UUID NOT NULL,
        "kot_number" VARCHAR(64) NOT NULL,
        "table_number" VARCHAR(32) NOT NULL,
        "kitchen_station" VARCHAR(64) NOT NULL DEFAULT 'main_kitchen',
        "status" VARCHAR(32) NOT NULL DEFAULT 'pending',
        "captain_name" VARCHAR(255),
        "dispatched_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "ready_at" TIMESTAMPTZ,
        "served_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_restaurant_kots_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_restaurant_kots_tenant_branch_number" UNIQUE ("tenant_id", "branch_id", "kot_number"),
        CONSTRAINT "FK_restaurant_kots_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_restaurant_kots_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_restaurant_kots_order" FOREIGN KEY ("order_id") REFERENCES "restaurant_orders"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "restaurant_kot_lines" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "kot_id" UUID NOT NULL,
        "order_id" UUID NOT NULL,
        "product_id" UUID NOT NULL,
        "product_name_snapshot" VARCHAR(255) NOT NULL,
        "quantity" NUMERIC(12,3) NOT NULL,
        "unit_price" NUMERIC(14,2) NOT NULL,
        "line_total" NUMERIC(14,2) NOT NULL,
        "kitchen_station" VARCHAR(64) NOT NULL DEFAULT 'main_kitchen',
        "special_instructions" VARCHAR(255),
        "status" VARCHAR(32) NOT NULL DEFAULT 'pending',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_restaurant_kot_lines_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_restaurant_kot_lines_kot" FOREIGN KEY ("kot_id") REFERENCES "restaurant_kots"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_restaurant_kot_lines_order" FOREIGN KEY ("order_id") REFERENCES "restaurant_orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_restaurant_kot_lines_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT
      );

      CREATE INDEX IF NOT EXISTS "IDX_restaurant_tables_tenant_branch" ON "restaurant_tables" ("tenant_id", "branch_id");
      CREATE INDEX IF NOT EXISTS "IDX_restaurant_tables_status" ON "restaurant_tables" ("tenant_id", "status");
      CREATE INDEX IF NOT EXISTS "IDX_restaurant_orders_tenant_branch_status" ON "restaurant_orders" ("tenant_id", "branch_id", "status");
      CREATE INDEX IF NOT EXISTS "IDX_restaurant_orders_table" ON "restaurant_orders" ("table_id");
      CREATE INDEX IF NOT EXISTS "IDX_restaurant_kots_tenant_branch_status" ON "restaurant_kots" ("tenant_id", "branch_id", "status");
      CREATE INDEX IF NOT EXISTS "IDX_restaurant_kots_order" ON "restaurant_kots" ("order_id");
      CREATE INDEX IF NOT EXISTS "IDX_restaurant_kot_lines_kot" ON "restaurant_kot_lines" ("kot_id");
      CREATE INDEX IF NOT EXISTS "IDX_restaurant_kot_lines_order" ON "restaurant_kot_lines" ("order_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "restaurant_kot_lines";
      DROP TABLE IF EXISTS "restaurant_kots";
      DROP TABLE IF EXISTS "restaurant_orders";
      DROP TABLE IF EXISTS "restaurant_tables";
    `);
  }
}

