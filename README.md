# MSME POS Platform

A production-oriented, multi-tenant, offline-first Point of Sale and business management platform for Indian MSMEs.

**First release:** Grocery/kirana POS for Android and web, with offline billing and thermal printing.

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20 LTS | Required |
| pnpm | 9+ / 10 | `npm install -g pnpm` |
| Docker | 24+ | For PostgreSQL and service orchestration |
| Flutter | 3.19+ stable | For mobile development |
| Git | Any recent | |

---

## Quick Start

```bash
# 1. Clone the repository
git clone <repo-url>
cd msme-pos-platform

# 2. Install Node.js dependencies
pnpm install

# 3. Copy environment files
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example apps/web/.env.local

# 4. Start PostgreSQL
docker compose -f infra/docker/docker-compose.yml up -d postgres

# 5. Run database migrations (when available)
pnpm db:migrate

# 6. Start the backend (in a new terminal)
pnpm --filter @pos/backend start:dev

# 7. Start the web frontend (in a new terminal)
pnpm --filter @pos/web dev

# 8. (Optional) Start the Flutter app
cd apps/mobile && flutter run
```

---

## Repository Structure

```
msme-pos-platform/
├── apps/
│   ├── backend/          # NestJS modular monolith API
│   ├── web/              # Next.js 14 web application
│   └── mobile/           # Flutter Android application
├── packages/
│   ├── api-contracts/    # OpenAPI spec and generated types
│   ├── shared-types/     # Shared TypeScript types
│   └── validation/       # Shared validation utilities
├── hardware-bridge/
│   └── windows/          # Windows local hardware bridge (Phase 4)
├── database/
│   ├── migrations/       # TypeORM migration files
│   ├── seeds/            # Development seed data
│   └── tests/            # Migration tests
├── docs/                 # Specification documents
├── infra/
│   ├── docker/           # Docker Compose configuration
│   ├── reverse-proxy/    # nginx configuration (production)
│   └── monitoring/       # Monitoring configuration
└── scripts/              # Developer helper scripts
```

---

## Services

| Service | URL | Description |
|---------|-----|-------------|
| Backend API | http://localhost:3001/api/v1 | NestJS REST API |
| Swagger UI | http://localhost:3001/api/docs | Interactive API documentation |
| Health check | http://localhost:3001/api/v1/health | Liveness probe |
| Readiness check | http://localhost:3001/api/v1/health/ready | Readiness probe (includes DB) |
| Web app | http://localhost:3000 | Next.js frontend |
| PostgreSQL | localhost:5432 | Database (dev only) |

---

## Environment Variables

### Backend (`apps/backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | `development` | Node environment |
| `PORT` | No | `3001` | Server port |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET` | Yes | — | JWT signing secret (min 32 chars) |
| `JWT_ACCESS_EXPIRES_IN` | No | `15m` | Access token lifetime |
| `JWT_REFRESH_SECRET` | Yes | — | Refresh token signing secret (min 32 chars) |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token lifetime |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Allowed CORS origin |
| `LOG_LEVEL` | No | `debug` | Log verbosity |

### Web (`apps/web/.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:3001/api/v1` | Backend API URL |

> **Security:** Never commit `.env` or `.env.local` files. Never put secrets in client-side `NEXT_PUBLIC_` variables.

---

## Development Commands

```bash
# Install all dependencies
pnpm install

# Run all tests
pnpm test

# Run linting across all packages
pnpm lint

# Run typechecking across all packages
pnpm typecheck

# Backend specific
pnpm --filter @pos/backend start:dev     # Start with hot reload
pnpm --filter @pos/backend test          # Run unit tests
pnpm --filter @pos/backend test:cov      # Run tests with coverage
pnpm --filter @pos/backend test:e2e      # Run e2e tests

# Web specific
pnpm --filter @pos/web dev               # Start dev server
pnpm --filter @pos/web test              # Run unit tests
pnpm --filter @pos/web test:e2e          # Run Playwright E2E tests

# Mobile specific (run from apps/mobile/)
flutter test                             # Run widget tests
flutter run                              # Start on connected device/emulator
flutter analyze                          # Static analysis

# Database
pnpm db:migrate                          # Run pending migrations
pnpm db:revert                           # Revert last migration
pnpm db:seed                             # Run seed data (dev only)

