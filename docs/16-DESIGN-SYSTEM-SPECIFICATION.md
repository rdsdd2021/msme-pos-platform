# 16 — Design System Specification & Token Architecture

**Specification Version:** 1.0.0  
**Status:** Approved Target Design Contract  
**Design Paradigm:** Premium Modern Retail SaaS (Linear / Stripe / Shopify Admin aesthetic)  
**Default Theme:** High-Legibility Light Surface with Subtle Elevations  

---

## 1. Design Principles & Aesthetic Foundations

1. **Clarity Over Cleverness**: Retail transactions and financial ledgers require absolute legibility. High-contrast typography and unambiguous numbers take precedence over decorative flourishes.
2. **Predictable & Fast**: Every micro-interaction, button press, and modal transition must feel instantaneous (<150ms). Zero layout shifts (CLS < 0.05).
3. **Intentional Semantic Color**: Color is an informational tool, not decorative wallpaper. Greys and neutrals establish structure; semantic colors (Emerald, Amber, Rose, Blue) indicate status and financial direction only.
4. **Accessible by Default**: All text meets WCAG 2.1 AA 4.5:1 contrast standards. Interactive touch targets for POS terminal are at least 44×44px. Full keyboard navigation (`Tab`, `Enter`, `Escape`, `F1-F12`) across every view.
5. **No Emojis as UI Controls**: All raw emojis are superseded by crisp, 1.5px stroke geometric SVG icons (`lucide-react`).

---

## 2. Color Token Architecture

The design system uses HSL-based CSS custom properties compatible with Tailwind CSS and Shadcn/UI primitives.

### 2.1 Primitive Neutral Palette (Slate Spectrum)
```css
--slate-50:   210 40% 98%;   /* #F8FAFC - Main App Canvas Background */
--slate-100:  210 40% 96.1%; /* #F1F5F9 - Subtle Surface / Table Hover */
--slate-200:  214.3 31.8% 91.4%; /* #E2E8F0 - Component Borders & Dividers */
--slate-300:  212.7 26.8% 84.3%; /* #CBD5E1 - Interactive Form Borders */
--slate-400:  215.4 16.3% 56.9%; /* #94A3B8 - Placeholder Text / Inactive Icons */
--slate-500:  215.3 19.3% 34.5%; /* #64748B - Secondary Metadata / Helper Text */
--slate-600:  215.3 25% 26.7%;   /* #475569 - Body Text */
--slate-700:  217.2 32.6% 17.5%; /* #334155 - Strong Body Text / Subheaders */
--slate-800:  222.2 47.4% 11.2%; /* #1E293B - Headings / Dark Accents */
--slate-900:  222.2 84% 4.9%;    /* #0F172A - High Contrast Titles / Selected Elements */
--slate-950:  222.2 84% 3.5%;    /* #020617 - Deepest Contrast / Terminal Header */
```

### 2.2 Semantic Functional Tokens
```css
:root {
  /* Surface Layers */
  --background: 210 40% 98%;         /* App page canvas */
  --foreground: 222.2 84% 4.9%;       /* Primary text */

  --card: 0 0% 100%;                  /* Elevated cards and table surfaces */
  --card-foreground: 222.2 84% 4.9%;

  --popover: 0 0% 100%;               /* Dropdowns, tooltips, popovers */
  --popover-foreground: 222.2 84% 4.9%;

  --muted: 210 40% 96.1%;             /* Inactive tabs, table headers */
  --muted-foreground: 215.4 16.3% 46.9%; /* Subtle descriptions */

  --border: 214.3 31.8% 91.4%;        /* Dividers, card boundaries */
  --input: 214.3 31.8% 91.4%;         /* Input field borders */
  --ring: 221.2 83.2% 53.3%;          /* Focus visible ring */

  /* Brand Primary (Indigo-Slate Focus) */
  --primary: 221.2 83.2% 53.3%;       /* #2563EB - Primary Brand Blue */
  --primary-foreground: 210 40% 98%;

  /* Functional Status: Success / Financial Credit */
  --success: 158 64% 40%;             /* #10B981 - Emerald */
  --success-foreground: 0 0% 100%;
  --success-muted: 152 76% 96%;       /* #ECFDF5 - Emerald-50 */
  --success-border: 149 60% 80%;      /* #A7F3D0 - Emerald-200 */

  /* Functional Status: Warning / Stock Alert */
  --warning: 38 92% 50%;              /* #F59E0B - Amber */
  --warning-foreground: 0 0% 100%;
  --warning-muted: 48 100% 96%;       /* #FFFBEB - Amber-50 */
  --warning-border: 45 93% 82%;       /* #FDE68A - Amber-200 */

  /* Functional Status: Destructive / Debt / Shortage */
  --destructive: 350 89% 60%;         /* #F43F5E - Rose */
  --destructive-foreground: 0 0% 100%;
  --destructive-muted: 355 100% 97%;  /* #FFF1F2 - Rose-50 */
  --destructive-border: 352 96% 89%;  /* #FECDD3 - Rose-200 */

  /* Functional Status: Info / Informational Notice */
  --info: 217 91% 60%;               /* #3B82F6 - Sky/Blue */
  --info-muted: 214 100% 97%;
  --info-border: 213 94% 87%;
}
```

