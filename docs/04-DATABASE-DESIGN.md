# 04 — Database Design

## 1. Conventions

- PostgreSQL.
- UUID primary keys (`gen_random_uuid()`).
- `timestamptz` in UTC.
- `numeric(14,2)` or higher precision for money; quantities use suitable `numeric` precision.
- Never use `float`/`double precision` for money.
- `tenant_id` on all tenant-owned records.
- `created_at`, `updated_at`; `created_by` where relevant.
- Posted financial/stock events are immutable.
- Use `archived_at` or `is_active` for catalogue deactivation, not hard deletion.
- Use composite tenant-aware foreign keys where possible.
- Use explicit status enums/check constraints with migration discipline.

## 2. Core identity and tenancy tables

### tenants
- id UUID PK
- legal_name
- display_name
- business_type (grocery, pharmacy, apparel, electronics, restaurant, wholesale, other)
- status (trial, active, suspended, closed)
- default_currency (INR)
- default_timezone (Asia/Kolkata)
- created_at, updated_at

### tenant_memberships
- id, tenant_id, user_id
- status
- joined_at
- UNIQUE(tenant_id, user_id)

### branches
- id, tenant_id
- code, name
- address fields, state_code
- gst_registration_id nullable
- timezone
- is_active
- UNIQUE(tenant_id, code)

### users / profiles
Identity provider owns credential secrets. Application profile stores:
- id matching auth subject
- full_name
- phone
- email
- preferred_language
- status

### roles, permissions, role_permissions, user_branch_roles
Support tenant-defined roles and branch-scoped assignments. Super Admin identity is separate from tenant roles.

### devices
- id, tenant_id, branch_id
- device_name, platform, app_version
- device_public_key or credential reference
- status, last_seen_at, revoked_at
- last_sync_cursor
- UNIQUE(tenant_id, device identifier)

## 3. Business configuration

### business_settings
- tenant_id PK
- industry_config JSONB (validated, versioned)
- tax_pricing_mode
- negative_stock_policy
- default_language
- invoice settings
- feature preferences

### invoice_series
- id, tenant_id, branch_id, registration_id nullable
- financial_year
- prefix, next_number
- reserved device ranges stored separately
- UNIQUE appropriate series scope

### tax_registrations
- id, tenant_id, branch_id
- gstin nullable
- registration_type
- state_code
- effective dates
- status

### tax_rates
- id, tenant_id nullable for system defaults
- code, rate, component_type
- effective_from, effective_to
- tax_category/HSN association

## 4. Catalogue

### categories
- id, tenant_id, parent_id nullable
- name, code, sort_order, is_active

### units
- id, tenant_id nullable
- name, symbol, decimal_places
- system units may be shared; tenant-specific custom units allowed

### products
- id, tenant_id
- category_id
- name, description
- product_type (stock, service, composite)
- base_unit_id
- sku
- barcode_primary nullable
- purchase_cost
- selling_price
- mrp
- tax_category_id
- hsn_code
- track_inventory
- allow_fractional_quantity
- version, is_active, archived_at

### product_barcodes
- id, tenant_id, product_id, barcode, unit_id nullable, variant_id nullable
- UNIQUE(tenant_id, barcode)

### product_variants
- id, tenant_id, product_id
- sku, attributes JSONB or normalized attributes
- selling_price_override, mrp_override
- barcode
- active

### unit_conversions
- id, tenant_id, product_id nullable
- from_unit_id, to_unit_id
- multiplier numeric
- conversion direction and validation
- Define one canonical base unit per product.

### price_lists / product_prices
Support future branch/customer-specific pricing with effective dates.

## 5. Inventory

### warehouses
- id, tenant_id, branch_id nullable
- code, name, is_active

### stock_ledger
- id, tenant_id, branch_id, warehouse_id
- product_id, variant_id nullable
- movement_type (opening, purchase, sale, sale_return, purchase_return, transfer_in, transfer_out, adjustment, damage, expiry)
- quantity_delta numeric
- unit_cost numeric
- source_type, source_id
- idempotency_key
- occurred_at, recorded_at
- created_by, reason
- immutable after posting

### stock_balances
- tenant_id, warehouse_id, product_id, variant_id
- quantity_on_hand
- quantity_reserved
- average_cost
- version, updated_at
- composite unique key

### stock_adjustments / stock_adjustment_lines
Documented stock counts, reason codes, approvals and ledger references.

### stock_transfers / stock_transfer_lines
Transfer lifecycle: draft, dispatched, received, cancelled. Stock movement on dispatch/receipt according to policy.

## 6. Sales

### invoices
- id, tenant_id, branch_id
- invoice_number
- invoice_series_id
- financial_year
- status (draft, posted, voided where legally permitted)
- customer_id nullable
- cashier_user_id, device_id
- invoice_date
- currency
- subtotal, line_discount_total, invoice_discount_total
- taxable_total, cgst_total, sgst_total, igst_total, cess_total
- grand_total, rounding_adjustment
- payment_status
- tax/customer/branch snapshots JSONB
- source_device_id, local_transaction_id
- created_at, posted_at
- UNIQUE(tenant_id, branch_id, invoice_series_id, invoice_number)
- UNIQUE(tenant_id, source_device_id, local_transaction_id)

### invoice_lines
- id, tenant_id, invoice_id
- product_id nullable (snapshot still retained)
- product_name_snapshot, sku_snapshot, hsn_snapshot
- quantity, unit_id, unit_price
- discount_amount, taxable_value
- tax_rate_snapshot, cgst_amount, sgst_amount, igst_amount
- line_total
- batch/serial references for future modules

### payments
- id, tenant_id, branch_id
- payment_method
- amount
- external_reference nullable
- status (recorded, pending_verification, settled, failed, refunded)
- received_at, device_id

