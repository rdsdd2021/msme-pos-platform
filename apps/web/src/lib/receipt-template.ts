'use client';

export interface ReceiptDesignConfig {
  // Store / Header Info
  businessName: string;
  tagline: string;
  branchName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateCode: string;
  postalCode: string;
  phone: string;
  email?: string;
  gstin: string;
  fssaiNumber: string;

  // Paper & Typography
  paperWidth: 58 | 80; // mm
  fontFamily: 'monospace' | 'sans-serif';
  headerAlignment: 'center' | 'left';

  // Item & Line Formatting
  showHsnCode: boolean;
  showItemSku: boolean;
  showPackageSize: boolean;
  showItemDiscount: boolean;
  compactLines: boolean;

  // Tax & Metadata Details
  showGstSummary: boolean;
  showCashierName: boolean;
  showCustomerDetails: boolean;
  showCustomerKhataBalance: boolean;
  showSavingsBanner: boolean;

  // Footer & Payment Details
  showUpiQr: boolean;
  upiId: string;
  termsAndConditions: string;
  thankYouMessage: string;
  showBranding: boolean;
}

export const DEFAULT_RECEIPT_CONFIG: ReceiptDesignConfig = {
  businessName: 'Kirana Supermart',
  tagline: 'Quality Groceries & Daily Needs',
  branchName: 'Main Store - Andheri West',
  addressLine1: 'Shop No. 4, Market Complex',
  addressLine2: 'S.V. Road, Andheri West',
  city: 'Mumbai',
  stateCode: '27',
  postalCode: '400058',
  phone: '+91 98765 43210',
  email: 'support@kiranasupermart.in',
  gstin: '27AABCU9603R1ZM',
  fssaiNumber: '11521000000000',

  paperWidth: 58,
  fontFamily: 'monospace',
  headerAlignment: 'center',

  showHsnCode: true,
  showItemSku: false,
  showPackageSize: true,
  showItemDiscount: true,
  compactLines: false,

  showGstSummary: true,
  showCashierName: true,
  showCustomerDetails: true,
  showCustomerKhataBalance: true,
  showSavingsBanner: true,

  showUpiQr: true,
  upiId: 'kirana.supermart@okicici',
  termsAndConditions: 'Goods once sold can be exchanged within 24 hours with original bill.',
  thankYouMessage: 'Thank you for shopping with us! Please visit again.',
  showBranding: true,
};

const STORAGE_PREFIX = 'msme_pos_receipt_config_';

export function getReceiptConfig(tenantId?: string, branchId?: string): ReceiptDesignConfig {
  if (typeof window === 'undefined') return DEFAULT_RECEIPT_CONFIG;
  try {
    const key = `${STORAGE_PREFIX}${tenantId || 'default'}_${branchId || 'default'}`;
    const raw = localStorage.getItem(key);
    if (!raw) return DEFAULT_RECEIPT_CONFIG;
    return { ...DEFAULT_RECEIPT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_RECEIPT_CONFIG;
  }
}

export function saveReceiptConfig(
  config: ReceiptDesignConfig,
  tenantId?: string,
  branchId?: string
): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `${STORAGE_PREFIX}${tenantId || 'default'}_${branchId || 'default'}`;
    localStorage.setItem(key, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save receipt template configuration', err);
  }
}

