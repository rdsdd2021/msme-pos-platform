# 08 — Implementation Roadmap

## 1. Delivery strategy

Build a grocery-first MVP with the universal foundations needed for future verticals. The budget is under ₹25,000, so use founder implementation and AI coding tools, minimise paid services and avoid scope expansion.

Do not attempt all industries, full accounting, all printer models and all offline edge cases in one release.

## 2. Phase 0 — Project setup and decisions

Deliver:
- Product name remains configurable/TBD.
- Git repository and branch policy.
- Monorepo or coordinated repositories.
- Docker Compose development environment.
- PostgreSQL local instance.
- NestJS health endpoint.
- Next.js shell.
- Flutter shell.
- OpenAPI generation.
- CI checks.
- Architecture Decision Records.

Exit gate: clean clone can start all required development services using documented commands.

## 3. Phase 1 — Identity and tenancy

Deliver:
- Authentication integration.
- User profile.
- Tenant creation.
- Memberships.
- Branch creation.
- Roles and permissions.
- Tenant-scoped API guard.
- Audit log.
- Seed owner and demo tenant.

Exit gate: cross-tenant security tests pass.

## 4. Phase 2 — Grocery catalogue and inventory

Deliver:
- Categories.
- Units and conversions.
- Products, SKUs and barcodes.
- Tax categories.
- Suppliers.
- Opening stock.
- Purchase invoice/receipt.
- Stock ledger and balance projection.
- Stock adjustment.
- Low-stock report.

Exit gate: purchase, sale simulation, return and adjustment reconcile against ledger.

## 5. Phase 3 — Billing engine

Deliver:
- POS product search.
- Barcode entry.
- Cart.
- Discount rules.
- Tax calculation.
- Payment methods.
- Invoice posting.
- Invoice history.
- Receipt document.
- Sales return.
- Cash shift basics.

Exit gate: tax and money calculation tests pass; sale is atomic and idempotent.

## 6. Phase 4 — Hardware

Deliver:
- Android printer abstraction.
- EXEO compatibility test.
- 58mm and 80mm layouts.
- Web print bridge proof of concept.
- Barcode scanner keyboard-wedge support.
- Print retry/reprint flow.

Exit gate: sale remains valid if printer disconnects; supported hardware matrix documented.

## 7. Phase 5 — Offline Android

Deliver:
- SQLite schema and migrations.
- Initial bootstrap.
- Cached catalogue.
- Local sale transaction.
- Local invoice/receipt.
- Outbox.
- Push/pull API.
- Idempotent ingestion.
- Retry/backoff.
- Sync status UI.
- Reserved invoice number mechanism.

Exit gate: airplane-mode sale survives force-close/restart and syncs exactly once.

## 8. Phase 6 — Business operations

Deliver:
- Customer records.
- Khata ledger.
- Supplier outstanding.
- Expense recording.
- Cash reconciliation.
- Daily sales report.
- Stock reports.
- CSV export.
- Basic accounting foundation.

Exit gate: daily business totals reconcile across invoices, payments, stock and accounting postings.

## 9. Phase 7 — Web POS and administration

Deliver:
- Full web POS.
- Product and inventory administration.
- Purchase and customer management.
- Business settings.
- User/role management.
- Web offline capability only if explicitly included and separately tested.
- Windows hardware bridge installer and pairing.

Exit gate: web workflows pass Playwright tests on supported browsers.

## 10. Phase 8 — Commercial readiness

Deliver:
- Super Admin.
- Subscription plans and entitlements.
- Device activation/revocation.
- Hardware assignment.
- Support workflow.
- Backup automation.
- Restore drill.
- Monitoring and alerting.
- Security review.
- Pilot onboarding documentation.

Exit gate: pilot acceptance checklist signed off.

## 11. Later vertical releases

Pharmacy:
- batch, expiry, medicine-specific catalogue, prescription workflows and applicable compliance.

Apparel:
- size/colour variants, exchanges, variant labels and stock matrix.

Electronics:
- serial/IMEI, warranty and service history.

Restaurant:
- order lifecycle, tables, KOT, KDS, kitchen stations, recipe inventory and split payments.

Wholesale:
- bulk pricing, customer-specific rates, units, schemes, dispatch and receivables.

## 12. Suggested budget guardrails

The initial ₹25,000 is a validation/development budget, not a realistic total cost for a fully commercial multi-industry platform.

Indicative allocation:
- ₹6,000 hardware and test devices/consumables
- ₹4,000 hosting, domain and infrastructure
- ₹5,000 integration/development expenses
- ₹3,000 pilot onboarding and field testing
- ₹7,000 contingency

Prefer free tiers and self-hosted development tools, but do not compromise backup, security or data recovery to save a small amount.

## 13. Release gates

No phase is considered complete merely because the UI exists. Each phase must include:
- code review
- unit tests
- integration tests
- relevant E2E tests
- migration verification
- documentation
- failure-path testing
- security checks
