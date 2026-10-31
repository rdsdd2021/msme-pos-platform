export enum BusinessType {
  GROCERY = 'grocery',
  PHARMACY = 'pharmacy',
  APPAREL = 'apparel',
  ELECTRONICS = 'electronics',
  RESTAURANT = 'restaurant',
  WHOLESALE = 'wholesale',
  OTHER = 'other',
}

export enum TenantStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CLOSED = 'closed',
}

export enum MembershipStatus {
  ACTIVE = 'active',
  INVITED = 'invited',
  SUSPENDED = 'suspended',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum Platform {
  ANDROID = 'android',
  WEB = 'web',
  WINDOWS = 'windows',
}

export enum DeviceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  REVOKED = 'revoked',
}

export enum Currency {
  INR = 'INR',
}

export enum RoleScope {
  TENANT = 'tenant',
  BRANCH = 'branch',
}

export enum ProductType {
  STOCK = 'stock',
  SERVICE = 'service',
  COMPOSITE = 'composite',
}

export enum StockMovementType {
  OPENING = 'opening',
  PURCHASE = 'purchase',
  SALE = 'sale',
  SALE_RETURN = 'sale_return',
  PURCHASE_RETURN = 'purchase_return',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
  ADJUSTMENT = 'adjustment',
  DAMAGE = 'damage',
  EXPIRY = 'expiry',
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  POSTED = 'posted',
  RETURNED = 'returned',
  VOIDED = 'voided',
}

export enum PaymentStatus {
  PAID = 'paid',
  PARTIAL = 'partial',
  UNPAID = 'unpaid',
}

export enum PaymentMethod {
  CASH = 'cash',
  UPI = 'upi',
  CARD = 'card',
  CREDIT = 'credit',
}

export enum CustomerLedgerEntryType {
  INVOICE_DEBIT = 'invoice_debit',
  PAYMENT_CREDIT = 'payment_credit',
  ADJUSTMENT = 'adjustment',
  REFUND = 'refund',
}

export enum ShiftStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

export enum SubscriptionPlanCode {
  BASIC_KIRANA = 'basic_kirana',
  PRO_RETAIL = 'pro_retail',
  ENTERPRISE = 'enterprise',
}

export enum SubscriptionStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELLED = 'cancelled',
}
