# 18 — UI/UX Modernization Roadmap & Execution Plan

**Document Version:** 1.1.0  
**Status:** Completed & Fully Verified  
**Guiding Rule:** Zero Regressions, Zero API Changes, Zero Database Alterations  

---

## 1. Implementation Principles & Guardrails

To modernize the frontend while maintaining 100% backward compatibility and architectural stability:
1. **Zero Backend Changes**: All existing REST endpoints (`/api/v1/*`), DTOs, TypeORM migrations, and PostgreSQL schemas remain untouched.
2. **Preserve Business Logic & Permissions**: Existing RBAC permissions (`Permission.*`), decimal-safe math, integer-paisa recalculations, idempotency keys, and audit logs must be strictly preserved.
3. **Decouple Without Destruction**: Incrementally extract modular domain components from the monolithic `admin-dashboard.tsx` (4,780 lines) into dedicated feature directories (`apps/web/src/features/*`), running tests after each extraction.
4. **No Visual Regressions**: Every redesigned screen must maintain or exceed existing test coverage (currently 33/33 web unit tests green).

---

## 2. Screen Categorization: Scope of Work

```
┌────────────────────────────────────────────────────────────────────────┐
│                   SCREEN REDESIGN SCOPE MATRIX                         │
├──────────────────────────────────┬─────────────────────────────────────┤
│ COMPLETE REDESIGN (Tier 1)       │ MINOR REFINEMENT (Tier 2)           │
├──────────────────────────────────┼─────────────────────────────────────┤
│ 1. Navigation Shell & Sidebar    │ 1. Shift Open/Close Modal           │
│ 2. Cashier POS Terminal (Tablet) │ 2. Stock Adjustment Dialog          │
│ 3. POS Checkout Slide-over       │ 3. Category & Unit Manager          │
│ 4. Product Catalogue Data Table  │ 4. Branch GSTIN Config Modal        │
│ 5. Purchase Order & Inward GRN   │ 5. Dev Test Cleanup Modal           │
│ 6. Customer Khata & Dossier View │ 6. POS Device Revocation Card       │
│ 7. GST Reports & Returns Hub     │ 7. Plan & Subscription Details      │
└──────────────────────────────────┴─────────────────────────────────────┘
```

---

## 3. Phased Implementation Roadmap

---

### Sprint 1: Shadcn/UI Foundation, Tokens & Polished Primitives
**Goal:** Establish the modern, high-polish Shadcn UI design foundation without modifying business logic.

#### Tasks:
1. Initialize Shadcn UI configuration (`apps/web/components.json`) using the **New York** style and **Slate** neutral palette.
2. Install `lucide-react` for crisp vector iconography, eliminating all Unicode emojis.
3. Configure `apps/web/tailwind.config.ts` and `apps/web/src/app/globals.css` with full Shadcn HSL CSS variables (`--card`, `--popover`, `--muted`, `--accent`, `--border`, `--input`, `--ring`, `--sidebar-*`).
4. Install and configure canonical Shadcn UI component primitives in `apps/web/src/components/ui/`:
   - **Feedback & Overlays**: `Sheet` (slide-over drawers), `Dialog`, `AlertDialog` (destructive action confirmations), `Sonner` (toast notifications), `Tooltip`.
   - **Navigation & Menus**: `Sidebar` (collapsible rail navigation), `DropdownMenu` (action menus, profile dropdown), `Tabs` (clean underline and pill tabs), `Command` (`cmdk` instant search palette).
   - **Form Controls**: `Button` (with sizes and loading states), `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`, `Label`.
   - **Data Display**: `Table` (polished hover rows, sticky header), `Badge` (muted semantic status indicators), `Card`, `Avatar`, `Separator`, `Skeleton` (shimmer pulse loading).
5. Add unit and visual tests for UI primitives in `apps/web/src/components/ui/__tests__/`.

---

### Sprint 2: Global Shell & Role-Based Navigation Architecture (Shadcn Sidebar)
**Goal:** Replace the dark binary switcher with a modern Shadcn Sidebar for management and a dedicated Cashier full-screen shell.

