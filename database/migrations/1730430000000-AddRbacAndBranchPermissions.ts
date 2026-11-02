import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRbacAndBranchPermissions1730430000000 implements MigrationInterface {
  name = 'AddRbacAndBranchPermissions1730430000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add nullable branch_id column to tenant_memberships
    await queryRunner.query(`
      ALTER TABLE "tenant_memberships"
      ADD COLUMN "branch_id" UUID NULL;
    `);

    // 2. Add foreign key from tenant_memberships.branch_id to branches.id
    await queryRunner.query(`
      ALTER TABLE "tenant_memberships"
      ADD CONSTRAINT "FK_tenant_memberships_branch"
      FOREIGN KEY ("branch_id") REFERENCES "branches"("id")
      ON DELETE SET NULL;
    `);

    // 3. Add roles text[] column with default ['cashier']
    await queryRunner.query(`
      ALTER TABLE "tenant_memberships"
      ADD COLUMN "roles" text[] NOT NULL DEFAULT ARRAY['cashier'::text];
    `);

    // 4. Safely migrate existing role strings into roles array
    await queryRunner.query(`
      UPDATE "tenant_memberships"
      SET "roles" = ARRAY["role"::text]
      WHERE "role" IS NOT NULL AND "role" != '';
    `);

    // 5. Assign existing cashier membership to primary branch if available, keeping owner tenant-wide
    await queryRunner.query(`
      UPDATE "tenant_memberships"
      SET "branch_id" = (
        SELECT b."id"
        FROM "branches" b
        WHERE b."tenant_id" = "tenant_memberships"."tenant_id"
        ORDER BY b."created_at" ASC
        LIMIT 1
      )
      WHERE "role" = 'cashier' AND "branch_id" IS NULL;
    `);

    // 6. Add CHECK constraint to enforce canonical roles
    await queryRunner.query(`
      ALTER TABLE "tenant_memberships"
      ADD CONSTRAINT "CHK_tenant_memberships_role"
      CHECK ("role" IN ('owner', 'branch_manager', 'cashier', 'inventory_staff', 'accountant'));
    `);

    await queryRunner.query(`
      ALTER TABLE "tenant_memberships"
      ADD CONSTRAINT "CHK_tenant_memberships_roles"
      CHECK (
        "roles" <@ ARRAY['owner', 'branch_manager', 'cashier', 'inventory_staff', 'accountant']::text[]
        AND cardinality("roles") > 0
      );
    `);

    // 7. Update uniqueness: drop strict (tenant_id, user_id) unique constraint to allow branch-specific assignments
    await queryRunner.query(`
      ALTER TABLE "tenant_memberships"
      DROP CONSTRAINT IF EXISTS "UQ_tenant_memberships_tenant_user";
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_tenant_memberships_tenant_user_branch"
      ON "tenant_memberships" ("tenant_id", "user_id", (COALESCE("branch_id", '00000000-0000-0000-0000-000000000000'::uuid)));
    `);

    // 8. Add index on tenant_id, branch_id
    await queryRunner.query(`
      CREATE INDEX "IDX_tenant_memberships_tenant_branch"
      ON "tenant_memberships" ("tenant_id", "branch_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_tenant_memberships_tenant_branch";
      DROP INDEX IF EXISTS "UQ_tenant_memberships_tenant_user_branch";
      ALTER TABLE "tenant_memberships"
      ADD CONSTRAINT "UQ_tenant_memberships_tenant_user" UNIQUE ("tenant_id", "user_id");
      ALTER TABLE "tenant_memberships" DROP CONSTRAINT IF EXISTS "CHK_tenant_memberships_roles";
      ALTER TABLE "tenant_memberships" DROP CONSTRAINT IF EXISTS "CHK_tenant_memberships_role";
      ALTER TABLE "tenant_memberships" DROP COLUMN IF EXISTS "roles";
      ALTER TABLE "tenant_memberships" DROP CONSTRAINT IF EXISTS "FK_tenant_memberships_branch";
      ALTER TABLE "tenant_memberships" DROP COLUMN IF EXISTS "branch_id";
    `);
  }
}