---

## 3. Typography Scale & Hierarchy

The platform standardizes on **Inter** (with fallbacks to `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`). Tabular figures (`tabular-nums`) are strictly enforced for all prices, quantities, dates, and SKUs to prevent visual jitter.

| Token | Size | Line Height | Weight | Letter Spacing | Purpose |
|---|---|---|---|---|---|
| `text-2xs` | 10px (0.625rem) | 14px | 500 / 600 | +0.02em | Tiny SKU badges, status pill labels |
| `text-xs` | 12px (0.75rem) | 16px | 400 / 500 | 0 | Table body text, input labels, metadata |
| `text-sm` | 14px (0.875rem) | 20px | 400 / 500 | 0 | Default body, button labels, dropdown items |
| `text-base` | 16px (1.0rem) | 24px | 500 / 600 | -0.01em | Card headers, table numeric totals |
| `text-lg` | 18px (1.125rem) | 28px | 600 | -0.015em | Modal titles, section headers |
| `text-xl` | 20px (1.25rem) | 28px | 600 / 700 | -0.02em | Page headers, KPI metric titles |
| `text-2xl` | 24px (1.5rem) | 32px | 700 | -0.025em | POS Grand Total, Main Dashboard KPIs |
| `text-3xl` | 30px (1.875rem) | 36px | 800 | -0.03em | Cashier Change Due Display |

### Font Feature Settings
```css
.tabular-numbers {
  font-feature-settings: "tnum" 1, "cv05" 1;
  font-variant-numeric: tabular-nums;
}
```

---

## 4. Spacing, Elevation & Radii Scales

### 4.1 Spacing Scale (4px Base Grid)
- `space-1`: 4px — Micro margins, badge paddings
- `space-2`: 8px — Form field gap, icon-to-label gap
- `space-3`: 12px — Button padding vertical, card internal padding compact
- `space-4`: 16px — Standard component padding, table cell padding
- `space-5`: 20px — Modal padding, section separation
- `space-6`: 24px — Container padding desktop
- `space-8`: 32px — Major layout panel separation
- `space-12`: 48px — Page-level vertical rhythms

### 4.2 Corner Radii
- `rounded-sm`: 4px — Badges, small inputs, tags
- `rounded-md`: 6px — Buttons, standard form inputs, dropdown menus
- `rounded-lg`: 8px — Cards, popovers, table containers
- `rounded-xl`: 12px — Modals, drawer dialogs, payment panels
- `rounded-full`: 9999px — Avatars, status dots, circular icon buttons

### 4.3 Elevation & Shadows
- `shadow-xs`: `0 1px 2px 0 rgb(0 0 0 / 0.05)` — Table rows, subtle button outlines
- `shadow-sm`: `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)` — Cards, search inputs
- `shadow-md`: `0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)` — Dropdowns, popovers
- `shadow-lg`: `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.05)` — Slide-over drawers, modals
- `shadow-focus`: `0 0 0 2px #FFFFFF, 0 0 0 4px #2563EB` — Keyboard focus ring

---

## 5. Core Component Specifications

---

### 5.1 Buttons & Interactive Controls
Standardized into five strict semantic variants with defined sizing:

```tsx
// Variant Styles
- Primary:     bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm
- Secondary:   bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs
- Destructive: bg-destructive text-white hover:bg-destructive/90 shadow-sm
- Ghost:       text-slate-600 hover:text-slate-900 hover:bg-slate-100
- Outline:     border border-slate-300 text-slate-700 hover:bg-slate-50

// Size Scale
- sm: h-8  px-2.5 text-xs rounded-md gap-1.5  (Table row actions)
- md: h-9  px-3.5 text-sm rounded-md gap-2    (Standard forms & headers)
- lg: h-11 px-5   text-sm rounded-lg gap-2.5  (Primary call-to-actions)
- pos: h-14 px-6  text-base font-bold rounded-xl gap-3 (Cashier billing triggers, min 44px)
```

---

