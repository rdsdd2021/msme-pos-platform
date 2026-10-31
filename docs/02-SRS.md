# 02 — Software Requirements Specification (SRS)

## 1. Purpose

Define functional and non-functional requirements for the first release and the extensible platform foundation. Requirements use identifiers so they can be traced to code, tests and acceptance criteria.

Priority: P0 = release blocker; P1 = important; P2 = later.

## 2. Identity, tenant and access

- IAM-001 (P0): A user can authenticate using supported credentials.
- IAM-002 (P0): A user session is associated with one or more tenant memberships.
- IAM-003 (P0): Every API request to tenant resources is authorised against tenant membership and role.
- IAM-004 (P0): A user cannot access another tenant by changing an ID in a URL or request body.
- IAM-005 (P0): Roles and permissions are enforced on the backend.
- IAM-006 (P1): Owner can invite, deactivate and assign roles to employees.
- IAM-007 (P1): Branch-scoped roles can only access assigned branches.
- IAM-008 (P0): Sensitive actions are recorded in audit logs.

Acceptance: automated tests attempt cross-tenant reads, updates, deletes and sync ingestion and verify denial.

## 3. Business onboarding and settings

- TEN-001 (P0): Create a tenant with legal/trading name, business type, contact and address.
- TEN-002 (P0): Create at least one branch for each tenant.
- TEN-003 (P0): Configure state, GST registration status, GSTIN when applicable, invoice prefix and financial-year settings.
- TEN-004 (P0): Configure currency as INR for initial release.
- TEN-005 (P1): Configure language preference: English, Hindi or Bengali.
- TEN-006 (P1): Configure receipt width and default printer.
- TEN-007 (P1): Enable modules using tenant entitlements and industry configuration.

## 4. Product catalogue

- CAT-001 (P0): Create, update, archive and search products.
- CAT-002 (P0): Product supports name, SKU, barcode, category, unit, MRP, selling price, purchase cost and tax category.
- CAT-003 (P0): SKU/barcode uniqueness is enforced within the defined tenant scope.
- CAT-004 (P0): Product can be sold by configured unit.
- CAT-005 (P0): Unit conversion supports purchase/sale conversion, e.g. carton to packet.
- CAT-006 (P1): Bulk CSV import validates rows and reports failures.
- CAT-007 (P1): Product changes carry a version/revision for offline sync.
- CAT-008 (P1): Product images can be attached through object storage.

## 5. Sales and billing

- SAL-001 (P0): Cashier can create a cart and add products by search or barcode.
- SAL-002 (P0): Quantity, unit price, discount and tax are calculated using decimal-safe arithmetic.
- SAL-003 (P0): System supports configured CGST/SGST or IGST treatment.
- SAL-004 (P0): System supports tax-inclusive and tax-exclusive pricing according to tenant configuration.
- SAL-005 (P0): Cashier can record cash, UPI, card and other configured tender types. Offline UPI/card is a recorded assertion, not a verified settlement.
- SAL-006 (P0): Invoice is saved locally before offline success is shown.
- SAL-007 (P0): Online invoice creation is atomic and idempotent.
- SAL-008 (P0): Invoice contains immutable product/tax/customer/branch snapshots.
- SAL-009 (P0): Invoice can be rendered for 58mm, 80mm and PDF/A4 output as supported.
- SAL-010 (P0): Sale return/refund is a separate linked transaction and creates appropriate stock/payment/accounting adjustments.
- SAL-011 (P1): Split tender payments are supported.
- SAL-012 (P1): Cashier shift is associated with sales and cash movements.
- SAL-013 (P0): Posted invoice cannot be silently edited or deleted.

Acceptance: test tax-inclusive/exclusive cases, discounts, rounding, mixed tax, split payments, duplicate requests, offline replay and return flows.

## 6. Inventory

- INV-001 (P0): Opening stock can be recorded.
- INV-002 (P0): Purchase receipt increases stock through a ledger movement.
- INV-003 (P0): Sale decreases stock through a ledger movement.
- INV-004 (P0): Return increases eligible sellable stock; damaged/non-resellable returns are separately classified.
- INV-005 (P0): Adjustment requires reason and permission.
- INV-006 (P0): Stock balance is derived/maintained from immutable movements.
- INV-007 (P0): Negative-stock policy is configurable; MVP default should warn/block according to owner setting.
- INV-008 (P1): Low-stock threshold and reorder level are configurable.
- INV-009 (P1): Warehouses and branch transfers are supported in data model.
- INV-010 (P1): Weighted average cost is the initial costing method.
- INV-011 (P2): FIFO costing can be introduced later.
- INV-012 (P2): Batch/expiry and serial/IMEI tracking are supported by later vertical modules.

## 7. Purchases and suppliers

- PUR-001 (P0): Create supplier records.
- PUR-002 (P0): Record purchase invoice and line items.
- PUR-003 (P0): Record received quantity, purchase cost, tax and discounts.
- PUR-004 (P0): Receipt creates inventory movements.
- PUR-005 (P1): Record supplier payable and payment.
- PUR-006 (P1): Support purchase return linked to original receipt/invoice.
- PUR-007 (P1): Purchase order and goods receipt can be separate lifecycle steps.

