# 14 - Role & Permission Matrix (RBAC Specification)

**Document Version:** 1.0.0  
**Status:** Canonical Security & Access Control Contract  
**Governing Pattern:** Multi-Tenant Role-Based Access Control with Branch Scoping

---

## 1. Role Definitions & Scopes

The platform defines five distinct operational roles for Indian MSME retail businesses. Every role operates within an authenticated tenant boundary, and non-owner roles may be scoped to a single branch.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ROLE HIERARCHY & SCOPE                          │
├─────────────────────┬───────────────┬──────────────────────────────────┤
│ Role                │ Default Scope │ Operational Purpose              │
├─────────────────────┼───────────────┼──────────────────────────────────┤
│ 1. Owner            │ Tenant-wide   │ Total business & financial ctrl  │
│ 2. Branch Manager   │ Branch-scoped │ Branch operations, shifts, stock │
│ 3. Cashier          │ Branch-scoped │ Fast checkout, cash handling     │
│ 4. Inventory Staff  │ Branch-scoped │ Receiving, audits, shelf counts  │
│ 5. Accountant       │ Tenant-wide   │ GST filing, ledgers, statements  │
└────────────────────────────────────────────────────────────────────────┘
```

### 1.1 Role Descriptions
1. **Store Owner (`owner`)**:
   - The primary business owner. Has unrestricted access across all branches, tenant settings, subscription plans, device provisioning, financial reports, user invitations, catalog pricing, and mobile billing.
2. **Branch Manager (`branch_manager`)**:
   - Manages day-to-day operations for a specific physical branch. Can open/close cashier shifts, approve stock adjustments, handle customer Khata accounts, oversee cashiers, and view branch-specific daily sales reports.
3. **Cashier (`cashier`)**:
   - Front-of-store POS operator. Optimized for rapid barcode scanning, item entry, multi-tender payment collection (Cash, UPI, Card, Khata), and receipt printing. Cannot alter product prices, view gross profit margins, register devices, or perform manual stock adjustments.
4. **Inventory Staff (`inventory_staff`)**:
   - Warehouse and stock clerk. Authorized to scan inward goods (GRN/purchases), record physical stock counts, flag damaged/expired goods, and search product barcodes. Cannot bill customers, access financial reports, or view cashier registers.
5. **Accountant (`accountant`)**:
   - Financial analyst and tax consultant. Read-only access to invoices, sales totals, customer credit ledgers, and GST breakdown reports. Can export GSTR-1 summaries and record customer debt settlements. Cannot bill customers or alter product pricing.

---

## 2. Granular Permissions Definition

Every permission is uniquely represented as a namespaced action string: `<domain>:<action>`.

### Canonical Permission Keys
- **Authentication & Tenancy:**
  - `tenant:read` - View business details and branches
  - `tenant:update` - Update legal name, address, GSTIN, business settings
  - `tenant:members:manage` - Invite employees, assign roles, revoke access
  - `branch:create` - Create new branches (within subscription quota)
  - `branch:update` - Edit branch details and tax configurations
- **Catalog & Pricing:**
  - `catalog:read` - Browse and search products, categories, and prices
  - `catalog:create` - Add new products and categories
  - `catalog:update` - Edit prices, MRP, HSN codes, and barcodes
  - `catalog:delete` - Archive or deactivate products
- **Inventory & Stock Ledger:**
  - `stock:read` - View current stock balance projections
  - `stock:movement:record` - Record inward stock movements (GRN/Purchase)
  - `stock:adjustment:manual` - Adjust stock counts due to discrepancy/breakage (*Sensitive*)
  - `stock:transfer` - Initiate or receive inter-branch stock transfers
- **Billing & POS:**
  - `billing:pos:create` - Process sales, calculate GST, deduct stock, issue bills
  - `billing:invoice:read` - View posted invoices and line item snapshots
  - `billing:invoice:return` - Issue sales returns and credit notes (*Sensitive*)
  - `billing:price:override` - Apply ad-hoc item or bill-level discounts (*Sensitive*)
- **Cashier Shifts & Cash Management:**
  - `shift:open` - Open register with starting cash float
  - `shift:close:self` - Count and close personal cashier shift
  - `shift:close:override` - Force-close or audit another cashier's shift (*Sensitive*)
  - `shift:report:read` - View shift cash reconciliation and variance reports
- **Customer Khata (Credit Ledger):**
  - `khata:read` - View customer accounts, credit balances, and limits
  - `khata:create` - Register new customer Khata accounts
  - `khata:transact` - Disburse credit during checkout (subject to credit limit)
  - `khata:payment:record` - Record debt repayments from customers (*Sensitive*)
  - `khata:limit:manage` - Set or extend customer credit limits (*Sensitive*)
- **Reports & GST Compliance:**
  - `reports:daily:read` - View daily sales and tender totals for assigned branch
  - `reports:financial:read` - View business-wide margins, P&L, and turnover (*Sensitive*)
  - `reports:gst:export` - Generate GSTR-1, GSTR-3B tax summaries and exports
- **Devices & Subscriptions:**
  - `device:manage` - Register, activate, or revoke POS terminals
  - `subscription:manage` - View and upgrade subscription plans and limits
  - `hardware:print` - Dispatch print jobs to thermal printers

---

## 3. Permission-by-Permission Access Matrix

| Permission Key | Store Owner | Branch Manager | Cashier | Inventory Staff | Accountant | Sensitive Flag |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Tenancy & Organization** | | | | | | |
| `tenant:read` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| `tenant:update` | ✅ | ❌ | ❌ | ❌ | ❌ | ⚠️ SENSITIVE |
| `tenant:members:manage` | ✅ | ❌ | ❌ | ❌ | ❌ | ⚠️ SENSITIVE |
| `branch:create` | ✅ | ❌ | ❌ | ❌ | ❌ | ⚠️ SENSITIVE |
| `branch:update` | ✅ | ✅ (Own) | ❌ | ❌ | ❌ | |
| **Catalog & Pricing** | | | | | | |
| `catalog:read` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| `catalog:create` | ✅ | ✅ | ❌ | ✅ | ❌ | |
| `catalog:update` | ✅ | ✅ | ❌ | ❌ | ❌ | ⚠️ SENSITIVE |
| `catalog:delete` | ✅ | ❌ | ❌ | ❌ | ❌ | ⚠️ SENSITIVE |
| **Inventory & Stock** | | | | | | |
| `stock:read` | ✅ | ✅ (Own) | ✅ (Own) | ✅ (Own) | ✅ | |
| `stock:movement:record` | ✅ | ✅ (Own) | ❌ | ✅ (Own) | ❌ | |
| `stock:adjustment:manual` | ✅ | ✅ (Own) | ❌ | ❌ | ❌ | ⚠️ SENSITIVE |
| `stock:transfer` | ✅ | ✅ (Own) | ❌ | ✅ (Own) | ❌ | |
| **Billing & Invoicing** | | | | | | |
| `billing:pos:create` | ✅ | ✅ (Own) | ✅ (Own) | ❌ | ❌ | |
| `billing:invoice:read` | ✅ | ✅ (Own) | ✅ (Own) | ❌ | ✅ | |
| `billing:invoice:return` | ✅ | ✅ (Own) | ❌ | ❌ | ❌ | ⚠️ SENSITIVE |
| `billing:price:override` | ✅ | ✅ (Own) | ❌ | ❌ | ❌ | ⚠️ SENSITIVE |
| **Shifts & Cash Drawer** | | | | | | |
| `shift:open` | ✅ | ✅ (Own) | ✅ (Own) | ❌ | ❌ | |
| `shift:close:self` | ✅ | ✅ (Own) | ✅ (Own) | ❌ | ❌ | |
| `shift:close:override` | ✅ | ✅ (Own) | ❌ | ❌ | ❌ | ⚠️ SENSITIVE |
| `shift:report:read` | ✅ | ✅ (Own) | ❌ | ❌ | ✅ | |
| **Customer Khata** | | | | | | |
| `khata:read` | ✅ | ✅ | ✅ | ❌ | ✅ | |
| `khata:create` | ✅ | ✅ | ✅ | ❌ | ❌ | |
| `khata:transact` | ✅ | ✅ (Own) | ✅ (Own) | ❌ | ❌ | |
| `khata:payment:record` | ✅ | ✅ (Own) | ✅ (Own) | ❌ | ✅ | ⚠️ SENSITIVE |
| `khata:limit:manage` | ✅ | ✅ | ❌ | ❌ | ❌ | ⚠️ SENSITIVE |
| **Reports & GST** | | | | | | |
| `reports:daily:read` | ✅ | ✅ (Own) | ❌ | ❌ | ✅ | |
| `reports:financial:read` | ✅ | ❌ | ❌ | ❌ | ✅ | ⚠️ SENSITIVE |
| `reports:gst:export` | ✅ | ❌ | ❌ | ❌ | ✅ | |
| **Devices & Commercial** | | | | | | |
| `device:manage` | ✅ | ✅ (Own) | ❌ | ❌ | ❌ | ⚠️ SENSITIVE |
| `subscription:manage` | ✅ | ❌ | ❌ | ❌ | ❌ | ⚠️ SENSITIVE |
| `hardware:print` | ✅ | ✅ | ✅ | ✅ | ✅ | |

---

## 4. Branch-Level Restrictions & Enforcement Rules

1. **Owner Exemption:**
   - A user with the `owner` role has unrestricted access across all branches belonging to their tenant.
2. **Branch Scoping Rule:**
   - When a user's membership has a specific `branch_id`, any query or mutation targeting a branch resource must match the user's assigned `branch_id`. If `route.params.branchId != user.branchId`, the request is rejected with `403 Forbidden: Cross-branch access denied`.
3. **Multi-Branch Cashiers:**
   - Cashiers can only open shifts and bill customers in the branch currently active in their session.
4. **Stock Visibility:**
   - Cashiers and Inventory staff see inventory balances only for their assigned branch. Global multi-branch inventory is reserved for the Store Owner.

---

## 5. Sensitive Financial Permissions Policy

The platform designates eight operations as **High-Risk Financial Actions**:

1. **`stock:adjustment:manual`**:
   - Modifying stock without an inward invoice creates theft risk. Requires a non-empty audit reason string (`Breakage`, `Count Discrepancy`, `Shrinkage`) and emits a permanent audit log entry.
2. **`billing:invoice:return`**:
   - Reversing posted revenue requires manager or owner approval. Returns must always reference the original `invoice_id` and distinguish resellable from damaged goods (Rule 10).
3. **`billing:price:override`**:
   - Modifying a selling price at the time of cashier checkout must not be accessible to cashiers without a manager/owner override PIN.
4. **`khata:limit:manage`**:
   - Extending customer credit lines creates bad-debt risk. Restricted to Store Owner and Branch Manager.
5. **`khata:payment:record`**:
   - Accepting cash against an existing Khata debt must record the receiving user, time, and generate an immutable customer ledger credit entry.
6. **`shift:close:override`**:
   - Reconciling another cashier's cash register or closing a dormant shift must record the auditor user ID and preserve variance calculations.
7. **`reports:financial:read`**:
   - Gross margins, net profit, and purchase costs are hidden from cashiers and inventory staff to protect store commercial secrets.
8. **`tenant:members:manage`**:
   - Employee role changes and invitations are restricted strictly to the Store Owner.

---

## 6. Implementation Architecture

### 6.1 Backend Enforcement (`apps/backend`)
Every endpoint enforces authorization through a three-stage NestJS guard pipeline:

```typescript
@UseGuards(AuthGuard('jwt'), TenantGuard, PermissionsGuard)
@RequirePermissions(Permission.BILLING_POS_CREATE)
@Post('sales')
async createSale(...) { ... }
```

1. **`AuthGuard('jwt')`**: Validates the JWT access token and extracts `userId`.
2. **`TenantGuard`**: Resolves `tenantId` from route/header, confirms the user holds an active membership for that tenant, and extracts `roles: Role[]` and `branchId: string | null`. Validates branch route parameters: if the user is branch-scoped (`branchId IS NOT NULL`) and requests an operation on a different branch, immediately aborts with `403 Forbidden: Cross-branch access denied`. Attaches `TenantContext` to the request.
3. **`PermissionsGuard`**: Evaluates declared `@RequirePermissions(...)` against `getPermissionsForRoles(roles)`. Store owners automatically bypass specific permission checks within their tenant. Also enforces `@RequireTenantWide()` for tenant-level operations.
4. **`AuditService`**: Logs all sensitive and high-risk operations to the `audit_logs` table.
5. **Verification Suite**: 18 automated security and IDOR test scenarios in `apps/backend/src/tenants/guards/rbac-security.spec.ts` verify 100% of these rules.

### 6.2 Mobile & Web UI Enforcement
1. **Never Rely Solely on UI Hiding**: The backend guard pipeline remains the ultimate authority.
2. **Dynamic Navigation Shell**:
   - **Store Owner**: Full tab navigation (`Cashier POS`, `Analytics`, `Inventory`, `Khata`, `Settings`).
   - **Cashier**: Locks to `Cashier POS` and `Cash Register / Shift`.
   - **Inventory Staff**: Locks to `Stock Receive` and `Inventory Audit`.
   - **Accountant**: Locks to `Financial Reports`, `Ledger`, and `GST Export`.

