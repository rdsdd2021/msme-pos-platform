import { Role } from '@pos/shared-types';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Truck,
  Users,
  FileSpreadsheet,
  Clock,
  Store,
  Smartphone,
  CreditCard,
  Receipt,
  LucideIcon,
} from 'lucide-react';

export interface NavItem {
  id: string;
  title: string;
  icon: LucideIcon;
  target: 'pos' | 'admin';
  adminTab?: 'analytics' | 'inventory' | 'khata' | 'shifts' | 'devices' | 'subscription' | 'gst' | 'branches' | 'invoices';
  adminSubTab?: 'products' | 'stock' | 'suppliers' | 'purchases' | 'categories' | 'transfers';
  allowedRoles: Role[];
  badge?: string;
  testId?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navigationConfig: NavSection[] = [
  {
    title: 'Core Operations',
    items: [
      {
        id: 'pos-terminal',
        title: 'POS Terminal',
        icon: ShoppingCart,
        target: 'pos',
        allowedRoles: [Role.OWNER, Role.BRANCH_MANAGER, Role.CASHIER],
        badge: 'Live',
        testId: 'nav-pos-terminal',
      },
      {
        id: 'invoices',
        title: 'Bills & Invoices',
        icon: Receipt,
        target: 'admin',
        adminTab: 'invoices',
        allowedRoles: [Role.OWNER, Role.BRANCH_MANAGER, Role.CASHIER, Role.ACCOUNTANT],
        testId: 'nav-invoices',
      },
      {
        id: 'analytics',
        title: 'Executive Analytics',
        icon: LayoutDashboard,
        target: 'admin',
        adminTab: 'analytics',
        allowedRoles: [Role.OWNER, Role.BRANCH_MANAGER],
        testId: 'nav-analytics',
      },
    ],
  },
  {
    title: 'Catalogue & Stock',
    items: [
      {
        id: 'products',
        title: 'Products & SKUs',
        icon: Package,
        target: 'admin',
        adminTab: 'inventory',
        adminSubTab: 'products',
        allowedRoles: [Role.OWNER, Role.BRANCH_MANAGER, Role.INVENTORY_STAFF],
        testId: 'nav-products',
      },
      {
        id: 'stock-balances',
        title: 'Stock Balances',
        icon: Boxes,
        target: 'admin',
        adminTab: 'inventory',
        adminSubTab: 'stock',
        allowedRoles: [Role.OWNER, Role.BRANCH_MANAGER, Role.INVENTORY_STAFF],
        testId: 'nav-stock-balances',
      },
      {
        id: 'purchasing',
        title: 'Suppliers & Purchases',
        icon: Truck,
        target: 'admin',
        adminTab: 'inventory',
        adminSubTab: 'purchases',
        allowedRoles: [Role.OWNER, Role.BRANCH_MANAGER, Role.INVENTORY_STAFF],
        testId: 'nav-purchasing',
      },
    ],
  },
  {
    title: 'Customers & Finance',
    items: [
      {
        id: 'customer-khata',
        title: 'Customer Khata',
        icon: Users,
        target: 'admin',
        adminTab: 'khata',
        allowedRoles: [Role.OWNER, Role.BRANCH_MANAGER, Role.ACCOUNTANT],
        testId: 'nav-khata',
      },
      {
        id: 'gst-reports',
        title: 'GST Reports & Returns',
        icon: FileSpreadsheet,
        target: 'admin',
        adminTab: 'gst',
        allowedRoles: [Role.OWNER, Role.BRANCH_MANAGER, Role.ACCOUNTANT],
        badge: 'GSTR-1/3B',
        testId: 'nav-gst',
      },
      {
        id: 'shifts',
        title: 'Cashier Shifts',
        icon: Clock,
        target: 'admin',
        adminTab: 'shifts',
        allowedRoles: [Role.OWNER, Role.BRANCH_MANAGER, Role.ACCOUNTANT],
        testId: 'nav-shifts',
      },
    ],
  },
  {
    title: 'Store Administration',
    items: [
      {
        id: 'branches',
        title: 'Branches & GSTIN',
        icon: Store,
        target: 'admin',
        adminTab: 'branches',
        allowedRoles: [Role.OWNER],
        testId: 'nav-branches',
      },
      {
        id: 'devices',
        title: 'POS Devices',
        icon: Smartphone,
        target: 'admin',
        adminTab: 'devices',
        allowedRoles: [Role.OWNER, Role.BRANCH_MANAGER],
        testId: 'nav-devices',
      },
      {
        id: 'subscription',
        title: 'Subscription & Billing',
        icon: CreditCard,
        target: 'admin',
        adminTab: 'subscription',
        allowedRoles: [Role.OWNER],
        testId: 'nav-subscription',
      },
    ],
  },
];

export function filterNavForUser(roles: Role[]): NavSection[] {
  const isOwner = roles.includes(Role.OWNER);

  return navigationConfig
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (isOwner) return true;
        return item.allowedRoles.some((r) => roles.includes(r));
      }),
    }))
    .filter((section) => section.items.length > 0);
}

