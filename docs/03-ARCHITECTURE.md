# 03 — System Architecture

## 1. Architecture style

Use a modular monolith backend with clearly separated domain modules and a versioned REST API. Do not start with microservices. Deploy backend API and worker as separate processes from the same codebase when needed.

## 2. Logical components

### Client applications
- Flutter Android app: UI, Riverpod state, SQLite repository, sync engine, printer adapters.
- Next.js web app: POS, business administration, Super Admin routes protected by distinct permissions. The Windows/browser POS must also support offline billing through a PWA app shell, IndexedDB local database/outbox and a service worker.
- Windows local hardware bridge: local-only service for browser-to-USB/Bluetooth printer access. It must remain separately available when the web app is running from its cached offline shell.

### Backend
NestJS modules:
- Auth and identity integration
- Tenants and memberships
- Branches and devices
- Roles and permissions
- Business configuration
- Catalog and pricing
- Tax
- Sales and invoicing
- Payments and refunds
- Inventory ledger
- Procurement
- Customers and credit
- Accounting
- Reports
- Sync
- Hardware registry
- Subscription and entitlements
- Audit

### Data services
- PostgreSQL as central source of truth.
- SQLite per Android installation.
- Optional object storage for product images and exports.
- Background worker for reports, exports, notifications and later integrations.

## 3. Recommended repository

```text
pos-platform/
  apps/
    web/
    mobile/
    backend/
  packages/
    api-contracts/
    shared-types/
    validation/
  hardware-bridge/
    windows/
  database/
    migrations/
    seeds/
    tests/
  docs/
  infra/
    docker/
    reverse-proxy/
    monitoring/
  scripts/
```

Flutter may be kept in the same repository or a sibling repository if toolchain/CI complexity makes monorepo management difficult. Shared API contracts remain generated from OpenAPI rather than sharing runtime code across Dart and TypeScript.

## 4. Backend module boundaries

Each module owns its domain rules and persistence access. Other modules call application services or domain events, not arbitrary repositories.

Example sale posting:
1. Validate tenant, branch, device and cashier.
2. Validate idempotency key.
3. Validate product, price, tax and discount snapshots.
4. Validate stock policy.
5. Insert invoice and invoice lines.
6. Insert payment allocations.
7. Insert stock ledger movements.
8. Update stock balance projection.
9. Insert accounting journal if accounting posting is enabled.
10. Insert audit/outbox events.
11. Commit one database transaction.

No external printer/network/WhatsApp call occurs inside the database transaction.

## 5. Data ownership and tenancy

- Tenant is the customer company.
- Branch belongs to tenant.
- Warehouse belongs to tenant and may be assigned to branch.
- Users may have multiple tenant memberships across different branches or tenant-wide.
- Branch access is explicitly assigned:
  - `branch_id IS NULL`: Grants tenant-wide authority (Store Owner and global Accountants), spanning all branches.
  - `branch_id IS NOT NULL`: Scopes user execution strictly to the specified physical branch.
- Every tenant-owned table contains `tenant_id`.
- Branch-specific records contain `branch_id` where relevant.
- Composite foreign keys prevent cross-tenant relationships.
- PostgreSQL RLS may be used as defence-in-depth, but backend tenant and branch scoping is mandatory on every query and mutation.
- Never trust `tenant_id` or `branch_id` supplied by an untrusted client; derive and validate from authenticated membership context.

## 6. Authentication and Authorization Pipeline

### 6.1 Authentication Architecture
Identity in the NestJS backend uses Passport JWT strategies with Argon2id password hashing:
- **Access Tokens**: Short-lived JWTs (15 minutes default) containing user identity and subject.
- **Refresh Tokens**: Cryptographically secure, random tokens stored as SHA-256 hashes in `refresh_tokens`. Supports atomic rotation and server-side revocation.
- **Dual Transport Strategy**:
  - **Web Client**: Transmitted in an `HttpOnly`, `SameSite=Strict`, `Secure` cookie (`pos_refresh_token`) to prevent XSS-based token theft.
  - **Mobile Client**: Transmitted in the JSON response body and stored in encrypted hardware keystore via `flutter_secure_storage`.
- Device credentials and sessions are scoped, validated on each request, and immediately revocable.

