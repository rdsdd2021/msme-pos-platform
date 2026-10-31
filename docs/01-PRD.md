# 01 — Product Requirements Document (PRD)

## 1. Product summary

Build a branded, multi-tenant, offline-first Point of Sale and business management SaaS for Indian MSMEs. The platform combines billing, inventory, purchases, customers, basic accounting, reporting and supported hardware. It will support multiple industries through reusable core modules and industry-specific extensions.

The initial commercial product is a grocery/kirana POS for Android and web, with offline billing and thermal printing.

## 2. Vision

Give small and medium Indian businesses an affordable, dependable business operating platform that works at the counter even when internet connectivity is unreliable, while allowing owners to manage operations across branches and devices.

## 3. Business model

- SaaS subscription billed monthly or annually.
- Hardware sold as a bundle or alongside annual subscription.
- Plans are priced per business, with entitlements for branches, devices, users and features.
- The platform owner manages tenants, plans, subscriptions, devices and support through a separate Super Admin area.
- Brand is owned and controlled by the product operator. Product name is not yet selected.

## 4. Target users and personas

### 4.1 Business owner
Owns the shop/company, configures business and tax settings, monitors sales and profit, manages staff, branches and subscription.

### 4.2 Cashier
Searches/scans products, creates bills, accepts payments, prints receipts and closes shifts. Needs a very fast, low-friction interface.

### 4.3 Store manager
Manages products, prices, stock, purchases, returns, cashiers and daily operations.

### 4.4 Inventory manager
Receives stock, records adjustments, checks stock, manages suppliers and transfers.

### 4.5 Accountant
Reviews sales/purchase registers, GST summaries, expenses, receivables, payables and accounting reports.

### 4.6 Platform Super Admin
Creates tenants, manages plans, subscriptions, device assignments, support and platform-level settings. Must not casually access tenant financial data.

## 5. Target segments

- Small independent shops
- Medium-sized businesses
- Large retail chains (future scale target)
- Restaurants and cafes (future vertical)
- Wholesale/distribution (future vertical)

## 6. Industry roadmap

The platform is designed for:
1. Kirana / grocery — first release
2. Pharmacy
3. Apparel
4. Electronics
5. Restaurant
6. Wholesale / distribution
7. Other configurable retail businesses

The initial release must not expose incomplete industry workflows. Industry-specific modules are enabled through server-controlled entitlements and tenant configuration.

## 7. Platforms

### Android
Flutter application for full POS, product lookup, inventory operations, customer lookup, sales, purchases (as permitted), reports, local SQLite storage, sync and printer integrations.

### Web
Next.js application supporting full POS, business administration and a separately permissioned Super Admin area.

### Windows
The first Windows experience is the Next.js web app in a supported browser plus a separately installed local hardware bridge for local printers and peripherals. A packaged desktop application is not required for MVP.

## 8. MVP scope

### Must have
- Tenant/business onboarding
- One business and one branch per tenant for initial MVP, with schema supporting multiple branches
- User login and role-based access
- Grocery business profile and GST configuration
- Product categories and products
- SKU/barcode lookup
- Units and unit conversion
- Purchase entry and supplier records
- Opening stock and stock adjustments
- Stock ledger and current stock balances
- POS cart and checkout
- Discounts and GST calculations
- Cash payment and recording of other payment modes
- Invoice creation and receipt rendering
- 58mm/80mm printer abstraction; first validated printer may be EXEO EX-5810
- Customer records and basic credit ledger
- Sales history and returns/credit notes
- Daily sales and stock reports
- Offline product cache, local sales, local receipt printing and retryable sync on Android and Windows/web (Flutter SQLite on Android; PWA + IndexedDB + service worker on Windows/web)
- Idempotent transaction ingestion
- Audit logs for sensitive actions
- Backup and restore process
- Automated test suite for critical journeys

### Should have
- Customer purchase history
- Low-stock alerts
- Cashier shifts and cash reconciliation
- CSV product import/export
- Business-specific invoice template
- Expense recording
- Basic chart of accounts and journal foundation
- English, Hindi and Bengali interface foundations

### Later
- Multi-branch stock transfer UI
- Advanced loyalty and memberships
- WhatsApp invoice and payment reminders
- Tally-compatible export
- Full accounting reports
- GSTR preparation enhancements
- E-invoice/e-way bill integrations through authorised provider/API
- Pharmacy, apparel, electronics, restaurant and wholesale modules
- Online ordering and delivery integrations

## 9. Out of scope for first release

- Native iOS application
- Windows native desktop package
- Full ERP/accounting replacement
- Live GST return filing
- Live e-invoice/e-way bill submission
- Pharmacy prescription compliance workflow
- Restaurant KOT/KDS
- Payroll
- Marketplace integrations
- Multi-device local LAN master/replica mode
- Guaranteed operation of every printer brand without hardware certification/testing

## 10. Product principles

- Offline-first at the point of sale.
- Cashier-first usability.
- Business-owner visibility.
- Tenant isolation by design.
- Auditable financial operations.
- Configurable industry workflows.
- Hardware abstraction.
- Simple deployment and maintainability.
- No unnecessary microservices in MVP.

## 11. Success metrics

Pilot targets, to be validated with real stores:
- A cashier can complete a standard sale in under 30 seconds after training for a typical 1–5 item basket.
- A local offline sale is durably saved before success is shown.
- No duplicate invoice is created after repeated sync retries.
- Stock movement and invoice totals reconcile for all tested transactions.
- Printer setup can be completed by a trained operator without code changes.
- Critical checkout workflow automated test pass rate is 100% in release candidate.
- No unresolved critical/high tenant-isolation defects.
- Backup restore drill succeeds before first paying customer.

## 12. Risks and assumptions

- Home-server uptime, power and ISP reliability may be inadequate for commercial production.
- Offline multi-device sales can temporarily produce divergent stock views.
- Printer models vary in ESC/POS compatibility, character encoding and Bluetooth/USB behaviour.
- GST rules and invoice requirements must be reviewed with an Indian CA and current official guidance.
- Accounting treatment must be reviewed by a qualified accountant/CA.
- A ₹25,000 initial budget requires strict MVP scope and substantial founder implementation effort.
- Large retail chain support is an architectural target, not a first-release performance guarantee.
