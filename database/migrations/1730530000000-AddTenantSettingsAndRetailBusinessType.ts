import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantSettingsAndRetailBusinessType1730530000000 implements MigrationInterface {
  name = 'AddTenantSettingsAndRetailBusinessType1730530000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "tenants_businesstype_enum" ADD VALUE IF NOT EXISTS 'retail';
    `);

    await queryRunner.query(`
      ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "settings" jsonb NOT NULL DEFAULT '{}'::jsonb;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tenants" DROP COLUMN IF EXISTS "settings";
    `);
  }
}