#### Tasks:
1. Implement `AppSidebar` (`apps/web/src/components/layout/app-sidebar.tsx`) using Shadcn's modern `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, and `SidebarRail`:
   - Collapsible left navigation (expanded 240px / icon rail collapsed 64px) with smooth 150ms transitions.
   - Dynamic item filtering based on authenticated role (`Owner`, `Branch Manager`, `Cashier`, `Inventory Staff`, `Accountant`).
   - Store & Branch Selector popover built with Shadcn `Popover` and `Command`.
   - User profile dropdown with Shadcn `Avatar`, role badge, and logout action.
2. Implement `AppHeader` (`apps/web/src/components/layout/app-header.tsx`):
   - Shadcn `Breadcrumb` navigation, branch indicator badge, `Command` search trigger (`⌘K`), and system status.
3. Implement `CashierTerminalShell` (`apps/web/src/components/layout/cashier-shell.tsx`):
   - Distraction-free, full-screen touch container optimized for high-speed counter billing.
4. Refactor `apps/web/src/app/page.tsx` to mount the appropriate shell dynamically while strictly preserving existing auth state (`useAuthStore`).

---

### Sprint 3: Cashier POS Modernization & Shadcn Sheet Checkout
**Goal:** Transform the cashier experience into an ultra-fast, responsive, touch-friendly terminal.

#### Tasks:
1. Refactor `pos-checkout.tsx`:
   - Enforce fixed 60/40 horizontal split that **never collapses vertically** on tablets (landscape).
   - High-contrast touch product cards with large prices, stock indicators, and clean Shadcn `Badge` category pills.
   - Expand cart item quantity controls to minimum 36px touch targets.
   - Replace raw emojis with crisp Lucide icons (`ShoppingCart`, `QrCode`, `Banknote`, `CreditCard`, `BookOpen`).
2. Implement `PaymentDrawer` using Shadcn **`Sheet`** (replacing centered `checkout-modal`):
   - Right slide-over panel with quick cash preset buttons (`Exact`, `₹100`, `₹200`, `₹500`, `₹2000`).
   - Instant calculation and prominent display of **"Change Due"** in 24px emerald typography.
   - Streamlined split payment toggle without nested modals.
3. Implement inline Customer quick-picker with phone normalization and duplicate prevention using Shadcn `Command`.
4. Replace browser alerts and error banners with Shadcn **`Sonner`** toast notifications.
5. Verify existing POS billing test cases in `page.test.tsx` pass without regression.

---

### Sprint 4: Modularizing the Backoffice & Product Catalogue (Shadcn Data Table)
**Goal:** Extract Catalogue and Inventory management from `admin-dashboard.tsx` into modular feature components.

#### Tasks:
1. Create `src/features/catalog/`:
   - `product-list-view.tsx`: Modern Shopify-style Data Table built with Shadcn `Table`, `DropdownMenu` row actions, and column filters.
   - `product-drawer.tsx`: Shadcn `Sheet` for adding/editing products with progressive disclosure via Shadcn `Tabs` (Basic → Pricing/Tax → Stock).
   - `category-manager.tsx`: Clean category tree and unit of measure list using Shadcn `Card` and `Badge`.
2. Create `src/features/inventory/`:
   - `stock-balances-view.tsx`: Branch stock balances with compact valuation KPI cards.
   - `stock-adjustment-dialog.tsx`: Clean Shadcn `Dialog` with structured audit reason selection via Shadcn `Select`.
3. Connect views to existing `apiClient` methods.
4. Run monorepo typecheck and web unit tests.

---

### Sprint 5: Purchasing, Suppliers & Inward GRN
**Goal:** Modernize the procurement journey into an intuitive fulfillment pipeline.

