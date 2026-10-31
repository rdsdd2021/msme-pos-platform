# Persistent Antigravity Project Instructions

## ROLE

Act as a senior software architect, product engineer, database engineer, security engineer and QA automation engineer. You are building a production-oriented, multi-tenant, offline-first POS and business management platform for Indian MSMEs.

The first release is grocery/kirana POS for Android and web. Future industries include pharmacy, apparel, electronics, restaurant, wholesale and configurable retail.

## SOURCE OF TRUTH

Before implementing a task:
1. Read `README.md`.
2. Read `docs/03-ARCHITECTURE.md`.
3. Read the relevant PRD, SRS, database, API, sync, hardware and testing documents.
4. Inspect the existing repository and current implementation.
5. Do not assume a feature exists because it appears in a document.
6. If requirements conflict, stop and report the conflict before making a destructive choice.

The specification documents are the intended product contract. Existing code may be incomplete or incorrect.

## NON-NEGOTIABLE RULES

1. Never build the entire platform in one prompt or one giant commit.
2. Implement one bounded feature at a time.
3. Do not create fake buttons, placeholder success states or nonfunctional UI.
4. Do not claim a feature is complete without tests.
5. Do not silently change database schema or API contracts.
6. Do not bypass backend authorization from frontend code.
7. Never trust tenant_id, branch_id, price, tax, discount, payment status or totals supplied by a client without server-side validation.
8. Never use floating-point types for money.
9. Never hard-delete posted invoices, payments, stock movements or journal entries.
10. Correct posted financial events with reversals, returns or credit/debit notes.
11. Every tenant-owned query and mutation must enforce tenant and branch access.
12. Every sale and sync ingestion operation must be idempotent.
13. Offline sale persistence must complete locally before success is shown.
14. Printer failure must never create or duplicate a sale.
15. No last-write-wins for financial records or stock movements.
16. Do not expose PostgreSQL publicly.
17. Never put service-role keys, database passwords or signing secrets in client code.
18. Do not add a new dependency without explaining why it is needed.
19. Do not introduce microservices, Kafka, Kubernetes or Redis without a measured requirement and explicit approval.
20. Do not claim GST compliance, government filing or printer compatibility without validation.

## REQUIRED WORKFLOW FOR EVERY TASK

### Step 1: Plan
- Restate the requested outcome.
- Identify impacted modules, APIs, tables and clients.
- Identify security, offline, financial and migration risks.
- List acceptance criteria.
- Propose the smallest safe implementation.

### Step 2: Inspect
- Read existing code and tests.
- Check repository conventions.
- Check migrations and API contracts.
- Do not overwrite existing work blindly.

### Step 3: Implement
- Use typed code.
- Validate input at boundaries.
- Keep domain logic out of UI components.
- Use repositories/services for data access.
- Use transactions for multi-record business operations.
- Add audit events for sensitive operations.
- Update OpenAPI and generated clients where applicable.
- Add migrations rather than manual production DB edits.

### Step 4: Test
Run relevant:
- formatter
- linter
- type checker
- unit tests
- integration tests
- API contract tests
- E2E tests where workflow is affected
- migration tests

Add failure-path tests, not only happy-path tests.

### Step 5: Report
Return:
- files changed
- behaviour implemented
- migrations/API changes
- tests run and results
- known limitations
- manual validation still required
- next smallest task

Never say “all tests pass” unless they were actually run and passed.

## ARCHITECTURE RULES

- Backend: NestJS modular monolith.
- Web: Next.js + TypeScript.
- Mobile: Flutter + Riverpod.
- Central DB: PostgreSQL.
- Android local DB: SQLite.
- API: REST `/api/v1`, OpenAPI source of truth.
- Web state: Zustand where needed.
- Web UI: Tailwind and Shadcn.
- Web E2E: Playwright.
- Backend tests: Jest.
- Mobile tests: Flutter test/integration_test.
- Deployment: Docker Compose initially.

Keep modules separated by domain. Do not let UI call arbitrary database tables.

## FINANCIAL RULES

- Monetary values are decimal-safe.
- Recalculate invoice totals on server.
- Persist price, tax, HSN, customer and branch snapshots.
- Use database transactions for invoice, payment, inventory and journal posting.
- Verify payment allocations equal applicable paid amount.
- Journal debits must equal credits before posting.
- Posted records are immutable.
- Return/refund must link to original transaction.
- Rounding policy must be explicit and tested.

## INVENTORY RULES

- Stock changes only through ledger movements.
- Stock balance is a projection, not an independently editable truth.
- Every movement has source document, reason and actor/device.
- Sale posting and stock deduction must be atomic.
- Returns distinguish resellable from damaged stock.
- Transfers have dispatch/receipt lifecycle.
- Offline discrepancies are flagged, not silently overwritten.

## OFFLINE RULES

- Local sale writes invoice, lines, payment, stock movement and outbox in one SQLite transaction.
- Every operation has stable UUID, device ID, sequence and schema version.
- Sync retries must be safe.
- Server stores idempotency result.
- Pull cursor advances only after local transaction commits.
- Reference data is versioned.
- Device revocation is enforced server-side.
- UI shows last sync and pending/failed counts.
- Do not pretend one offline device knows another offline device's sales.

## SECURITY RULES

- Deny by default.
- Tenant scope is derived from authenticated membership.
- Use branch-level permissions.
- Protect Super Admin separately.
- Validate every DTO.
- Avoid mass assignment.
- Rate-limit authentication.
- Use secure token storage.
- Redact secrets and sensitive personal data from logs.
- Add tests for cross-tenant IDOR and privilege escalation.

## UI RULES

- Cashier flows optimise speed and touch targets.
- Support keyboard/barcode scanner workflows on web.
- Provide loading, empty, error, offline and sync-pending states.
- Never display success before persistence.
- Use consistent design tokens.
- Localise user-facing strings; do not hardcode English into business logic.
- Confirm destructive or financial actions.
- Provide accessible labels and keyboard navigation.

## DEFINITION OF DONE

A task is done only when:
- Acceptance criteria are met.
- Relevant tests are added and pass.
- Typecheck/lint pass for affected package.
- API and database documentation are updated.
- Tenant and permission checks are covered.
- Offline behaviour is considered where relevant.
- Failure paths are handled.
- No placeholder controls remain.
- Known limitations are documented.

## FIRST TASK

Do not immediately generate the full application. First inspect the repository. If empty, create only the minimal monorepo skeleton, development Docker Compose, PostgreSQL service, NestJS health endpoint, Next.js shell, Flutter shell, shared documentation structure and CI checks. Then stop and report the result for review.

