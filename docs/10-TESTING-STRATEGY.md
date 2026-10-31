# 10 — Testing Strategy

## 1. Test pyramid

- Unit tests: tax, discount, decimal arithmetic, permissions, unit conversion, stock valuation.
- Integration tests: transaction posting, stock ledger, payment allocation, journal posting, sync idempotency.
- API tests: authentication, tenant isolation, validation, error contracts.
- E2E tests: full user workflows in web and Android.
- Hardware tests: real printer/scanner/cash drawer compatibility.
- Recovery tests: backup restore and offline queue recovery.

## 2. Test environments

- Unit: no external services.
- Integration: disposable PostgreSQL database.
- API: test backend + isolated database.
- E2E: seeded test tenant and browser/device simulator.
- Hardware: physical test bench with named printer profiles.
- Staging: production-like Docker deployment, synthetic data only.

Never run destructive tests against production data.

## 3. Test personas

- Owner
- Admin
- Branch manager
- Cashier
- Inventory manager
- Accountant
- Super Admin

Each persona has explicit permission fixtures.

## 4. Critical grocery journeys

### Journey A — onboarding
Create tenant, branch, owner, tax settings, invoice series, warehouse and cashier. Verify tenant isolation.

### Journey B — product setup
Create categories, units, products, SKU/barcode, tax category and opening stock.

### Journey C — purchase
Create supplier, purchase invoice and receipt. Verify stock ledger and stock balance.

### Journey D — cash sale
Scan product, add quantity, discount, calculate GST, accept cash, post invoice, deduct stock and print receipt.

### Journey E — split payment
Accept cash + UPI/card, verify payment allocations and invoice payment status.

### Journey F — offline sale
Sync reference data, enable airplane mode, create sale, force-close app, reopen, verify sale remains, reconnect and sync. Verify exactly one server invoice.

### Journey G — duplicate sync
Submit same operation repeatedly and simulate lost server response. Verify one invoice and identical acknowledgement.

### Journey H — return
Return part of an invoice, choose restock/damaged, issue refund or customer credit, verify stock and accounting effects.

### Journey I — cashier shift
Open shift, create sales, record cash in/out, close shift, compare expected and counted cash.

### Journey J — reporting
Verify daily sales, payment summary, tax totals and stock report against source records.

## 5. Property-based and edge-case tests

- Zero quantity rejected.
- Negative quantity rejected except explicit return workflow.
- Very large quantity and precision.
- Fractional quantity.
- Unit conversion round-trip.
- 0%, 5%, 12%, 18%, 28% sample tax rates where configured.
- Inclusive and exclusive tax.
- Discounts at line and invoice level.
- Discount greater than permitted amount.
- Rounding boundaries.
- Mixed tax categories in one invoice.
- Duplicate barcode.
- Archived product in old invoice.
- Concurrent sale of last unit.
- Server timeout after commit.
- Device clock drift.
- Stale product revision.
- Revoked device sync.
- Partial sync batch failure.
- Print failure after successful sale.

## 6. Security tests

- Tenant A cannot read/update/delete Tenant B records.
- Branch cashier cannot access another branch.
- Cashier cannot change tax settings.
- Inventory manager cannot post refunds unless permission exists.
- Tenant admin cannot access platform Super Admin APIs.
- Client cannot override server-calculated totals.
- Device credential cannot sync for a different tenant.
- SQL injection and unsafe file upload checks.
- Rate limiting and session revocation.

## 7. UI automation

Web: Playwright with seeded personas and deterministic fixtures.  
Flutter: integration_test for Android flows.  
Backend: Jest and Supertest or equivalent.

Use stable test IDs. Do not rely on fragile positional selectors.

## 8. Test reporting

Every CI run reports:
- total tests
- passed/failed/skipped
- duration
- coverage for critical domain modules
- failed test logs/screenshots
- migration status

Coverage percentage is not a substitute for meaningful assertions. Prioritise 100% coverage of critical business invariants rather than a vanity global percentage.

## 9. Release gate

No release if any critical sale, payment, inventory, sync, tenant-isolation or restore test fails.
