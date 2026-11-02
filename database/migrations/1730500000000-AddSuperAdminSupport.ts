import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSuperAdminSupport1730500000000 implements MigrationInterface {
  name = 'AddSuperAdminSupport1730500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_super_admin" BOOLEAN NOT NULL DEFAULT FALSE;
      CREATE INDEX IF NOT EXISTS "IDX_users_is_super_admin" ON "users" ("is_super_admin") WHERE "is_super_admin" = TRUE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_users_is_super_admin";
      ALTER TABLE "users" DROP COLUMN IF EXISTS "is_super_admin";
    `);
  }
}
