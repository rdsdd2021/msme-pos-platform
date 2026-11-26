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
  businessName: '',
  tagline: '',
  branchName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  stateCode: '',
  postalCode: '',
  phone: '',
  email: '',
  gstin: '',
  fssaiNumber: '',

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
  showSavingsBanner: false,

  showUpiQr: false,
  upiId: '',
  termsAndConditions: '',
  thankYouMessage: 'Thank You! Visit Again!',
  showBranding: false,
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