### payment_allocations
- id, tenant_id, payment_id, invoice_id, amount

### sales_returns / sales_return_lines
Link to original invoice and lines; classify restock/damaged; create refund/credit balance.

### credit_notes / debit_notes
Separate document records linked to original transaction and tax snapshots.

## 7. Procurement

### suppliers
- id, tenant_id
- name, phone, email, GSTIN, address, status

### purchase_orders / purchase_order_lines
- tenant, branch, supplier, order number, status, expected date
- product, quantity, unit, cost, expected tax

### purchase_invoices
- id, tenant_id, branch_id, supplier_id
- supplier_invoice_number
- invoice_date, status
- subtotal, tax totals, grand_total
- source document snapshot

### purchase_invoice_lines
- product, quantity, unit, unit_cost, discount, tax snapshots, line total

### goods_receipts / goods_receipt_lines
Received quantities and warehouse destination; creates stock ledger entries.

### supplier_payments / supplier_payment_allocations
Supplier payment and invoice allocation.

## 8. Customers and credit

### customers
- id, tenant_id
- name, phone, email
- GSTIN, billing/shipping address
- customer_group_id
- credit_limit, status

### customer_ledger
- id, tenant_id, customer_id, branch_id
- entry_type (invoice_debit, payment_credit, adjustment, refund)
- debit, credit
- source_type, source_id
- occurred_at, created_by
- immutable

### loyalty_accounts / loyalty_transactions
Future feature. Points ledger, not editable balance.

## 9. Cash and shifts

### cashier_shifts
- id, tenant_id, branch_id, device_id, cashier_id
- opened_at, opening_cash
- closed_at, expected_cash, counted_cash, variance
- status

### cash_movements
- id, tenant_id, shift_id
- type (cash_in, cash_out, sale_cash, refund_cash, deposit)
- amount, reason, source_type, source_id

## 10. Accounting

### accounts
- id, tenant_id
- code, name, account_type
- parent_id nullable
- normal_balance
- is_system, is_active

### journal_entries
- id, tenant_id, branch_id
- entry_number, date, source_type, source_id
- status (draft, posted, reversed)
- narration
- posted_at, created_by
- reversal_of_id nullable

### journal_lines
- id, tenant_id, journal_entry_id, account_id
- debit, credit
- customer_id/supplier_id nullable
- branch_id, cost_center nullable
- CHECK(debit >= 0 AND credit >= 0)
- Validate total debits = total credits before posting.

### expenses / expense_categories
Expense source documents and accounting links.

## 11. Audit and sync

### audit_logs
- id, tenant_id nullable for platform events
- actor_user_id, actor_device_id
- action, entity_type, entity_id
- before_snapshot, after_snapshot
- request_id, occurred_at, ip metadata where appropriate

### sync_operations
- id, tenant_id, device_id
- operation_id UUID
- operation_type, payload JSONB
- client_sequence, client_created_at
- status, server_received_at
- response JSONB
- UNIQUE(tenant_id, device_id, operation_id)

### sync_cursors
- device_id, stream_name, cursor_value, updated_at

### outbox_events
Transactional outbox for events that must be processed after DB commit.

## 12. Subscription and entitlements

### plans
- id, code, name, billing_interval, price
- active

### plan_entitlements
- plan_id, feature_code, limit_value, enabled

### subscriptions
- id, tenant_id, plan_id
- status, starts_at, ends_at, renewal_at
- grace_until, provider_reference

### subscription_events
Auditable payment, renewal, suspension and plan-change events.

## 13. Hardware

### hardware_models
- manufacturer, model, hardware_type, supported_protocols JSONB

### tenant_devices / device_assignments
Business device assignment, branch, status, activation and revocation.

### printer_profiles
- model, paper_width_mm, protocol, code_page, cut_supported, drawer_kick_supported

### printer_jobs
- id, tenant_id, device_id, source_type, source_id
- payload_reference, status, attempt_count, last_error, created_at

## 14. Key indexes

- All high-use tenant tables: `(tenant_id, id)` or tenant-prefixed access indexes.
- Products: `(tenant_id, is_active, name)`; unique `(tenant_id, sku)` when SKU non-null.
- Barcodes: unique `(tenant_id, barcode)`.
- Invoices: `(tenant_id, branch_id, invoice_date DESC)`.
- Invoice number unique by actual series scope.
- Stock balances: unique `(tenant_id, warehouse_id, product_id, variant_id)`.
- Stock ledger: `(tenant_id, warehouse_id, product_id, occurred_at DESC)`.
- Customer ledger: `(tenant_id, customer_id, occurred_at DESC)`.
- Sync operations: unique `(tenant_id, device_id, operation_id)`.
- Audit logs: `(tenant_id, occurred_at DESC)`.

## 15. Database integrity rules

- Foreign keys include tenant identity where possible.
- A posted invoice cannot be hard-deleted.
- Stock ledger entries cannot be silently edited.
- Journal entries must balance before posting.
- Invoice and purchase snapshots are immutable.
- Idempotency keys are unique in their scope.
- Branch and warehouse must belong to the same tenant.
- Product, customer, invoice and payment references must not cross tenants.
- Use migration tests and seed data for each release.

## 16. SQLite local database

Local tables:
- local_meta
- local_products
- local_categories
- local_customers
- local_tax_config
- local_price_lists
- local_invoices
- local_invoice_lines
- local_payments
- local_stock_movements
- local_stock_balances
- local_outbox
- local_sync_cursors
- local_invoice_number_ranges
- local_printer_profiles
- local_print_jobs

SQLite schema should preserve decimal precision. Store money as integer paise where currency rules allow, or as validated decimal strings converted using a decimal library. Never use SQLite REAL for monetary values.
