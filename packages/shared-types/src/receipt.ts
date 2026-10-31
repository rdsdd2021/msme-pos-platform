/**
 * Semantic receipt document representation.
 * Hardware drivers take this structured document and render it to device-specific
 * byte commands (e.g. ESC/POS, raster, or print bridge payload).
 */
export interface ReceiptLineItem {
  name: string;
  quantity: string;
  rate: string;
  taxPercent: string;
  total: string;
}

export interface ReceiptTaxSummary {
  cgst: string;
  sgst: string;
  igst: string;
  totalTax: string;
}

export interface ReceiptPaymentBreakdown {
  method: string;
  amount: string;
  reference?: string;
}

export interface ReceiptDocument {
  header: {
    businessName: string;
    branchName: string;
    addressLine?: string;
    gstin?: string;
    phone?: string;
  };
  invoice: {
    invoiceNumber: string;
    dateTime: string;
    cashierName?: string;
  };
  items: ReceiptLineItem[];
  totals: {
    subtotal: string;
    discountTotal: string;
    taxableTotal: string;
    tax: ReceiptTaxSummary;
    grandTotal: string;
    roundingAdjustment?: string;
  };
  payments: ReceiptPaymentBreakdown[];
  footer?: {
    thankYouMessage?: string;
    fssaiLicense?: string;
  };
}

export enum PaperWidth {
  MM_58 = 58,
  MM_80 = 80,
}

export interface PrinterDeviceProfile {
  model: string;
  paperWidth: PaperWidth;
  columnsPerLine: number;
  supportsCashDrawerKick: boolean;
  supportsCut: boolean;
}