# Docker
docker compose -f infra/docker/docker-compose.yml up        # Start all services
docker compose -f infra/docker/docker-compose.yml up -d postgres  # Start DB only
docker compose -f infra/docker/docker-compose.yml down      # Stop all services
docker compose -f infra/docker/docker-compose.yml logs -f   # Tail logs
```

---

## Technology Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Backend | NestJS | 10 | Modular monolith |
| Backend ORM/Migrations | TypeORM | 0.3 | Strict migration flow |
| Backend Auth | Passport.js + JWT | — | Argon2id password hashing |
| Backend Validation | class-validator | 0.14 | Whitelist + transform |
| Backend API Docs | @nestjs/swagger | 7 | OpenAPI 3.0 |
| Web Frontend | Next.js | 14 (App Router) | |
| Web Styling | Tailwind CSS + Shadcn/ui | 3 | |
| Web State | Zustand | 4 | |
| Web E2E Tests | Playwright | 1.43 | |
| Mobile | Flutter | 3.19+ | Android first |
| Mobile State | Riverpod | 2 | |
| Mobile Local DB | Drift (SQLite) | 2 | |
| Central Database | PostgreSQL | 16 | |
| Infrastructure | Docker Compose | 3.8 | |
| Language (server/web) | TypeScript | 5 | Strict mode |
| Package Manager | pnpm | 9/10 | Workspaces |
| Node.js | Node.js | 20 LTS | |

---

## Git Conventions

### Branches
- `main` — production-ready code
- `develop` — integration branch
- `feat/<scope>/<description>` — feature branches
- `fix/<scope>/<description>` — bug fix branches
- `migration/<description>` — database migration branches

### Commit Format (Conventional Commits)
```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`, `revert`, `migration`, `infra`

**Scopes:** `backend`, `web`, `mobile`, `infra`, `db`, `docs`, `ci`, `shared`, `contracts`, `bridge`

---

## Architecture

See `docs/03-ARCHITECTURE.md` for the full architecture specification.

Key decisions:
- **ADR-001**: Modular monolith — not microservices — for low operational overhead.
- **ADR-002**: PostgreSQL is the central source of truth.
- **ADR-003**: SQLite is the device-local operational database.
- **ADR-004**: Offline sales are append-only events with idempotent server ingestion.
- **ADR-008**: Decimal-safe monetary calculations; immutable posted records.

---

## Implementation Roadmap & Verification Status

| Phase | Focus | Status | Verification & Test Coverage |
|-------|-------|--------|------------------------------|
| **Phase 0** | Monorepo Skeleton & CI | ✅ Completed | pnpm monorepo, NestJS, Next.js, Flutter, Docker |
| **Phase 1** | Identity, Multi-Tenancy & RBAC | ✅ Completed | 14 granular permissions, branch scoping, IDOR protection |
| **Phase 2** | Catalog, Inventory & Stock Transfers | ✅ Completed | Ledger-based stock movements, multi-branch dispatch/receipt |
| **Phase 3** | Billing Engine, GST Returns & Credit Notes | ✅ Completed | GSTR-1 (Table 7 & 12), GSTR-3B, partial returns, credit notes |
| **Phase 4** | Business Operations & Cashier Shifts | ✅ Completed | Customer khata ledger, cash drawer reconciliation, statements |
| **Phase 5** | Offline-First Android Drift SQLite & Sync | ✅ Completed | Bidirectional cursor sync, idempotent push (Rule 12 & 13) |
| **Phase 6** | Mobile Thermal Printing & Barcode Scanner | ✅ Completed | Pure Dart ESC/POS (58mm/80mm), QR code, keyboard-wedge listener |
| **Phase 7** | Production Docker, OpenAPI & E2E Validation | ✅ Completed | Multi-stage Docker, Nginx gateway, 11-step E2E lifecycle pass |
| **Phase 8** | Commercial Subscriptions & Android Build | ✅ Completed | Plan tiers, device limits, debug APK generated (154.8 MB) |

---

## Test & Verification Suites

Every layer of the platform is backed by comprehensive automated test suites:

- **Monorepo Typecheck**: `pnpm -r typecheck` (5 / 5 packages pass with 0 errors)
- **Backend Tests**: `pnpm --filter @pos/backend test -- --runInBand` (13 suites, 109 tests green)
- **Web Tests**: `pnpm --filter @pos/web test -- --runInBand` (7 suites, 62 tests green)
- **Mobile Tests**: `cd apps/mobile && flutter test` (6 suites, 32 tests green)
- **Full Retail Lifecycle E2E**: `powershell -ExecutionPolicy Bypass -File scripts/test-e2e-lifecycle.ps1` (11 / 11 automated retail steps green)
- **Android APK Build**: `cd apps/mobile && flutter build apk --debug` (`build/app/outputs/flutter-apk/app-debug.apk`)

---

## Documentation

All specification documents are in `/docs`:

| Document | Description |
|----------|-------------|
| `01-PRD.md` | Product Requirements Document |
| `02-SRS.md` | Software Requirements Specification |
| `03-ARCHITECTURE.md` | System Architecture |
| `04-DATABASE-DESIGN.md` | Database Design |
| `05-API-SPECIFICATION.md` | API Specification |
| `06-OFFLINE-SYNC.md` | Offline & Sync Architecture |
| `07-HARDWARE-INTEGRATION.md` | Hardware Integration |
| `08-IMPLEMENTATION-ROADMAP.md` | Implementation Roadmap |
| `09-ANTIGRAVITY-INSTRUCTIONS.md` | AI Agent Instructions |
| `10-TESTING-STRATEGY.md` | Testing Strategy |
| `11-SECURITY-OPERATIONS.md` | Security & Operations |