#### Tasks:
1. Create `src/features/purchasing/`:
   - `purchase-order-list.tsx`: PO status pipeline cards (`Draft`, `Ordered`, `Partially Received`, `Fulfilled`) using Shadcn `Card` and `Badge`.
   - `create-po-modal.tsx`: Structured line item builder using Shadcn `Dialog`, `Table`, and `Input` with live tax/margin calculations.
   - `grn-receipt-modal.tsx`: High-clarity inward receiving modal with "Ordered vs Previously Received vs Arriving" balance tables.
   - `supplier-directory.tsx`: Vendor management table with GSTIN and contact details.
2. Verify atomic stock ledger posting via existing backend GRN endpoints.

---

### Sprint 6: Customer Khata, Receivables & Account Merging
**Goal:** Deliver a unified, human-friendly customer debt and repayment experience.

#### Tasks:
1. Create `src/features/customers/`:
   - `customer-directory.tsx`: Customer accounts table with receivables summary cards and single primary "Receive Payment" action.
   - `customer-profile-drawer.tsx`: Unified profile using Shadcn `Sheet` and `Tabs` consolidating Statement, Lifetime Purchase History, and Credit Limits into one tabbed drawer.
   - `repayment-dialog.tsx`: Streamlined Shadcn `Dialog` supporting Cash, UPI, Card, and Bank Transfer with idempotency protection.
   - `customer-merge-dialog.tsx`: Clear side-by-side customer merge preview using Shadcn `AlertDialog` highlighting target balance calculation and audit logging.

---

### Sprint 7: GST Reporting & Compliance Hub
**Goal:** Transform the dense tax reporting screens into an executive-ready compliance dashboard.

#### Tasks:
1. Refactor `gst-reports-view.tsx`:
   - Flatten 4-tier nested tabs into vertical sections using Shadcn `Tabs`:
     - GSTR-1 Preparation (Tables 4, 5, 7, 12, 13)
     - GSTR-3B Monthly Return (Table 3.1 & Table 4 ITC)
     - Sales Tax Register
     - Vendor Tax Invoices (ITC Section 16(2) proof)
   - Human-readable headings with subtle statutory sub-labels.
   - Consolidated Export action bar (`Download GSTN JSON`, `Export Excel/CSV`, `Print Statutory Summary`) using Shadcn `DropdownMenu`.
   - Clear statutory warnings using Shadcn `Alert` (`AlertTitle`, `AlertDescription`).

---

### Sprint 8: Settings, Shifts, Devices & Final Polish
**Goal:** Complete system configuration and run full end-to-end verification.

#### Tasks:
1. Create `src/features/settings/`:
   - `branch-settings-view.tsx`: Branch list and GSTIN configuration with state code validation.
   - `shift-management-view.tsx`: Daily shift log with red/green cash variance badges.
   - `device-management-view.tsx`: Registered terminal devices with friendly names and status badges.
   - `subscription-view.tsx`: Plan details and feature entitlements.
2. Run comprehensive QA verification:
   - Full monorepo typecheck (`pnpm -r typecheck`).
   - Backend unit and integration test suite (`pnpm --filter @pos/backend test`).
   - Web unit and component test suite (`pnpm --filter @pos/web test`).
   - Playwright end-to-end smoke test suite (`pnpm --filter @pos/web test:e2e`).
   - WCAG 2.1 AA accessibility audit.

---

## 4. Dependencies & Risk Management

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| **Breaking Jest Test Selectors** | High | Retain all existing `data-testid` attributes (`pos-checkout-screen`, `admin-dashboard`, `product-card-*`, `pay-cash-btn`, `add-product-btn`, etc.) during HTML refactoring. |
| **State Synchronization Issues** | Medium | Maintain existing Zustand stores (`useAuthStore`, `useCartStore`) as the central source of truth; avoid introducing conflicting global state. |
| **Layout Thrashing in POS Grid** | High | Use fixed CSS grid templates with `minmax()` and pre-allocate image/skeleton dimensions to achieve CLS < 0.05. |
| **Accidental Backend API Drifts** | Critical | Strict rule: zero modifications to `apps/backend/` during UI modernization sprints. All client calls consume existing typed `apiClient` signatures. |

