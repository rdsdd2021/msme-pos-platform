# Database

## Conventions

- PostgreSQL 16
- UUID primary keys using `gen_random_uuid()`
- `timestamptz` in UTC for all timestamps
- `numeric(14,2)` or higher for monetary amounts (never `float`)
- `tenant_id` on all tenant-owned records
- `created_at`, `updated_at` on all tables; `created_by` where relevant
- Posted financial/stock events are immutable
- Use `archived_at` or `is_active` for catalogue deactivation, not hard deletes

## Migrations

Migrations are managed via TypeORM CLI from `apps/backend/`.

### Commands

```bash
# Run pending migrations
pnpm db:migrate

# Revert last migration
pnpm db:revert

# Generate a new migration (from entity changes)
pnpm --filter backend migration:generate -- database/migrations/MigrationName

# Run seeds
pnpm db:seed
```

## Schema Notes

See `docs/04-DATABASE-DESIGN.md` for the full schema specification.

Phase 0 creates no application tables. Tables are added in Phase 1 (Identity & Tenancy).