### 6.2 Three-Stage Guard Pipeline
Every protected API route executes a sequential 3-stage guard pipeline:
1. **`AuthGuard('jwt')`**: Validates the cryptographic signature, expiration, and user identity of the Bearer access token.
2. **`TenantGuard`**:
   - Resolves tenant context from URL path (`/tenants/:tenantId/...`), headers (`x-tenant-id`), or request body.
   - Verifies that the authenticated user holds an active membership for the resolved tenant.
   - Attaches a strongly typed `TenantContext` to the request (`req.tenantContext = { tenantId, userId, membershipId, roles, permissions, branchId, isTenantWide }`).
   - Validates branch parameters (`branchId` in params, query, or body). If the user is branch-scoped (`branch_id IS NOT NULL`) and requests an operation on a different branch, immediately aborts with `403 Forbidden: Cross-branch access denied`.
3. **`PermissionsGuard`**:
   - Evaluates permission requirements declared by `@RequirePermissions(...)`.
   - Verifies whether the caller holds the required permission keys, calculated dynamically as the union of permissions for all assigned roles (`getPermissionsForRoles(roles)`). Store owners automatically bypass specific permission checks within their tenant.
   - Evaluates tenant-wide requirements declared by `@RequireTenantWide()`. Non-tenant-wide memberships attempting tenant-level operations receive `403 Forbidden: Operation requires tenant-wide authority`.

### 6.3 Audit Logging
All sensitive operations (stock manual adjustments, Khata repayments, shift closures/overrides, sales returns, price overrides, employee role changes) write immutable audit entries directly to the `audit_logs` table via `AuditService`.

## 7. API conventions

- Prefix: `/api/v1`
- JSON request/response.
- UUID identifiers.
- ISO-8601 UTC timestamps.
- Monetary values represented as decimal strings in JSON, e.g. `"125.50"`.
- Pagination: cursor or limit/offset with stable ordering.
- Error shape: `code`, `message`, `details`, `request_id`.
- Idempotency header for write operations: `Idempotency-Key`.
- OpenAPI is the source for generated clients.
- Breaking changes require a versioned API strategy.

## 8. Offline architecture

Android has SQLite as local operational store. Windows web POS uses a PWA app shell, IndexedDB for local operational data and outbox, and a service worker for application assets. Full offline billing is required on both Android and Windows/web. Browser storage persistence must be requested where supported, quota and eviction risks must be surfaced, and local data must be protected and tenant-scoped. Browser cache alone is not a complete offline architecture.

Each device:
- Has a device ID and device secret/token.
- Stores tenant/branch context.
- Has last server sync cursor.
- Stores reference-data revisions.
- Writes local transactions and outbox events in one SQLite transaction.
- Syncs batches with idempotency keys.
- Applies server acknowledgements and remote deltas.
- Shows sync status.

## 9. Printer architecture

Android:
- Flutter printer interface.
- Adapters for supported Bluetooth Classic/USB/network transports.
- ESC/POS renderer and profile registry.
- Test printer profiles by actual model.

Windows:
- Local bridge installed on the PC.
- Web app calls bridge over loopback.
- Bridge authenticates requests with an origin-bound pairing token.
- Bridge exposes a narrow allowlist: enumerate supported devices, test print, print receipt, open drawer.
- Do not expose arbitrary shell or raw unrestricted network commands.

Print is a post-commit side effect. Failed printing creates a retryable print job; it does not recreate the sale.

## 10. Deployment topology

Docker Compose services:
- reverse proxy
- backend API
- background worker (optional separate process)
- PostgreSQL
- backup job
- monitoring/log collection (lightweight)

Do not expose PostgreSQL directly to the public internet. Expose only HTTPS endpoints. Use firewall rules, SSH keys, updates and encrypted off-site backups.

## 11. Scaling path

MVP:
- One backend codebase
- One PostgreSQL instance
- One worker process
- One deployment environment plus staging
- No Redis unless measured need exists

Later:
- Add Redis for cache/queues if needed.
- Move worker to separate deployment.
- Add read replicas for reporting.
- Partition high-volume ledgers only after measurement.
- Introduce dedicated services only where independent scaling or reliability requires them.

## 12. Architecture decision records

ADR-001: Modular monolith rather than microservices for low operational overhead.  
ADR-002: PostgreSQL is central source of truth.  
ADR-003: SQLite is device-local operational database.  
ADR-004: Offline sales are append-only events with idempotent server ingestion.  
ADR-005: Industry modules extend common domain capabilities.  
ADR-006: Hardware integration is abstracted behind adapters.  
ADR-007: Home server is a pilot/staging target until production reliability is proven.  
ADR-008: Use decimal-safe monetary calculations and immutable posted records.
