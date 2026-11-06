import { Role, AppModule, BusinessType, DEFAULT_MODULES_BY_BUSINESS } from '@pos/shared-types';
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
  UtensilsCrossed,
  ChefHat,
  Sliders,
  LucideIcon,
} from 'lucide-react';

export interface NavItem {
  id: string;
  title: string;
  icon: LucideIcon;
  target: 'pos' | 'admin' | 'restaurant' | 'kds';
  adminTab?: 'analytics' | 'inventory' | 'khata' | 'shifts' | 'devices' | 'subscription' | 'gst' | 'branches' | 'invoices' | 'settings';
  adminSubTab?: 'products' | 'stock' | 'suppliers' | 'purchases' | 'categories' | 'transfers';
  allowedRoles: Role[];
  requiredModule?: string;
  badge?: string;
  testId?: string;
}

export interface NavSection {
  title: string;
  requiredModule?: string;
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
        requiredModule: AppModule.POS,
        allowedRoles: [Role.OWNER, Role.BRANCH_MANAGER, Role.CASHIER],
        badge: 'Live',
        testId: 'nav-pos-terminal',
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
    title: 'Restaurant & Dining',
    requiredModule: AppModule.RESTAURANT,
    items: [
      {
        id: 'restaurant-floorplan',
        title: 'Floorplan & Tables',
        icon: UtensilsCrossed,
        target: 'restaurant',
        requiredModule: AppModule.RESTAURANT,
        allowedRoles: [Role.OWNER, Role.BRANCH_MANAGER, Role.CASHIER],
        badge: 'Dine-In',
        testId: 'nav-restaurant-floorplan',
      },
      {
        id: 'kitchen-display',
        title: 'Kitchen Display (KDS)',
        icon: ChefHat,
        target: 'kds',
        requiredModule: AppModule.RESTAURANT,
        allowedRoles: [Role.OWNER, Role.BRANCH_MANAGER, Role.CASHIER],
        badge: 'KOT',
        testId: 'nav-kitchen-display',
      },
    ],
  },
  {
    title: 'Catalogue & Stock',
    requiredModule: AppModule.INVENTORY,
    items: [
      {
        id: 'inventory-hub',
        title: 'Products & Inventory',
        icon: Package,
        target: 'admin',
        adminTab: 'inventory',
        adminSubTab: 'products',
        requiredModule: AppModule.INVENTORY,
        allowedRoles: [Role.OWNER, Role.BRANCH_MANAGER, Role.INVENTORY_STAFF],
        testId: 'admin-tab-inventory',
      },
    ],
  },
  {
    title: 'Customers & Finance',
    items: [
      {
        id: 'invoices',
        title: 'Bills & Invoices',
        icon: Receipt,
        target: 'admin',
        adminTab: 'invoices',
        requiredModule: AppModule.INVOICES,
        allowedRoles: [Role.OWNER, Role.BRANCH_MANAGER, Role.CASHIER, Role.ACCOUNTANT],
        testId: 'nav-invoices',
      },
      {
        id: 'customer-khata',
        title: 'Customer Khata',
        icon: Users,
        target: 'admin',
        adminTab: 'khata',
        requiredModule: AppModule.KHATA,
        allowedRoles: [Role.OWNER, Role.BRANCH_MANAGER, Role.ACCOUNTANT],
        testId: 'admin-tab-customers',
      },
      {
        id: 'gst-reports',
        title: 'GST Reports & Returns',
        icon: FileSpreadsheet,
        target: 'admin',
        adminTab: 'gst',
        requiredModule: AppModule.GST,
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
        requiredModule: AppModule.SHIFTS,
        allowedRoles: [Role.OWNER, Role.BRANCH_MANAGER, Role.ACCOUNTANT],
        testId: 'nav-shifts',
      },
    ],
  },
  {
    title: 'Store Administration',
    items: [
      {
        id: 'settings',
        title: 'Settings Hub',
        icon: Sliders,
        target: 'admin',
        adminTab: 'settings',
        allowedRoles: [Role.OWNER, Role.BRANCH_MANAGER],
        testId: 'nav-settings',
      },
    ],
  },
];

export function filterNavForUser(
  roles: Role[],
  enabledModules?: string[],
  businessType?: BusinessType | string,
): NavSection[] {
  const isOwner = roles.includes(Role.OWNER);

  const activeModules: string[] = enabledModules && enabledModules.length > 0
    ? enabledModules
    : (businessType && (DEFAULT_MODULES_BY_BUSINESS as any)[businessType])
      ? (DEFAULT_MODULES_BY_BUSINESS as any)[businessType]
      : (DEFAULT_MODULES_BY_BUSINESS as any)[BusinessType.GROCERY];

  return navigationConfig
    .filter((section) => !section.requiredModule || activeModules.includes(section.requiredModule))
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const hasRole = isOwner || item.allowedRoles.some((r) => roles.includes(r));
        const hasModule = !item.requiredModule || activeModules.includes(item.requiredModule);
        return hasRole && hasModule;
      }),
    }))
    .filter((section) => section.items.length > 0);
}

