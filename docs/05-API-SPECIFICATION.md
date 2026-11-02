# 05 — API Specification

## 1. General conventions

Base path: `/api/v1`

Authentication: Bearer access token. Device sync additionally requires an active registered device credential.

Headers:
- `Authorization: Bearer <token>`
- `Content-Type: application/json`
- `Idempotency-Key: <uuid>` for transaction-creating operations
- `X-Device-ID: <uuid>` for device-originated operations
- `X-Request-ID: <uuid>` optional client trace ID

JSON conventions:
- UUID strings for identifiers.
- ISO-8601 UTC timestamps.
- Money as decimal strings, e.g. `"99.50"`.
- Quantities as decimal strings where fractional quantities are allowed.
- Explicit API versioning.
- Never accept tenant_id as proof of access; derive tenant from authenticated membership and validate requested context.

## 2. Standard response

Success:
```json
{
  "data": {},
  "meta": {
    "request_id": "uuid"
  }
}
```

Error:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [],
    "request_id": "uuid"
  }
}
```

Common status codes: 200, 201, 204, 400, 401, 403, 404, 409, 422, 429, 500.

## 3. Authentication and context

### Endpoints
- `POST /auth/register` — public user registration.
- `POST /auth/login` — authenticate credentials:
  - For browser clients: sets `pos_refresh_token` in an `HttpOnly`, `SameSite=Strict`, `Secure` cookie.
  - Returns `{ accessToken, refreshToken, user }` in JSON body for mobile clients.
- `POST /auth/refresh` — token refresh:
  - Consumes either the `pos_refresh_token` cookie (web) or `{ refreshToken }` in JSON body (mobile).
  - Performs atomic refresh token rotation, returns new access token and updates cookie/body.
- `POST /auth/logout` — revokes the current session and clears the refresh cookie.
- `GET /auth/me` — current authenticated identity, profile, and accessible tenant memberships.

### Tenant & Branch Management
- `GET /tenants` — list tenants where caller holds active membership (`AuthGuard('jwt')`).
- `POST /tenants` — create new business tenant organization.
- `GET /tenants/{tenantId}` — get tenant profile (`@RequirePermissions(Permission.TENANT_READ)`).
- `PATCH /tenants/{tenantId}` — update business settings (`@RequirePermissions(Permission.TENANT_UPDATE)`).
- `GET /tenants/{tenantId}/branches` — list branches (`@RequirePermissions(Permission.TENANT_READ)`).
- `POST /tenants/{tenantId}/branches` — create new branch (`@RequirePermissions(Permission.BRANCH_CREATE)`).
- `GET /tenants/{tenantId}/members` — list members and assigned roles/branches (`@RequirePermissions(Permission.TENANT_MEMBERS_MANAGE)`).
- `POST /tenants/{tenantId}/members` — invite/add employee:
  - Body: `{ "userId": "uuid", "roles": ["cashier"], "branchId": "uuid" | null }`
  - Requires `@RequirePermissions(Permission.TENANT_MEMBERS_MANAGE)`. Emits audit log.
- `PATCH /tenants/{tenantId}/members/{memberId}` — update member role array or assigned branch:
  - Body: `{ "roles": ["cashier", "inventory_staff"], "branchId": "uuid" | null }`
  - Requires `@RequirePermissions(Permission.TENANT_MEMBERS_MANAGE)`. Emits audit log.
- `DELETE /tenants/{tenantId}/members/{memberId}` — revoke employee membership:
  - Requires `@RequirePermissions(Permission.TENANT_MEMBERS_MANAGE)`. Emits audit log.

### Enforced RBAC Permissions by Controller
All endpoints below enforce `@UseGuards(AuthGuard('jwt'), TenantGuard, PermissionsGuard)`:

- **Catalogue (`/catalog`)**:
  - `GET /catalog/products`, `GET /catalog/categories` ➔ `@RequirePermissions(Permission.CATALOG_READ)`
  - `POST /catalog/products`, `POST /catalog/categories` ➔ `@RequirePermissions(Permission.CATALOG_CREATE)`
  - `PATCH /catalog/products/:id` ➔ `@RequirePermissions(Permission.CATALOG_UPDATE)`
  - `DELETE /catalog/products/:id` ➔ `@RequirePermissions(Permission.CATALOG_DELETE)`
  - `POST /catalog/stock/adjust` ➔ `@RequirePermissions(Permission.STOCK_ADJUSTMENT_MANUAL)` (*Sensitive, audit logged*)
- **Billing & POS (`/billing`)**:
  - `POST /billing/calculate` ➔ `@RequirePermissions(Permission.BILLING_POS_CREATE)`
  - `POST /billing/checkout` ➔ `@RequirePermissions(Permission.BILLING_POS_CREATE)`
  - `GET /billing/invoices`, `GET /billing/invoices/:id` ➔ `@RequirePermissions(Permission.BILLING_INVOICE_READ)`
- **Operations & Khata (`/operations`)**:
  - `GET /operations/customers` ➔ `@RequirePermissions(Permission.KHATA_READ)`
  - `POST /operations/customers` ➔ `@RequirePermissions(Permission.KHATA_CREATE)`
  - `POST /operations/customers/:id/payments` ➔ `@RequirePermissions(Permission.KHATA_PAYMENT_RECORD)` (*Sensitive, audit logged*)
  - `POST /operations/shifts/open` ➔ `@RequirePermissions(Permission.SHIFT_OPEN)`
  - `POST /operations/shifts/:id/close` ➔ `@RequirePermissions(Permission.SHIFT_CLOSE_SELF)` (*Sensitive, audit logged*)
  - `GET /operations/reports/daily` ➔ `@RequirePermissions(Permission.REPORTS_DAILY_READ)`
- **Sync & Devices (`/sync`)**:
  - `POST /sync/push`, `POST /sync/pull` ➔ `@RequirePermissions(Permission.BILLING_POS_CREATE)`
  - `POST /sync/devices/register` ➔ `@RequirePermissions(Permission.DEVICE_MANAGE)`
- **Commercial & Subscription (`/commercial`)**:
  - `GET /commercial/plans` ➔ `@RequirePermissions(Permission.TENANT_READ)`
  - `POST /commercial/subscribe` ➔ `@RequirePermissions(Permission.SUBSCRIPTION_MANAGE)`

## 4. Devices

- `POST /devices/register`
- `GET /devices`
- `GET /devices/{deviceId}`
- `POST /devices/{deviceId}/revoke`
- `POST /devices/{deviceId}/heartbeat`
- `GET /devices/{deviceId}/configuration`

Device registration must verify user authority and tenant/branch assignment.

## 5. Catalogue

- `GET /products?search=&barcode=&categoryId=&cursor=&limit=`
- `POST /products`
- `GET /products/{productId}`
- `PATCH /products/{productId}`
- `POST /products/{productId}/archive`
- `GET /categories`
- `POST /categories`
- `PATCH /categories/{categoryId}`
- `GET /units`
- `POST /products/import-jobs`
- `GET /products/import-jobs/{jobId}`
- `GET /products/export`

Product writes require catalogue permissions and increment product revision/version.

## 6. Inventory

- `GET /inventory/balances?warehouseId=&productId=`
- `GET /inventory/ledger?productId=&from=&to=&cursor=`
- `POST /inventory/opening-stock`
- `POST /inventory/adjustments`
- `POST /inventory/adjustments/{id}/post`
- `GET /inventory/low-stock`
- `GET /warehouses`
- `POST /warehouses`
- `POST /inventory/transfers`
- `POST /inventory/transfers/{id}/dispatch`
- `POST /inventory/transfers/{id}/receive`

All stock-changing endpoints create ledger events. Direct stock balance edits are prohibited.

## 7. Sales

- `POST /sales/quote` — calculate totals without posting.
- `POST /sales` — post sale, requires Idempotency-Key.
- `GET /sales?from=&to=&branchId=&cashierId=&cursor=`
- `GET /sales/{saleId}`
- `POST /sales/{saleId}/returns`
- `POST /sales/{saleId}/credit-notes`
- `POST /sales/{saleId}/void-request` — only where policy and legal rules permit; otherwise use reversal/credit note.
- `GET /invoices/{invoiceId}/receipt-data`

Sale request example:
```json
{
  "branch_id": "uuid",
  "device_id": "uuid",
  "local_transaction_id": "uuid",
  "customer_id": null,
  "warehouse_id": "uuid",
  "lines": [
    {
      "product_id": "uuid",
      "quantity": "2",
      "unit_id": "uuid",
      "unit_price": "50.00",
      "discount_amount": "0.00"
    }
  ],
  "payments": [
    {
      "method": "cash",
      "amount": "118.00"
    }
  ],
  "client_totals": {
    "grand_total": "118.00"
  },
  "occurred_at": "2026-10-31T10:30:00Z"
}
```

The server recalculates and validates totals. Client totals are diagnostic only and must not be trusted.

## 8. Payments and shifts

- `POST /payments`
- `GET /payments`
- `POST /payments/{paymentId}/refunds`
- `POST /shifts/open`
- `POST /shifts/{shiftId}/cash-movements`
- `POST /shifts/{shiftId}/close`
- `GET /shifts/{shiftId}/summary`

## 9. Customers and suppliers

- `GET /tenants/{tenantId}/operations/customers` ➔ `@RequirePermissions(Permission.KHATA_READ)`
- `GET /tenants/{tenantId}/operations/customers/search?q=` ➔ `@RequirePermissions(Permission.KHATA_READ)`
  Searches customer accounts by name, normalized 10-digit phone number, or customer code.
- `POST /tenants/{tenantId}/operations/customers` ➔ `@RequirePermissions(Permission.KHATA_CREATE)`
  Creates customer profile with phone normalization (+91, 0091, leading 0 stripped). Rejects duplicates with HTTP 409 (`CUSTOMER_PHONE_EXISTS`) unless `confirmDuplicate: true` is passed.
- `GET /tenants/{tenantId}/operations/customers/{customerId}` ➔ `@RequirePermissions(Permission.KHATA_READ)`
- `PATCH /tenants/{tenantId}/operations/customers/{customerId}` ➔ `@RequirePermissions(Permission.KHATA_UPDATE)`
- `GET /tenants/{tenantId}/operations/customers/{customerId}/history` ➔ `@RequirePermissions(Permission.KHATA_READ)`
  Returns complete customer lifetime dossier: total invoices count, lifetime purchases value, total repayments value, current outstanding balance, credit limit, invoices, and chronological ledger movements.
- `POST /tenants/{tenantId}/operations/customers/{customerId}/merge` ➔ `@RequirePermissions(Permission.KHATA_UPDATE)` (*Sensitive, audit logged*)
  Controlled customer merge: reassigns all sales invoices and customer ledger records to target customer, recalculates target balance, marks source customer inactive (`[MERGED into ...]`), and logs immutable audit event (preserving all financial history per Rule 9).
- `POST /tenants/{tenantId}/operations/customers/dev-cleanup` ➔ `@RequirePermissions(Permission.KHATA_DELETE)`
  Safe development cleanup: strictly disabled in production (`NODE_ENV === 'production'`), safely deletes orphaned dev test customer profiles, and strictly refuses to delete any customer with posted invoices or ledger entries.
- `GET /tenants/{tenantId}/operations/customers/{customerId}/statement` ➔ `@RequirePermissions(Permission.KHATA_STATEMENT_VIEW)`
- `POST /tenants/{tenantId}/operations/customers/{customerId}/payments` ➔ `@RequirePermissions(Permission.KHATA_PAYMENT_RECORD)` (*Sensitive, audit logged*)
- `PATCH /tenants/{tenantId}/operations/customers/{customerId}/credit-limit` ➔ `@RequirePermissions(Permission.KHATA_CREDIT_LIMIT_UPDATE)` (*Sensitive, audit logged*)
- `GET /suppliers`
- `POST /suppliers`
- `GET /suppliers/{supplierId}`

Customer credit must be represented by ledger entries and allocations, not a mutable arbitrary balance.

## 10. Purchases

- `POST /purchase-orders`
- `GET /purchase-orders`
- `POST /purchase-orders/{id}/submit`
- `POST /goods-receipts`
- `POST /purchase-invoices`
- `GET /purchase-invoices`
- `POST /purchase-invoices/{id}/returns`
- `POST /supplier-payments`

Receipt posting creates stock ledger events atomically.

## 11. Tax and GST Reporting (Sub-Phase 3D & Pre-Phase 3E Implemented)

- `GET /tenants/{tenantId}/billing/reports/gst/gstr-1?from=&to=&month=&year=&branchId=` ➔ `@RequirePermissions(Permission.REPORTS_GST_EXPORT)`
  Returns canonical GSTR-1 preparation payload:
  - Table 4: B2B Invoices (recipient GSTIN, POS, rate, taxable value, CGST, SGST, IGST)
  - Table 5: B2C Large (inter-state unregistered sales). **Statutory Rule (Notification No. 12/2024-Central Tax)**: Threshold is ₹2,50,000 for sales prior to 1 August 2024; reduced to **₹1,00,000** for sales on or after 1 August 2024. All intra-state B2C sales regardless of value remain in Table 7 (B2CS).
  - Table 7: B2C Small (intra-state B2C supplies of any value + inter-state B2C supplies below applicable statutory threshold, aggregated by POS, rate, and supply type).
  - Table 12: HSN Summary (HSN code, description, UQC, qty, total value, taxes)
  - Table 13: Documents Summary (serial numbers, issued, cancelled, net)
  - Statutory CA review and portal reconciliation disclaimers.
  - Branch GSTIN configuration warning banner if branch GSTIN is unconfigured (`UNREGISTERED`).
- `GET /tenants/{tenantId}/billing/reports/gst/gstr-3b?from=&to=&month=&year=&branchId=` ➔ `@RequirePermissions(Permission.REPORTS_GST_EXPORT)`
  Returns canonical GSTR-3B monthly summary return:
  - Table 3.1: Details of Outward Supplies & Inward Supplies liable to Reverse Charge
  - Table 3.2: Inter-state supplies to unregistered persons
  - Table 4: Eligible & Ineligible Input Tax Credit (ITC) queried from verified vendor tax invoices
  - Tax Liability Settlement & Statutory Set-off (IGST -> CGST/SGST priority) with Net Cash Payable
  - Accountant audit warnings & exceptions
- `GET /tenants/{tenantId}/billing/reports/gst/sales-register?from=&to=&month=&year=&branchId=` ➔ `@RequirePermissions(Permission.REPORTS_FINANCIAL_READ)`
  Invoice-by-invoice sales and tax audit register
- `PATCH /tenants/{tenantId}/branches/:branchId` ➔ `@RequirePermissions(Permission.BRANCH_UPDATE)`
  Updates branch profile and statutory 15-character GSTIN (`UpdateBranchDto` validates format and matching state code prefix).
- `POST /tenants/{tenantId}/billing/supplier-invoices` ➔ `@RequirePermissions(Permission.STOCK_MOVEMENT_RECORD)`
  Records vendor tax invoice with line items, HSN, tax breakdown, and Section 16(2) ITC eligibility / Section 17(5) blocking flags
- `GET /tenants/{tenantId}/billing/supplier-invoices?branchId=` ➔ `@RequirePermissions(Permission.STOCK_READ)`
  Lists recorded vendor tax invoices for statutory Input Tax Credit (ITC) verification

### Traditional General Ledger & Accounting (Future Phase)
- `GET /accounting/accounts`
- `POST /accounting/accounts`
- `GET /accounting/journals`
- `POST /accounting/journals`
- `POST /accounting/journals/{id}/post`
- `POST /accounting/journals/{id}/reverse`
- `GET /accounting/trial-balance`
- `GET /accounting/profit-loss`
- `GET /accounting/balance-sheet`
- `GET /accounting/cash-flow`

Accounting reports should not be exposed as final/complete until all required source postings and accounting policies are implemented and verified.

## 12. Reports

- `GET /reports/daily-sales`
- `GET /reports/payment-summary`
- `GET /reports/stock-summary`
- `GET /reports/stock-movement`
- `GET /reports/gross-margin`
- `GET /reports/cashier-shifts`
- `POST /reports/exports`

Large exports should be background jobs with expiring download links.

## 13. Sync API

- `POST /sync/bootstrap`
- `POST /sync/push`
- `GET /sync/pull?cursor=`
- `GET /sync/status`
- `POST /sync/acknowledge`

Push example:
```json
{
  "device_id": "uuid",
  "operations": [
    {
      "operation_id": "uuid",
      "sequence": 105,
      "type": "SALE_CREATED",
      "schema_version": 1,
      "occurred_at": "2026-10-31T10:30:00Z",
      "payload": {}
    }
  ]
}
```

Response:
```json
{
  "data": {
    "results": [
      {
        "operation_id": "uuid",
        "status": "accepted",
        "server_entity_id": "uuid",
        "server_sequence": 12345
      }
    ],
    "next_pull_cursor": "opaque-cursor"
  }
}
```

Statuses: accepted, already_processed, rejected, needs_review. Rejections include stable error codes. The server stores the operation result for idempotent retries.

## 14. Subscriptions and Super Admin

Tenant-facing:
- `GET /subscription`
- `GET /subscription/entitlements`
- `GET /subscription/invoices`

Super Admin:
- `GET /admin/tenants`
- `POST /admin/tenants`
- `PATCH /admin/tenants/{id}/status`
- `GET /admin/plans`
- `POST /admin/plans`
- `POST /admin/subscriptions`
- `GET /admin/devices`
- `POST /admin/devices/{id}/revoke`
- `GET /admin/audit`

Every Super Admin endpoint requires a separate platform permission and audit entry.

## 15. API implementation requirements

- Generate OpenAPI from NestJS decorators or a maintained schema source.
- Validate all input at boundary.
- Use DTOs and allowlists; never mass-assign request JSON to ORM entities.
- Enforce permissions in service/policy layer.
- Use database transactions for multi-record posting.
- Use idempotency records for sale, payment and sync ingestion.
- Rate-limit authentication and public endpoints.
- Do not expose raw database errors.
- Add request IDs and structured logs.
- Write contract tests for critical endpoints.
