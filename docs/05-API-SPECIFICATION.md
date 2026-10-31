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

- `GET /auth/me` — current identity and memberships.
- `GET /tenants` — tenants accessible to user.
- `POST /tenants` — create tenant, subject to onboarding policy.
- `POST /tenants/{tenantId}/switch-context` — validate membership and return selected context.
- `GET /tenants/{tenantId}/branches`
- `POST /tenants/{tenantId}/branches`
- `GET /tenants/{tenantId}/members`
- `POST /tenants/{tenantId}/invitations`
- `PATCH /tenants/{tenantId}/members/{memberId}`

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

- `GET /customers?search=&cursor=`
- `POST /customers`
- `GET /customers/{customerId}`
- `PATCH /customers/{customerId}`
- `GET /customers/{customerId}/ledger`
- `POST /customers/{customerId}/payments`
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

## 11. Tax and accounting

- `GET /tax/configuration`
- `POST /tax/rates`
- `GET /tax/sales-register?from=&to=`
- `GET /tax/purchase-register?from=&to=`
- `GET /tax/gstr-preparation?period=`
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