## 8. Customers and credit

- CRM-001 (P0): Create and search customer.
- CRM-002 (P0): Customer can be attached to a sale.
- CRM-003 (P1): Customer credit ledger records debit/credit events.
- CRM-004 (P1): Customer outstanding is derived from ledger entries and allocations.
- CRM-005 (P1): Record customer payment against one or more invoices.
- CRM-006 (P2): Loyalty, memberships, segmentation and customer-specific pricing.

## 9. GST and accounting

- TAX-001 (P0): Configure tax rates and tax categories with effective dates.
- TAX-002 (P0): Persist tax snapshot on each posted invoice line.
- TAX-003 (P1): Sales and purchase tax registers can be generated.
- TAX-004 (P1): Credit/debit notes are supported.
- TAX-005 (P1): GSTR preparation/export reports are labelled as preparation tools unless filing integration is actually implemented.
- TAX-006 (P2): E-invoice and e-way bill adapters are added after provider and legal review.
- ACC-001 (P1): Maintain chart of accounts.
- ACC-002 (P1): Posted journal entries must balance.
- ACC-003 (P1): Sales, payments, purchases, expenses and returns can generate journal entries.
- ACC-004 (P1): Posted journals are immutable; corrections use reversal entries.
- ACC-005 (P2): Trial balance, P&L, balance sheet and cash-flow reports.
- ACC-006 (P2): Tally-compatible export and deeper integration.

## 10. Offline and sync

- SYN-001 (P0): Android and Windows/web installations each have unique device ID and tenant/branch assignment.
- SYN-001a (P0): Windows/web POS supports offline billing using a cached PWA shell, IndexedDB local data and durable outbox.
- SYN-002 (P0): Initial sync downloads authorised products, settings, customers and relevant reference data.
- SYN-003 (P0): Local sale is saved transactionally in SQLite before UI confirms success.
- SYN-004 (P0): Pending operations are stored in a durable outbox.
- SYN-005 (P0): Server accepts idempotency key and prevents duplicate posting.
- SYN-006 (P0): Sync supports retry with backoff and resumable cursor.
- SYN-007 (P0): Financial and stock events are append-only; no last-write-wins conflict strategy.
- SYN-008 (P0): UI shows offline state, pending count, last successful sync and failures.
- SYN-009 (P1): Device can be revoked; revoked device cannot upload new operations.
- SYN-010 (P1): Offline invoice numbering is allocated from server-reserved device ranges.

## 11. Hardware

- HW-001 (P0): Printer integration is behind a provider-independent interface.
- HW-002 (P0): First validated printer profile supports the selected EXEO model if protocol tests pass.
- HW-003 (P0): ESC/POS-capable 58mm and 80mm printers can be configured.
- HW-004 (P0): USB/Bluetooth connection failures are surfaced to user.
- HW-005 (P1): Barcode scanners using keyboard-wedge input are supported.
- HW-006 (P1): Windows local bridge exposes only authenticated local print operations.
- HW-007 (P1): Cash drawer opens only through supported printer kick/adapter command.
- HW-008 (P0): Print failure does not roll back a committed sale.

## 12. Reports

- REP-001 (P0): Daily sales summary.
- REP-002 (P0): Invoice list with filters.
- REP-003 (P0): Current stock and stock movement report.
- REP-004 (P1): Gross sales, discounts, tax and net sales are separately displayed.
- REP-005 (P1): Payment-mode summary and cashier shift report.
- REP-006 (P1): CSV export with permission checks.

## 13. Non-functional requirements

- NFR-001: Checkout must remain usable without network after required reference data is synced.
- NFR-002: Local sale persistence should normally complete within 500 ms on supported target devices, excluding printer time.
- NFR-003: Online API p95 target is under 500 ms for ordinary read operations under pilot load; complex reports may take longer.
- NFR-004: API and database must use TLS in production.
- NFR-005: Passwords/secrets are never stored in plaintext in application tables or logs.
- NFR-006: All financial amounts use decimal-safe representation.
- NFR-007: Database migrations are versioned, reviewed and reversible where practical.
- NFR-008: Automated backups and restore drills are mandatory.
- NFR-009: UI supports keyboard, touch and responsive layouts.
- NFR-010: System records audit history for privileged changes.
- NFR-011: Application supports English, Hindi and Bengali localisation architecture.
- NFR-012: System is observable through structured logs, health checks and error reporting.

## 14. Release acceptance gate

A release candidate cannot ship if:
- Any critical tenant-isolation test fails.
- Any duplicate invoice can be created by sync retry.
- A posted sale can create mismatched stock/payment totals.
- Offline sale is lost after app restart.
- A print failure causes sale loss or duplicate sale.
- A database restore drill fails.
- Critical checkout end-to-end tests fail.