### 5.2 Form Inputs & Text Fields
- **Container**: Flex column with `gap-1.5`.
- **Label**: `text-xs font-medium text-slate-700 select-none`.
- **Input Surface**: `h-9 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all`.
- **Helper Text**: `text-[11px] text-slate-500`.
- **Error State**: `border-destructive text-destructive focus:border-destructive focus:ring-destructive/20`.
- **Error Message**: Rendered directly below the input with a 12px alert icon.

---

### 5.3 Data Tables
All backoffice views (Products, Stock, Suppliers, Khata, GST) standardize on a unified table blueprint:
- **Surface**: White background card with single external border `border-slate-200 rounded-lg overflow-hidden shadow-xs`.
- **Header Row**: `h-10 bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-xs tracking-wider uppercase`.
- **Header Alignment**: Left-aligned for text/names; Right-aligned for prices, quantities, taxes, and margins.
- **Data Rows**: `h-12 border-b border-slate-100 hover:bg-slate-50/80 transition-colors text-xs text-slate-700`.
- **Numbers & Currency**: Strict `font-mono tabular-nums text-right text-slate-900 font-semibold`.
- **Row Actions**: Consolidated into a single secondary button or an icon menu (`MoreVertical` icon). Zero 5-button sprawl!
- **Footer**: `h-12 px-4 flex items-center justify-between border-t border-slate-200 bg-white text-xs text-slate-500` with pagination controls.

---

### 5.4 Badges & Status Indicators
Replaces saturated colored pills with accessible muted tones:
```tsx
// Success (Active, Paid, In-Stock)
bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-medium text-2xs px-2 py-0.5 rounded-full

// Warning (Low Stock, Partially Received, Near Limit)
bg-amber-50 text-amber-800 border border-amber-200/60 font-medium text-2xs px-2 py-0.5 rounded-full

// Destructive (Out of Stock, Overdue, Cancelled)
bg-rose-50 text-rose-700 border border-rose-200/60 font-medium text-2xs px-2 py-0.5 rounded-full

// Neutral / Draft (Draft PO, Unregistered)
bg-slate-100 text-slate-600 border border-slate-200 font-medium text-2xs px-2 py-0.5 rounded-full
```

---

### 5.5 Modals vs Slide-Over Drawers

| Component | Usage Rule | Dimensions | Interaction |
|---|---|---|---|
| **Slide-over Drawer** | Complex flows requiring context: Cart checkout, New Product Entry, Customer Dossier, Return Inspector | Width: 480px – 560px, Right-docked, 100vh | Slides smoothly from right (200ms ease-out). Background dims slightly (`bg-black/30`). Esc or backdrop click dismisses. |
| **Centered Dialog** | Quick confirmations & single-purpose forms: Record Repayment, Stock Adjustment, Change Limit | Max width: 420px – 500px, Vertically centered | Enters with 100ms scale fade. Clear header, structured body, fixed footer actions (`Cancel` + `Confirm`). |

---

### 5.6 Loading Skeletons & Empty States
- **Loading Skeletons**: Replaces the full-screen blocking spinner with layout-preserving pulse blocks (`bg-slate-200/70 animate-pulse rounded`).
  - Table Skeleton: 5 rows of alternating pill widths.
  - POS Grid Skeleton: 8 rounded cards with price/title placeholders.
- **Empty States**: Every view includes an empty state component:
  - 40px muted SVG icon (`PackageOpen`, `Receipt`, `Users`, `FileSpreadsheet`).
  - Heading in `text-sm font-semibold text-slate-800`.
  - Secondary description in `text-xs text-slate-500 max-w-sm text-center`.
  - Single primary action button (e.g. `Add Your First Product`).

---

## 6. Iconography System: Lucide Integration Mapping

All Unicode emojis across the codebase are mapped to corresponding `lucide-react` icons:

| Current Emoji | Feature Area | Recommended Lucide Icon | Stroke |
|---|---|---|---|
| `⚡` | Brand Mark / Logo | `Zap` or custom Store SVG | 2.0px |
| `🛒` | POS Terminal / Bill Items | `ShoppingCart` | 1.5px |
| `🏢` | Tenant / Store Management | `Store` / `Building2` | 1.5px |
| `👑` | Store Owner Role | `ShieldCheck` / `Crown` | 1.5px |
| `📦` | Inventory / Stock / Products | `Package` | 1.5px |
| `🚚` | Suppliers / Vendors | `Truck` | 1.5px |
| `📑` | GST Reports / Returns | `FileText` / `FileSpreadsheet`| 1.5px |
| `📒` | Customer Khata / Ledger | `BookOpen` / `WalletCards` | 1.5px |
| `💵` | Cash Payment / Repayment | `Banknote` | 1.5px |
| `📱` | UPI Tender / POS Devices | `QrCode` / `Smartphone` | 1.5px |
| `💳` | Card Tender | `CreditCard` | 1.5px |
| `⏱️` | Shifts / Timing | `Clock` | 1.5px |
| `✏️` | Edit Action | `Pencil` | 1.5px |
| `🗑️` | Delete / Archive | `Trash2` | 1.5px |
| `➕` | Add / Create Action | `Plus` | 2.0px |
| `🔄` | Refresh / Sync | `RefreshCw` | 1.5px |
| `🔀` | Customer Merge | `GitMerge` / `Merge` | 1.5px |
| `🛍️` | Lifetime History Dossier | `History` / `Receipt` | 1.5px |
| `🚪` | Logout | `LogOut` | 1.5px |
| `🔒` | Locked Scope / Branch | `Lock` | 1.5px |

