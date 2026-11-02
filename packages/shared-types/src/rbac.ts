/**
 * Canonical Business Roles for Indian MSME Retail
 */
export enum Role {
  OWNER = 'owner',
  BRANCH_MANAGER = 'branch_manager',
  CASHIER = 'cashier',
  INVENTORY_STAFF = 'inventory_staff',
  ACCOUNTANT = 'accountant',
}

/**
 * Granular Permission Keys as defined in docs/14-ROLE-PERMISSION-MATRIX.md
 */
export enum Permission {
  // Tenancy & Organization
  TENANT_READ = 'tenant:read',
  TENANT_UPDATE = 'tenant:update',
  TENANT_MEMBERS_MANAGE = 'tenant:members:manage',
  BRANCH_CREATE = 'branch:create',
  BRANCH_UPDATE = 'branch:update',

  // Catalog & Pricing
  CATALOG_READ = 'catalog:read',
  CATALOG_CREATE = 'catalog:create',
  CATALOG_UPDATE = 'catalog:update',
  CATALOG_DELETE = 'catalog:delete',

  // Inventory & Stock
  STOCK_READ = 'stock:read',
  STOCK_MOVEMENT_RECORD = 'stock:movement:record',
  STOCK_ADJUSTMENT_MANUAL = 'stock:adjustment:manual',
  STOCK_TRANSFER = 'stock:transfer',

  // Billing & Invoicing
  BILLING_POS_CREATE = 'billing:pos:create',
  BILLING_INVOICE_READ = 'billing:invoice:read',
  BILLING_INVOICE_RETURN = 'billing:invoice:return',
  BILLING_PRICE_OVERRIDE = 'billing:price:override',

  // Shifts & Cash Drawer
  SHIFT_OPEN = 'shift:open',
  SHIFT_CLOSE_SELF = 'shift:close:self',
  SHIFT_CLOSE_OVERRIDE = 'shift:close:override',
  SHIFT_REPORT_READ = 'shift:report:read',

  // Customer Khata
  KHATA_READ = 'khata:read',
  KHATA_CREATE = 'khata:create',
  KHATA_TRANSACT = 'khata:transact',
  KHATA_PAYMENT_RECORD = 'khata:payment:record',
  KHATA_LIMIT_MANAGE = 'khata:limit:manage',

  // Reports & GST
  REPORTS_DAILY_READ = 'reports:daily:read',
  REPORTS_FINANCIAL_READ = 'reports:financial:read',
  REPORTS_GST_EXPORT = 'reports:gst:export',

  // Devices & Commercial
  DEVICE_MANAGE = 'device:manage',
  SUBSCRIPTION_MANAGE = 'subscription:manage',
  HARDWARE_PRINT = 'hardware:print',
}

/**
 * Static Role-to-Permissions Mapping Table
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  [Role.OWNER]: Object.values(Permission),

  [Role.BRANCH_MANAGER]: [
    Permission.TENANT_READ,
    Permission.BRANCH_UPDATE,
    Permission.CATALOG_READ,
    Permission.CATALOG_CREATE,
    Permission.CATALOG_UPDATE,
    Permission.STOCK_READ,
    Permission.STOCK_MOVEMENT_RECORD,
    Permission.STOCK_ADJUSTMENT_MANUAL,
    Permission.STOCK_TRANSFER,
    Permission.BILLING_POS_CREATE,
    Permission.BILLING_INVOICE_READ,
    Permission.BILLING_INVOICE_RETURN,
    Permission.BILLING_PRICE_OVERRIDE,
    Permission.SHIFT_OPEN,
    Permission.SHIFT_CLOSE_SELF,
    Permission.SHIFT_CLOSE_OVERRIDE,
    Permission.SHIFT_REPORT_READ,
    Permission.KHATA_READ,
    Permission.KHATA_CREATE,
    Permission.KHATA_TRANSACT,
    Permission.KHATA_PAYMENT_RECORD,
    Permission.KHATA_LIMIT_MANAGE,
    Permission.REPORTS_DAILY_READ,
    Permission.DEVICE_MANAGE,
    Permission.HARDWARE_PRINT,
  ],

  [Role.CASHIER]: [
    Permission.TENANT_READ,
    Permission.CATALOG_READ,
    Permission.STOCK_READ,
    Permission.BILLING_POS_CREATE,
    Permission.BILLING_INVOICE_READ,
    Permission.SHIFT_OPEN,
    Permission.SHIFT_CLOSE_SELF,
    Permission.KHATA_READ,
    Permission.KHATA_CREATE,
    Permission.KHATA_TRANSACT,
    Permission.KHATA_PAYMENT_RECORD,
    Permission.HARDWARE_PRINT,
  ],

  [Role.INVENTORY_STAFF]: [
    Permission.TENANT_READ,
    Permission.CATALOG_READ,
    Permission.CATALOG_CREATE,
    Permission.STOCK_READ,
    Permission.STOCK_MOVEMENT_RECORD,
    Permission.STOCK_TRANSFER,
    Permission.HARDWARE_PRINT,
  ],

  [Role.ACCOUNTANT]: [
    Permission.TENANT_READ,
    Permission.CATALOG_READ,
    Permission.STOCK_READ,
    Permission.BILLING_INVOICE_READ,
    Permission.SHIFT_REPORT_READ,
    Permission.KHATA_READ,
    Permission.KHATA_PAYMENT_RECORD,
    Permission.REPORTS_DAILY_READ,
    Permission.REPORTS_FINANCIAL_READ,
    Permission.REPORTS_GST_EXPORT,
    Permission.HARDWARE_PRINT,
  ],
};

/**
 * Computes the unique union of permissions granted to a list of roles.
 */
export function getPermissionsForRoles(roles: (Role | string)[]): Permission[] {
  const permissionsSet = new Set<Permission>();
  for (const r of roles) {
    const roleKey = r as Role;
    const perms = ROLE_PERMISSIONS[roleKey];
    if (perms) {
      for (const p of perms) {
        permissionsSet.add(p);
      }
    }
  }
  return Array.from(permissionsSet);
}

/**
 * Resolved Tenant & Role Authorization Context attached to HTTP Requests
 */
export interface TenantContext {
  tenantId: string;
  userId: string;
  branchId: string | null;
  membershipBranchId: string | null;
  role: string;
  roles: Role[];
  permissions: Permission[];
  isOwner: boolean;
}