---

## 7. Canonical Shadcn/UI Component Inventory & Architecture

To eliminate the "dated, AI-generated, intimidating" feel, the platform standardizes entirely on **Shadcn/UI** (New York style, Slate base color). Every raw HTML input, homebrewed modal, and custom div is mapped directly to a polished, battle-tested Shadcn/Radix primitive.

### 7.1 Canonical `components.json` Configuration
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### 7.2 Shadcn/UI Component Mapping & Replacement Inventory

| Current Hand-rolled / Dated Element | Target Shadcn/UI Component | Visual & Usability Transformation |
|---|---|---|
| **Centered Checkout Dialog** (`checkout-modal`) | **`Sheet`** (Slide-over Drawer from Right) | Replaces disruptive blocking modal with a sleek 480px right-docked drawer that preserves catalog context, shows live bill summary, and provides 1-tap cash denominations. |
| **Monolithic Top Bar & Binary Switcher** (`tenant-branch-selector.tsx`) | **`Sidebar`** + **`SidebarHeader`** + **`SidebarMenu`** + **`SidebarRail`** | Replaces horizontal emoji bar with modern collapsible left sidebar (Linear/Shopify Admin style) featuring tooltips, grouped sections, and smooth rail collapse. |
| **Native `<select>` Dropdowns** (Branch/Tenant/Category) | **`Select`** + **`SelectContent`** + **`SelectItem`** | Replaces ugly browser-default OS dropdowns with polished, keyboard-accessible popovers with checkmark indicators. |
| **Customer / Barcode Search Input** | **`Command`** + **`CommandInput`** + **`CommandList`** (`cmdk`) | Upgrades sluggish inputs to instant fuzzy-search palette (`⌘K`), showing instant customer suggestions with phone numbers and balances. |
| **Dense Backoffice Tables** (`products`, `customers`, `shifts`) | **`Table`** + **`TableHeader`** + **`TableBody`** + **`TableRow`** + **`TableCell`** | Replaces unstyled HTML tables with clean, hover-highlighted rows, sticky headers, subtle dividers, and monospace tabular numbers. |
| **5 Emoji Buttons in Customer Rows** | **`DropdownMenu`** + **`DropdownMenuTrigger`** (`MoreHorizontal`) | Collapses messy icon sprawl into a single clean "•••" menu (`View Statement`, `Lifetime Dossier`, `Adjust Limit`, `Merge`). |
| **Dense 14-Field Product Modal** | **`Sheet`** or **`Dialog`** with **`Tabs`** & **`Form`** | Structures product entry into 3 progressive tabs (`Basic Info`, `Pricing & GST`, `Inventory & Stock`) using `react-hook-form` + `zod`. |
| **Confirm Archive / Delete Alerts** | **`AlertDialog`** + **`AlertDialogAction`** | Replaces dangerous `window.confirm()` and raw divs with accessible focus-trapped confirmation dialogs for destructive actions. |
| **Screen-wide Red / Green Error Banners** | **`Sonner`** (Toasts) + **`Alert`** | Replaces jarring top-of-screen banners with elegant, non-blocking floating toast notifications (`Sale posted: INV-0012`, `Payment recorded: ₹850`). |
| **Full-Screen Spinning Spinner** | **`Skeleton`** (Pulse placeholders) | Replaces blocking spinners with shimmering card/table skeletons matching the exact final layout, delivering instant perceived performance. |
| **Role & Status Indicators** | **`Badge`** (`variant="outline"`, `"secondary"`, `"destructive"`) | Replaces saturated high-contrast pills with subtle, accessible, muted status badges. |
| **Category Filters & Tender Triggers** | **`ToggleGroup`** & **`Button`** (`size="lg"`, `"icon"`) | Delivers touch-optimized 44px+ buttons with clear active states and seamless keyboard shortcut tooltips. |
| **User Profile & Logout** | **`Avatar`** + **`DropdownMenu`** | Replaces static header text with a clean user avatar menu with email, role badge, switch tenant, and sign out. |


