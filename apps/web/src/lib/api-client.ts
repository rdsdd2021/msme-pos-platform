import {
  Role,
  Permission,
  PaymentMethod,
  StockMovementType,
  TableStatus,
  RestaurantOrderType,
  RestaurantOrderStatus,
  KotStatus,
  KitchenStation,
} from '@pos/shared-types';

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export class ApiError extends Error {
  statusCode: number;
  details?: string | string[];

  constructor(message: string, statusCode: number, details?: string | string[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  isSuperAdmin?: boolean;
}

export interface TenantMembershipInfo {
  tenantId: string;
  tenantName: string;
  businessType?: string;
  enabledModules?: string[];
  branchId: string | null;
  role: string;
  roles: Role[];
  status: string;
  permissions: Permission[];
  isOwner: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  isSuperAdmin?: boolean;
  memberships: TenantMembershipInfo[];
}

export interface RegisterMerchantRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  storeName: string;
  businessType: string;
  stateCode: string;
  gstin?: string;
  city?: string;
  seedSampleCatalog?: boolean;
  enabledModules?: string[];
  allowNegativeStock?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: UserSummary;
}

export interface Branch {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  stateCode?: string | null;
  postalCode?: string | null;
  gstin?: string | null;
  isActive: boolean;
}

export interface Tenant {
  id: string;
  legalName: string;
  displayName: string;
  businessType: string;
  status: string;
  defaultCurrency: string;
  branches?: Branch[];
}

export interface Product {
  id: string;
  tenantId: string;
  sku: string;
  name: string;
  barcodePrimary: string | null;
  sellingPrice: string;
  purchaseCost: string;
  mrp: string;
  productType: string;
  trackInventory: boolean;
  isActive: boolean;
  categoryId: string | null;
  baseUnitId?: string | null;
  hsnCode?: string | null;
  gstRatePercent?: string;
  packageSize?: string | null;
  imageUrl?: string | null;
  currentStock?: string;
}

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface Unit {
  id: string;
  tenantId: string | null;
  name: string;
  symbol: string;
  decimalPlaces: number;
}

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  isActive: boolean;
}

export interface CreateSupplierRequest {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  gstin?: string;
}

export interface UpdateSupplierRequest {
  name?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  isActive?: boolean;
}

export interface PurchaseOrderLine {
  id: string;
  tenantId: string;
  purchaseOrderId: string;
  productId: string;
  quantityOrdered: string;
  quantityReceived: string;
  unitCost: string;
  taxRatePercent: string;
  lineTotal: string;
  product?: Product;
}

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  branchId: string;
  supplierId: string;
  orderNumber: string;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  expectedDeliveryDate: string | null;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  notes: string | null;
  createdAt: string;
  supplier?: Supplier;
  lines?: PurchaseOrderLine[];
}

export interface CreatePurchaseOrderRequest {
  branchId: string;
  supplierId: string;
  orderNumber?: string;
  expectedDeliveryDate?: string;
  notes?: string;
  lines: {
    productId: string;
    quantityOrdered: string;
    unitCost: string;
    taxRatePercent?: string;
  }[];
}

export interface ReceivePurchaseOrderRequest {
  items: {
    lineId: string;
    quantityReceived: string;
  }[];
  idempotencyKey?: string;
  notes?: string;
}

export interface CreateProductRequest {
  name: string;
  sku: string;
  barcodePrimary?: string;
  categoryId?: string;
  baseUnitId?: string;
  purchaseCost: string;
  sellingPrice: string;
  mrp: string;
  hsnCode?: string;
  gstRatePercent?: string;
  packageSize?: string;
  imageUrl?: string;
  productType?: string;
  trackInventory?: boolean;
  allowFractionalQuantity?: boolean;
  openingStockQuantity?: string;
  openingStockBranchId?: string;
}

export interface UpdateProductRequest {
  name?: string;
  sku?: string;
  barcodePrimary?: string;
  categoryId?: string;
  baseUnitId?: string;
  purchaseCost?: string;
  sellingPrice?: string;
  mrp?: string;
  hsnCode?: string;
  gstRatePercent?: string;
  packageSize?: string;
  imageUrl?: string;
  productType?: string;
  trackInventory?: boolean;
  allowFractionalQuantity?: boolean;
  isActive?: boolean;
}

export interface StockBalance {
  id: string;
  tenantId: string;
  branchId: string;
  productId: string;
  quantityOnHand: string;
  lowStockThreshold: string;
}

export interface StockTransferLine {
  id: string;
  tenantId: string;
  transferId: string;
  productId: string;
  quantityRequested: string;
  quantityDispatched: string;
  quantityReceived: string;
  unitCost: string;
  hasDiscrepancy: boolean;
  discrepancyQuantity: string;
  discrepancyReason?: string | null;
  notes?: string | null;
  product?: Product;
}

export interface StockTransfer {
  id: string;
  tenantId: string;
  transferNumber: string;
  sourceBranchId: string;
  destinationBranchId: string;
  status: 'draft' | 'dispatched' | 'in_transit' | 'received' | 'cancelled';
  dispatchedAt?: string | null;
  dispatchedBy?: string | null;
  receivedAt?: string | null;
  receivedBy?: string | null;
  totalItemsRequested: string;
  totalItemsDispatched: string;
  totalItemsReceived: string;
  hasDiscrepancy: boolean;
  discrepancyReason?: string | null;
  notes?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  sourceBranch?: Branch;
  destinationBranch?: Branch;
  lines?: StockTransferLine[];
}

export interface CreateStockTransferRequest {
  sourceBranchId: string;
  destinationBranchId: string;
  transferNumber?: string;
  notes?: string;
  autoDispatch?: boolean;
  lines: Array<{
    productId: string;
    quantityRequested: string;
    unitCost?: string;
    notes?: string;
  }>;
}

export interface DispatchStockTransferRequest {
  idempotencyKey?: string;
  notes?: string;
}

export interface ReceiveStockTransferRequest {
  items: Array<{
    lineId: string;
    quantityReceived: string;
    discrepancyReason?: string;
  }>;
  idempotencyKey?: string;
  notes?: string;
  discrepancyReason?: string;
}

export interface CancelStockTransferRequest {
  reason?: string;
}

export interface CartLineItemRequest {
  productId: string;
  quantity: string;
  discountAmount?: string;
  gstRatePercent: string;
}

export interface PaymentSplitRequest {
  paymentMethod: PaymentMethod;
  amount: string;
  externalReference?: string;
}

export interface CreateSaleRequest {
  branchId: string;
  idempotencyKey: string;
  isInterstate?: boolean;
  customerId?: string;
  items: CartLineItemRequest[];
  payments: PaymentSplitRequest[];
}

export interface InvoiceLine {
  id: string;
  productId: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  hsnSnapshot?: string | null;
  quantity: string;
  unitPrice: string;
  discountAmount: string;
  taxableValue: string;
  gstRatePercent: string;
  cgstAmount: string;
  sgstAmount: string;
  igstAmount: string;
  lineTotal: string;
}

export interface InvoicePayment {
  id: string;
  paymentMethod: string;
  amount: string;
  externalReference: string | null;
  receivedAt: string;
}

export interface CreditNoteLine {
  id: string;
  creditNoteId: string;
  originalInvoiceLineId?: string | null;
  productId: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  hsnSnapshot?: string | null;
  quantityReturned: string;
  resellableQuantity: string;
  damagedQuantity: string;
  unitPrice: string;
  taxableValue: string;
  gstRatePercent: string;
  cgstAmount: string;
  sgstAmount: string;
  igstAmount: string;
  lineTotal: string;
  returnReason?: string | null;
}

export interface CreditNote {
  id: string;
  tenantId: string;
  branchId: string;
  creditNoteNumber: string;
  idempotencyKey: string;
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  customerId?: string | null;
  customerGstinSnapshot?: string | null;
  placeOfSupply?: string | null;
  isInterstate: boolean;
  issuedByUserId: string;
  reason: string;
  subtotal: string;
  taxableTotal: string;
  cgstTotal: string;
  sgstTotal: string;
  igstTotal: string;
  grandTotal: string;
  roundingAdjustment: string;
  refundPaymentMethod: string;
  refundReference?: string | null;
  status: string;
  createdAt: string;
  lines: CreditNoteLine[];
  originalInvoice?: Invoice;
}

export interface CreateSalesReturnPayload {
  originalInvoiceId: string;
  idempotencyKey: string;
  reason: string;
  refundPaymentMethod: string;
  refundReference?: string;
  items: Array<{
    invoiceLineId: string;
    resellableQuantity: string;
    damagedQuantity: string;
    reason?: string;
  }>;
}

export interface Invoice {
  id: string;
  tenantId: string;
  branchId: string;
  invoiceNumber: string;
  idempotencyKey: string;
  status: string;
  customerId?: string | null;
  customerGstinSnapshot?: string | null;
  isInterstate?: boolean;
  subtotal: string;
  discountTotal: string;
  taxableTotal: string;
  cgstTotal: string;
  sgstTotal: string;
  igstTotal: string;
  grandTotal: string;
  roundingAdjustment: string;
  paymentStatus: string;
  postedAt: string;
  lines: InvoiceLine[];
  payments?: InvoicePayment[];
  creditNotes?: CreditNote[];
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone: string | null;
  email: string | null;
  gstin?: string | null;
  creditLimit: string;
  currentBalance: string;
  isActive: boolean;
}

export interface CreateCustomerRequest {
  name: string;
  phone?: string;
  email?: string;
  gstin?: string;
  creditLimit?: string;
  confirmDuplicate?: boolean;
}

export interface CustomerHistoryResponse {
  customer: Customer;
  lifetimeStats: {
    totalInvoicesCount: number;
    totalPurchasesValue: string;
    totalRepaymentsValue: string;
    currentOutstandingBalance: string;
    creditLimit: string;
  };
  invoices: {
    id: string;
    invoiceNumber: string;
    createdAt: string;
    grandTotal: string;
    status: string;
    paymentStatus: string;
  }[];
  ledgerEntries: {
    id: string;
    occurredAt: string;
    entryType: string;
    debit: string;
    credit: string;
    sourceType: string;
    sourceId: string;
    paymentMethod: string | null;
    notes: string | null;
  }[];
}

export interface UpdateBranchRequest {
  name?: string;
  gstin?: string;
  stateCode?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  isActive?: boolean;
}

export interface RecordCustomerPaymentRequest {
  branchId?: string;
  amount: string;
  paymentMethod?: string;
  idempotencyKey: string;
  notes?: string;
}

export interface CustomerStatementEntry {
  id: string;
  occurredAt: string;
  entryType: string;
  debit: string;
  credit: string;
  runningBalance: string;
  sourceType: string;
  sourceId: string | null;
  idempotencyKey: string | null;
  paymentMethod: string | null;
  branchId: string;
  createdBy: string | null;
  notes: string | null;
}

export interface CustomerStatementResponse {
  customer: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    creditLimit: string;
    currentBalance: string;
    availableCredit: string;
    creditUtilizationPercent: number;
    creditStatus: 'healthy' | 'near_limit' | 'exceeded' | 'no_credit';
    ageing: {
      current: string;
      days31To60: string;
      days61To90: string;
      over90Days: string;
    };
  };
  statement: {
    from: string | null;
    to: string | null;
    branchId: string | null;
    openingBalance: string;
    closingBalance: string;
    totalDebits: string;
    totalCredits: string;
    entries: CustomerStatementEntry[];
  };
}

export interface UpdateCustomerCreditLimitRequest {
  creditLimit: string;
  reason?: string;
}

export interface CustomerAdjustmentRequest {
  branchId: string;
  type: 'debit' | 'credit';
  amount: string;
  reason: string;
  idempotencyKey: string;
}

export interface CustomerPaymentResult {
  ledger: {
    id: string;
    customerId: string;
    credit: string;
    entryType: string;
    paymentMethod: string;
  };
  customer: Customer;
}

// --- SUB-PHASE 3D: GST REPORTING & SUPPLIER INVOICES INTERFACES ---

export interface GstReportQuery {
  from?: string;
  to?: string;
  month?: number;
  year?: number;
  branchId?: string;
  format?: 'json' | 'csv';
}

export interface Gstr1B2bItem {
  customerGstin: string;
  customerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceValue: string;
  placeOfSupply: string;
  reverseCharge: string;
  invoiceType: string;
  rate: string;
  taxableValue: string;
  cgstAmount: string;
  sgstAmount: string;
  igstAmount: string;
}

export interface Gstr1B2clItem {
  invoiceNumber: string;
  invoiceDate: string;
  invoiceValue: string;
  placeOfSupply: string;
  rate: string;
  taxableValue: string;
  igstAmount: string;
}

export interface Gstr1B2csItem {
  placeOfSupply: string;
  supplyType: string;
  rate: string;
  taxableValue: string;
  cgstAmount: string;
  sgstAmount: string;
  igstAmount: string;
  totalTax: string;
}

export interface Gstr1HsnItem {
  hsnCode: string;
  description: string;
  uqc: string;
  totalQuantity: string;
  totalValue: string;
  taxableValue: string;
  igstAmount: string;
  cgstAmount: string;
  sgstAmount: string;
}

export interface Gstr1DocSummary {
  documentType: string;
  fromSerial: string;
  toSerial: string;
  totalIssued: number;
  cancelled: number;
  netIssued: number;
}

export interface Gstr1Response {
  gstin: string;
  legalName: string;
  branchName: string;
  taxPeriod: string;
  statutoryDisclaimer: string;
  summary: {
    totalInvoices: number;
    totalTaxableValue: string;
    totalCgst: string;
    totalSgst: string;
    totalIgst: string;
    totalTax: string;
    totalInvoiceValue: string;
  };
  b2b: Gstr1B2bItem[];
  b2cl: Gstr1B2clItem[];
  b2cs: Gstr1B2csItem[];
  hsnSummary: Gstr1HsnItem[];
  docSummary: Gstr1DocSummary;
}

export interface Gstr3bTable31Item {
  taxableValue: string;
  igst: string;
  cgst: string;
  sgst: string;
  cess: string;
}

export interface Gstr3bResponse {
  gstin: string;
  legalName: string;
  branchName: string;
  taxPeriod: string;
  statutoryDisclaimer: string;
  table31: {
    outwardTaxableSupplies: Gstr3bTable31Item;
    outwardZeroRated: Gstr3bTable31Item;
    otherOutwardNilExempt: Gstr3bTable31Item;
    inwardLiableToReverseCharge: Gstr3bTable31Item;
    nonGstOutwardSupplies: Gstr3bTable31Item;
  };
  table32: Array<{
    placeOfSupply: string;
    taxableValue: string;
    igstAmount: string;
  }>;
  table4: {
    itcAvailable: {
      importOfGoods: { igst: string; cgst: string; sgst: string };
      importOfServices: { igst: string; cgst: string; sgst: string };
      inwardReverseCharge: { igst: string; cgst: string; sgst: string };
      inwardFromISD: { igst: string; cgst: string; sgst: string };
      allOtherItc: { igst: string; cgst: string; sgst: string };
    };
    itcReversed: {
      rule42_43: { igst: string; cgst: string; sgst: string };
      others: { igst: string; cgst: string; sgst: string };
    };
    netItcAvailable: { igst: string; cgst: string; sgst: string };
    ineligibleItc: {
      section17_5: { igst: string; cgst: string; sgst: string };
      unregisteredSuppliers: { totalTax: string };
    };
  };
  taxSettlement: {
    outputTaxLiability: { igst: string; cgst: string; sgst: string; total: string };
    netEligibleItc: { igst: string; cgst: string; sgst: string; total: string };
    itcSetOff: { igst: string; cgst: string; sgst: string; total: string };
    netCashPayable: { igst: string; cgst: string; sgst: string; total: string };
  };
  auditWarnings: string[];
}

export interface SalesRegisterRecord {
  id: string;
  invoiceNumber: string;
  date: string;
  branchName: string;
  customerName: string;
  customerGstin: string;
  placeOfSupply: string;
  isInterstate: boolean;
  subtotal: string;
  discountTotal: string;
  taxableTotal: string;
  cgstTotal: string;
  sgstTotal: string;
  igstTotal: string;
  grandTotal: string;
  paymentStatus: string;
  itemCount: number;
}

export interface SalesRegisterResponse {
  period: string;
  totalCount: number;
  records: SalesRegisterRecord[];
}

export interface SupplierInvoiceLineItem {
  id: string;
  description: string;
  hsnCode?: string | null;
  quantity: string;
  unitCost: string;
  taxableValue: string;
  gstRatePercent: string;
  cgstAmount: string;
  sgstAmount: string;
  igstAmount: string;
  lineTotal: string;
}

export interface SupplierInvoice {
  id: string;
  tenantId: string;
  branchId: string;
  supplierId: string;
  purchaseOrderId?: string | null;
  supplierInvoiceNumber: string;
  supplierInvoiceDate: string;
  subtotal: string;
  cgstAmount: string;
  sgstAmount: string;
  igstAmount: string;
  totalAmount: string;
  isItcEligible: boolean;
  ineligibilityReason?: string | null;
  isReverseCharge: boolean;
  placeOfSupply?: string | null;
  notes?: string | null;
  supplier?: Supplier;
  lines?: SupplierInvoiceLineItem[];
  createdAt: string;
}

export interface CreateSupplierInvoiceRequest {
  branchId: string;
  supplierId: string;
  purchaseOrderId?: string;
  supplierInvoiceNumber: string;
  supplierInvoiceDate: string;
  isItcEligible?: boolean;
  ineligibilityReason?: string;
  isReverseCharge?: boolean;
  placeOfSupply?: string;
  notes?: string;
  items: Array<{
    productId?: string;
    description: string;
    hsnCode?: string;
    quantity: string;
    unitCost: string;
    gstRatePercent: string;
  }>;
}

export interface RecordStockMovementRequest {
  branchId: string;
  productId: string;
  movementType: StockMovementType;
  quantityDelta: string;
  unitCost: string;
  sourceType: string;
  sourceId: string;
  idempotencyKey: string;
  reason?: string;
}

export interface CashierShift {
  id: string;
  tenantId: string;
  branchId: string;
  cashierUserId: string;
  status: 'open' | 'closed';
  openingCash: string;
  closingCash: string | null;
  expectedCash: string | null;
  variance: string | null;
  openedAt: string;
  closedAt: string | null;
}

export interface OpenShiftRequest {
  branchId: string;
  openingCash: string;
}

export interface CloseShiftRequest {
  closingCash: string;
  notes?: string;
}

export interface DailySalesReport {
  date: string;
  totalSales: string;
  totalTax: string;
  invoiceCount: number;
  paymentBreakdown: Record<string, string>;
}

export interface Device {
  id: string;
  tenantId: string;
  branchId: string;
  deviceIdentifier: string;
  deviceName: string;
  platform: string;
  appVersion: string | null;
  status: 'active' | 'inactive' | 'revoked';
  lastSeenAt: string | null;
}

export interface Subscription {
  id: string;
  tenantId: string;
  planCode: string;
  status: string;
  maxBranches: number;
  maxDevices: number;
  maxUsers: number;
  currentPeriodEnd: string | null;
}

// --- RESTAURANT & CAFE MODULE INTERFACES ---

export interface RestaurantTable {
  id: string;
  tenantId: string;
  branchId: string;
  tableNumber: string;
  tableName: string | null;
  section: string;
  seatingCapacity: number;
  status: TableStatus;
  currentGuestCount: number;
  occupiedAt: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  activeOrder?: RestaurantOrder | null;
}

export interface RestaurantKotLine {
  id: string;
  tenantId: string;
  kotId: string;
  orderId: string;
  productId: string;
  productNameSnapshot: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
  kitchenStation: KitchenStation;
  specialInstructions: string | null;
  status: KotStatus;
  createdAt: string;
}

export interface RestaurantKot {
  id: string;
  tenantId: string;
  branchId: string;
  orderId: string;
  kotNumber: string;
  tableNumber: string;
  kitchenStation: KitchenStation;
  status: KotStatus;
  captainName: string | null;
  dispatchedAt: string;
  readyAt: string | null;
  servedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lines?: RestaurantKotLine[];
}

export interface RestaurantOrder {
  id: string;
  tenantId: string;
  branchId: string;
  orderNumber: string;
  orderType: RestaurantOrderType;
  tableId: string | null;
  tableNumberSnapshot: string | null;
  sectionSnapshot: string | null;
  guestCount: number;
  customerId: string | null;
  customerNameSnapshot: string | null;
  customerPhoneSnapshot: string | null;
  status: RestaurantOrderStatus;
  captainUserId: string | null;
  captainNameSnapshot: string | null;
  notes: string | null;
  subtotal: string;
  taxTotal: string;
  discountTotal: string;
  grandTotal: string;
  invoiceId: string | null;
  openedAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  kots?: RestaurantKot[];
  lines?: RestaurantKotLine[];
}

export interface CreateTableRequest {
  tableNumber: string;
  tableName?: string;
  section?: string;
  seatingCapacity?: number;
  sortOrder?: number;
}

export interface UpdateTableRequest {
  tableName?: string;
  section?: string;
  seatingCapacity?: number;
  status?: TableStatus;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateRestaurantOrderRequest {
  tableId?: string;
  orderType?: RestaurantOrderType;
  guestCount?: number;
  customerId?: string;
  notes?: string;
}

export interface DispatchKotItemRequest {
  productId: string;
  quantity: string;
  specialInstructions?: string;
  kitchenStation?: KitchenStation;
}

export interface DispatchKotRequest {
  orderId: string;
  items: DispatchKotItemRequest[];
  kitchenStation?: KitchenStation;
}

export interface RestaurantSplitPayment {
  paymentMethod: PaymentMethod;
  amount: string;
  externalReference?: string;
}

export interface SettleRestaurantOrderRequest {
  orderId: string;
  paymentMethod: PaymentMethod;
  isSplit?: boolean;
  splitPayments?: RestaurantSplitPayment[];
  cashTendered?: string;
  customerId?: string;
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private activeTenantId: string | null = null;
  private activeBranchId: string | null = null;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    // In the browser, always default to '/api/v1' relative path to prevent any localhost leaks
    if (typeof window !== 'undefined') {
      const envUrl = process.env.NEXT_PUBLIC_API_URL;
      if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
        this.baseUrl = envUrl;
      } else {
        this.baseUrl = '/api/v1';
      }
    } else {
      this.baseUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://backend:3001/api/v1';
    }
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setActiveContext(tenantId: string | null, branchId: string | null): void {
    this.activeTenantId = tenantId;
    this.activeBranchId = branchId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    if (this.activeTenantId && !headers['x-tenant-id']) {
      headers['x-tenant-id'] = this.activeTenantId;
    }

    if (this.activeBranchId && !headers['x-branch-id']) {
      headers['x-branch-id'] = this.activeBranchId;
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: options.credentials || 'include', // Includes HttpOnly cookies
    };

    const response = await fetch(url, config);

    // Handle 401 Unauthorized (attempt refresh)
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      const refreshedToken = await this.handleTokenRefresh();
      if (refreshedToken) {
        headers['Authorization'] = `Bearer ${refreshedToken}`;
        const retryResponse = await fetch(url, { ...config, headers });
        if (!retryResponse.ok) {
          throw await this.parseError(retryResponse);
        }
        if (retryResponse.status === 204) return {} as T;
        return (await retryResponse.json()) as T;
      }
    }

    if (!response.ok) {
      throw await this.parseError(response);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  }

  private async parseError(response: Response): Promise<ApiError> {
    try {
      const err = (await response.json()) as ApiErrorResponse;
      const message = Array.isArray(err.message) ? err.message.join(', ') : err.message || response.statusText;
      return new ApiError(message, response.status, err.message);
    } catch {
      return new ApiError(`HTTP Error ${response.status}: ${response.statusText}`, response.status);
    }
  }

  private async handleTokenRefresh(): Promise<string | null> {
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.refreshSubscribers.push(resolve);
      });
    }

    this.isRefreshing = true;

    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        this.setAccessToken(null);
        return null;
      }

      const data = (await res.json()) as AuthResponse;
      this.setAccessToken(data.accessToken);

      this.refreshSubscribers.forEach((cb) => cb(data.accessToken));
      this.refreshSubscribers = [];
      return data.accessToken;
    } catch {
      this.setAccessToken(null);
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  // --- Auth APIs ---

  async registerMerchant(dto: RegisterMerchantRequest): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/register-merchant', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    this.setAccessToken(res.accessToken);
    return res;
  }

  async login(dto: { email: string; password: string }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    this.setAccessToken(res.accessToken);
    return res;
  }

  async getProfile(): Promise<UserProfile> {
    return this.request<UserProfile>('/auth/me');
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setAccessToken(null);
      this.setActiveContext(null, null);
    }
  }

  // --- Tenancy & Branches ---

  async getTenants(): Promise<Tenant[]> {
    return this.request<Tenant[]>('/tenants');
  }

  async getBranches(tenantId: string): Promise<Branch[]> {
    return this.request<Branch[]>(`/tenants/${tenantId}/branches`);
  }

  async updateBranch(tenantId: string, branchId: string, dto: UpdateBranchRequest): Promise<Branch> {
    return this.request<Branch>(`/tenants/${tenantId}/branches/${branchId}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  // --- Catalog & Stock ---

  async getProducts(tenantId: string): Promise<Product[]> {
    return this.request<Product[]>(`/tenants/${tenantId}/catalog/products`);
  }

  async getProduct(tenantId: string, productId: string): Promise<Product> {
    return this.request<Product>(`/tenants/${tenantId}/catalog/products/${productId}`);
  }

  async createProduct(tenantId: string, dto: CreateProductRequest): Promise<Product> {
    return this.request<Product>(`/tenants/${tenantId}/catalog/products`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updateProduct(tenantId: string, productId: string, dto: UpdateProductRequest): Promise<Product> {
    return this.request<Product>(`/tenants/${tenantId}/catalog/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  async deleteProduct(tenantId: string, productId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/tenants/${tenantId}/catalog/products/${productId}`, {
      method: 'DELETE',
    });
  }

  async getCategories(tenantId: string): Promise<Category[]> {
    return this.request<Category[]>(`/tenants/${tenantId}/catalog/categories`);
  }

  async createCategory(
    tenantId: string,
    dto: { name: string; code: string; parentId?: string; sortOrder?: number },
  ): Promise<Category> {
    return this.request<Category>(`/tenants/${tenantId}/catalog/categories`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async getUnits(tenantId: string): Promise<Unit[]> {
    return this.request<Unit[]>(`/tenants/${tenantId}/catalog/units`);
  }

  async createUnit(
    tenantId: string,
    dto: { name: string; symbol: string; decimalPlaces?: number },
  ): Promise<Unit> {
    return this.request<Unit>(`/tenants/${tenantId}/catalog/units`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async searchProduct(tenantId: string, query: string): Promise<Product | null> {
    return this.request<Product | null>(`/tenants/${tenantId}/catalog/products/search?q=${encodeURIComponent(query)}`);
  }

  async getStockBalances(tenantId: string, branchId?: string): Promise<StockBalance[]> {
    const query = branchId ? `?branchId=${branchId}` : '';
    return this.request<StockBalance[]>(`/tenants/${tenantId}/catalog/stock-balances${query}`);
  }

  async recordStockMovement(tenantId: string, dto: RecordStockMovementRequest): Promise<any> {
    return this.request(`/tenants/${tenantId}/catalog/stock/movements`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  // --- Suppliers ---

  async getSuppliers(tenantId: string): Promise<Supplier[]> {
    return this.request<Supplier[]>(`/tenants/${tenantId}/catalog/suppliers`);
  }

  async createSupplier(tenantId: string, dto: CreateSupplierRequest): Promise<Supplier> {
    return this.request<Supplier>(`/tenants/${tenantId}/catalog/suppliers`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updateSupplier(tenantId: string, id: string, dto: UpdateSupplierRequest): Promise<Supplier> {
    return this.request<Supplier>(`/tenants/${tenantId}/catalog/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  async deleteSupplier(tenantId: string, id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/tenants/${tenantId}/catalog/suppliers/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Purchase Orders & GRN ---

  async getPurchaseOrders(
    tenantId: string,
    params?: { branchId?: string; supplierId?: string; status?: string },
  ): Promise<PurchaseOrder[]> {
    const q = new URLSearchParams();
    if (params?.branchId) q.append('branchId', params.branchId);
    if (params?.supplierId) q.append('supplierId', params.supplierId);
    if (params?.status) q.append('status', params.status);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<PurchaseOrder[]>(`/tenants/${tenantId}/catalog/purchases/orders${qs}`);
  }

  async getPurchaseOrder(tenantId: string, id: string): Promise<PurchaseOrder> {
    return this.request<PurchaseOrder>(`/tenants/${tenantId}/catalog/purchases/orders/${id}`);
  }

  async createPurchaseOrder(tenantId: string, dto: CreatePurchaseOrderRequest): Promise<PurchaseOrder> {
    return this.request<PurchaseOrder>(`/tenants/${tenantId}/catalog/purchases/orders`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updatePurchaseOrderStatus(tenantId: string, id: string, status: string): Promise<PurchaseOrder> {
    return this.request<PurchaseOrder>(`/tenants/${tenantId}/catalog/purchases/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async receivePurchaseOrder(
    tenantId: string,
    id: string,
    dto: ReceivePurchaseOrderRequest,
  ): Promise<PurchaseOrder> {
    return this.request<PurchaseOrder>(`/tenants/${tenantId}/catalog/purchases/orders/${id}/receive`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  // --- Multi-Branch Stock Transfers ---

  async getStockTransfers(
    tenantId: string,
    params?: {
      branchId?: string;
      sourceBranchId?: string;
      destinationBranchId?: string;
      status?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{ data: StockTransfer[]; total: number; page: number; limit: number }> {
    const q = new URLSearchParams();
    if (params?.branchId) q.append('branchId', params.branchId);
    if (params?.sourceBranchId) q.append('sourceBranchId', params.sourceBranchId);
    if (params?.destinationBranchId) q.append('destinationBranchId', params.destinationBranchId);
    if (params?.status) q.append('status', params.status);
    if (params?.page) q.append('page', params.page.toString());
    if (params?.limit) q.append('limit', params.limit.toString());
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<{ data: StockTransfer[]; total: number; page: number; limit: number }>(
      `/tenants/${tenantId}/catalog/transfers${qs}`,
    );
  }

  async getStockTransfer(tenantId: string, id: string): Promise<StockTransfer> {
    return this.request<StockTransfer>(`/tenants/${tenantId}/catalog/transfers/${id}`);
  }

  async createStockTransfer(
    tenantId: string,
    dto: CreateStockTransferRequest,
  ): Promise<StockTransfer> {
    return this.request<StockTransfer>(`/tenants/${tenantId}/catalog/transfers`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async dispatchStockTransfer(
    tenantId: string,
    id: string,
    dto?: DispatchStockTransferRequest,
  ): Promise<StockTransfer> {
    return this.request<StockTransfer>(`/tenants/${tenantId}/catalog/transfers/${id}/dispatch`, {
      method: 'POST',
      body: JSON.stringify(dto || {}),
    });
  }

  async receiveStockTransfer(
    tenantId: string,
    id: string,
    dto: ReceiveStockTransferRequest,
  ): Promise<StockTransfer> {
    return this.request<StockTransfer>(`/tenants/${tenantId}/catalog/transfers/${id}/receive`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async cancelStockTransfer(
    tenantId: string,
    id: string,
    dto?: CancelStockTransferRequest,
  ): Promise<StockTransfer> {
    return this.request<StockTransfer>(`/tenants/${tenantId}/catalog/transfers/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify(dto || {}),
    });
  }

  // --- Billing & Sales ---

  async createSale(tenantId: string, dto: CreateSaleRequest): Promise<Invoice> {
    return this.request<Invoice>(`/tenants/${tenantId}/billing/sales`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async getInvoices(tenantId: string, branchId?: string): Promise<Invoice[]> {
    const query = branchId ? `?branchId=${branchId}` : '';
    return this.request<Invoice[]>(`/tenants/${tenantId}/billing/invoices${query}`);
  }

  async createSalesReturn(tenantId: string, payload: CreateSalesReturnPayload): Promise<CreditNote> {
    return this.request<CreditNote>(`/tenants/${tenantId}/billing/returns`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getCreditNotes(
    tenantId: string,
    params?: { branchId?: string; originalInvoiceId?: string },
  ): Promise<{ creditNotes: CreditNote[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.branchId) searchParams.append('branchId', params.branchId);
    if (params?.originalInvoiceId) searchParams.append('originalInvoiceId', params.originalInvoiceId);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request<{ creditNotes: CreditNote[]; total: number }>(
      `/tenants/${tenantId}/billing/credit-notes${query}`,
    );
  }

  async getCreditNoteById(tenantId: string, creditNoteId: string): Promise<CreditNote> {
    return this.request<CreditNote>(`/tenants/${tenantId}/billing/credit-notes/${creditNoteId}`);
  }

  // --- Operations (Khata & Shifts) ---

  async getCustomers(tenantId: string): Promise<Customer[]> {
    return this.request<Customer[]>(`/tenants/${tenantId}/operations/customers`);
  }

  async createCustomer(tenantId: string, dto: CreateCustomerRequest): Promise<Customer> {
    return this.request<Customer>(`/tenants/${tenantId}/operations/customers`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async searchCustomers(tenantId: string, query: string): Promise<Customer[]> {
    const qs = query ? `?q=${encodeURIComponent(query)}` : '';
    return this.request<Customer[]>(`/tenants/${tenantId}/operations/customers/search${qs}`);
  }

  async getCustomerHistory(tenantId: string, customerId: string): Promise<CustomerHistoryResponse> {
    return this.request<CustomerHistoryResponse>(
      `/tenants/${tenantId}/operations/customers/${customerId}/history`,
    );
  }

  async mergeCustomers(
    tenantId: string,
    sourceCustomerId: string,
    dto: { targetCustomerId: string; reason: string },
  ): Promise<{ success: boolean; message: string; targetCustomer: Customer }> {
    return this.request<{ success: boolean; message: string; targetCustomer: Customer }>(
      `/tenants/${tenantId}/operations/customers/${sourceCustomerId}/merge`,
      {
        method: 'POST',
        body: JSON.stringify(dto),
      },
    );
  }

  async cleanupDevTestCustomers(
    tenantId: string,
  ): Promise<{ cleanedCount: number; skippedWithFinancialRecords: string[]; message: string }> {
    return this.request<{ cleanedCount: number; skippedWithFinancialRecords: string[]; message: string }>(
      `/tenants/${tenantId}/operations/customers/cleanup-dev-test-data`,
      {
        method: 'POST',
      },
    );
  }

  async recordCustomerPayment(
    tenantId: string,
    customerId: string,
    dto: RecordCustomerPaymentRequest,
  ): Promise<CustomerPaymentResult> {
    return this.request<CustomerPaymentResult>(`/tenants/${tenantId}/operations/customers/${customerId}/payments`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async getCustomerStatement(
    tenantId: string,
    customerId: string,
    query?: { from?: string; to?: string; branchId?: string },
  ): Promise<CustomerStatementResponse> {
    const params = new URLSearchParams();
    if (query?.from) params.set('from', query.from);
    if (query?.to) params.set('to', query.to);
    if (query?.branchId) params.set('branchId', query.branchId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<CustomerStatementResponse>(
      `/tenants/${tenantId}/operations/customers/${customerId}/statement${qs}`,
    );
  }

  async updateCustomerCreditLimit(
    tenantId: string,
    customerId: string,
    dto: UpdateCustomerCreditLimitRequest,
  ): Promise<Customer> {
    return this.request<Customer>(
      `/tenants/${tenantId}/operations/customers/${customerId}/credit-limit`,
      {
        method: 'PATCH',
        body: JSON.stringify(dto),
      },
    );
  }

  async recordCustomerAdjustment(
    tenantId: string,
    customerId: string,
    dto: CustomerAdjustmentRequest,
  ): Promise<any> {
    return this.request(
      `/tenants/${tenantId}/operations/customers/${customerId}/adjustments`,
      {
        method: 'POST',
        body: JSON.stringify(dto),
      },
    );
  }

  async getShifts(tenantId: string, branchId?: string): Promise<CashierShift[]> {
    const query = branchId ? `?branchId=${branchId}` : '';
    return this.request<CashierShift[]>(`/tenants/${tenantId}/operations/shifts${query}`);
  }

  async getCurrentShift(tenantId: string, branchId?: string): Promise<CashierShift | null> {
    const query = branchId ? `?branchId=${branchId}` : '';
    return this.request<CashierShift | null>(`/tenants/${tenantId}/operations/shifts/current${query}`);
  }

  async openShift(tenantId: string, dto: OpenShiftRequest): Promise<CashierShift> {
    return this.request<CashierShift>(`/tenants/${tenantId}/operations/shifts/open`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async closeShift(tenantId: string, shiftId: string, dto: CloseShiftRequest): Promise<CashierShift> {
    return this.request<CashierShift>(`/tenants/${tenantId}/operations/shifts/${shiftId}/close`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async getDailySalesReport(tenantId: string, branchId: string, date: string): Promise<DailySalesReport> {
    return this.request<DailySalesReport>(
      `/tenants/${tenantId}/operations/reports/daily-sales?branchId=${branchId}&date=${date}`,
    );
  }

  // --- Commercial (Devices & Subscription) ---

  async getDevices(tenantId: string): Promise<Device[]> {
    return this.request<Device[]>(`/tenants/${tenantId}/commercial/devices`);
  }

  async getSubscription(tenantId: string): Promise<Subscription> {
    return this.request<Subscription>(`/tenants/${tenantId}/commercial/subscription`);
  }

  // --- SUB-PHASE 3D: GST REPORTING & SUPPLIER INVOICES ---

  async getGstr1Report(tenantId: string, query?: GstReportQuery): Promise<Gstr1Response> {
    const params = new URLSearchParams();
    if (query?.from) params.set('from', query.from);
    if (query?.to) params.set('to', query.to);
    if (query?.month) params.set('month', String(query.month));
    if (query?.year) params.set('year', String(query.year));
    if (query?.branchId) params.set('branchId', query.branchId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<Gstr1Response>(`/tenants/${tenantId}/billing/reports/gst/gstr-1${qs}`);
  }

  async getGstr3bReport(tenantId: string, query?: GstReportQuery): Promise<Gstr3bResponse> {
    const params = new URLSearchParams();
    if (query?.from) params.set('from', query.from);
    if (query?.to) params.set('to', query.to);
    if (query?.month) params.set('month', String(query.month));
    if (query?.year) params.set('year', String(query.year));
    if (query?.branchId) params.set('branchId', query.branchId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<Gstr3bResponse>(`/tenants/${tenantId}/billing/reports/gst/gstr-3b${qs}`);
  }

  async getSalesRegister(tenantId: string, query?: GstReportQuery): Promise<SalesRegisterResponse> {
    const params = new URLSearchParams();
    if (query?.from) params.set('from', query.from);
    if (query?.to) params.set('to', query.to);
    if (query?.month) params.set('month', String(query.month));
    if (query?.year) params.set('year', String(query.year));
    if (query?.branchId) params.set('branchId', query.branchId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<SalesRegisterResponse>(`/tenants/${tenantId}/billing/reports/gst/sales-register${qs}`);
  }

  async getSupplierInvoices(tenantId: string, branchId?: string): Promise<SupplierInvoice[]> {
    const query = branchId ? `?branchId=${branchId}` : '';
    return this.request<SupplierInvoice[]>(`/tenants/${tenantId}/billing/supplier-invoices${query}`);
  }

  async recordSupplierInvoice(tenantId: string, dto: CreateSupplierInvoiceRequest): Promise<SupplierInvoice> {
    return this.request<SupplierInvoice>(`/tenants/${tenantId}/billing/supplier-invoices`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  // Platform Super Admin
  async getPlatformMetrics(): Promise<PlatformMetrics> {
    return this.request<PlatformMetrics>('/platform-admin/metrics');
  }

  async getPlatformTenants(): Promise<PlatformTenant[]> {
    return this.request<PlatformTenant[]>('/platform-admin/tenants');
  }

  async createPlatformTenant(dto: {
    legalName: string;
    displayName: string;
    businessType?: string;
    ownerEmail: string;
    ownerName: string;
    ownerPassword: string;
    planCode?: string;
  }): Promise<any> {
    return this.request('/platform-admin/tenants', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updatePlatformTenantStatus(id: string, status: string): Promise<any> {
    return this.request(`/platform-admin/tenants/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getPlatformPlans(): Promise<PlatformPlan[]> {
    return this.request<PlatformPlan[]>('/platform-admin/plans');
  }

  async updatePlatformSubscription(dto: {
    tenantId: string;
    planCode: string;
    status: string;
    maxBranches: number;
    maxDevices: number;
    maxUsers: number;
  }): Promise<any> {
    return this.request('/platform-admin/subscriptions', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async getPlatformDevices(): Promise<PlatformDevice[]> {
    return this.request<PlatformDevice[]>('/platform-admin/devices');
  }

  async revokePlatformDevice(id: string, reason: string): Promise<any> {
    return this.request(`/platform-admin/devices/${id}/revoke`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getPlatformAudit(limit = 50, offset = 0): Promise<{ total: number; limit: number; offset: number; data: PlatformAuditLog[] }> {
    return this.request(`/platform-admin/audit?limit=${limit}&offset=${offset}`);
  }

  // --- Restaurant & Cafe Endpoints ---

  async getRestaurantTables(tenantId: string, branchId: string, section?: string): Promise<RestaurantTable[]> {
    const query = new URLSearchParams({ branchId });
    if (section && section !== 'all') {
      query.append('section', section);
    }
    return this.request<RestaurantTable[]>(`/tenants/${tenantId}/restaurant/tables?${query.toString()}`);
  }

  async createRestaurantTable(tenantId: string, branchId: string, dto: CreateTableRequest): Promise<RestaurantTable> {
    return this.request<RestaurantTable>(`/tenants/${tenantId}/restaurant/tables?branchId=${branchId}`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async seedDefaultRestaurantTables(tenantId: string, branchId: string): Promise<RestaurantTable[]> {
    return this.request<RestaurantTable[]>(`/tenants/${tenantId}/restaurant/tables/seed-defaults?branchId=${branchId}`, {
      method: 'POST',
    });
  }

  async updateRestaurantTable(
    tenantId: string,
    branchId: string,
    tableId: string,
    dto: UpdateTableRequest,
  ): Promise<RestaurantTable> {
    return this.request<RestaurantTable>(`/tenants/${tenantId}/restaurant/tables/${tableId}?branchId=${branchId}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async getRestaurantOrder(tenantId: string, orderId: string): Promise<RestaurantOrder> {
    return this.request<RestaurantOrder>(`/tenants/${tenantId}/restaurant/orders/${orderId}`);
  }

  async createRestaurantOrder(
    tenantId: string,
    branchId: string,
    dto: CreateRestaurantOrderRequest,
  ): Promise<RestaurantOrder> {
    return this.request<RestaurantOrder>(`/tenants/${tenantId}/restaurant/orders?branchId=${branchId}`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async dispatchRestaurantKot(
    tenantId: string,
    branchId: string,
    dto: DispatchKotRequest,
  ): Promise<RestaurantKot> {
    return this.request<RestaurantKot>(`/tenants/${tenantId}/restaurant/kots/dispatch?branchId=${branchId}`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async getRestaurantKdsQueue(
    tenantId: string,
    branchId: string,
    station?: KitchenStation,
  ): Promise<RestaurantKot[]> {
    const query = new URLSearchParams({ branchId });
    if (station) {
      query.append('station', station);
    }
    return this.request<RestaurantKot[]>(`/tenants/${tenantId}/restaurant/kds?${query.toString()}`);
  }

  async updateRestaurantKotStatus(
    tenantId: string,
    branchId: string,
    kotId: string,
    status: KotStatus,
  ): Promise<RestaurantKot> {
    return this.request<RestaurantKot>(`/tenants/${tenantId}/restaurant/kots/${kotId}/status?branchId=${branchId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async transferRestaurantTable(
    tenantId: string,
    branchId: string,
    sourceTableId: string,
    targetTableId: string,
  ): Promise<{ success: boolean; message: string; targetTableId: string }> {
    return this.request(`/tenants/${tenantId}/restaurant/tables/transfer?branchId=${branchId}`, {
      method: 'POST',
      body: JSON.stringify({ sourceTableId, targetTableId }),
    });
  }

  async settleRestaurantOrder(
    tenantId: string,
    branchId: string,
    dto: SettleRestaurantOrderRequest,
  ): Promise<{ order: RestaurantOrder; invoice: any }> {
    return this.request(`/tenants/${tenantId}/restaurant/orders/settle?branchId=${branchId}`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }
}

export interface PlatformMetrics {
  tenants: { total: number; active: number; suspended: number };
  branches: { total: number };
  devices: { total: number; active: number; revoked: number };
  transactions: { totalInvoices: number; totalSalesVolume: string };
  platformVersion: string;
  systemStatus: string;
}

export interface PlatformTenant {
  id: string;
  legalName: string;
  displayName: string;
  businessType: string;
  status: string;
  currency: string;
  timezone: string;
  createdAt: string;
  branchCount: number;
  userCount: number;
  deviceCount: number;
  subscription: {
    planCode: string;
    status: string;
    maxBranches: number;
    maxDevices: number;
    maxUsers: number;
    currentPeriodEnd: string | null;
  } | null;
}

export interface PlatformPlan {
  planCode: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  maxBranches: number;
  maxDevices: number;
  maxUsers: number;
  features: string[];
}

export interface PlatformDevice {
  id: string;
  deviceIdentifier: string;
  deviceName: string;
  platform: string;
  appVersion: string | null;
  status: string;
  lastSeenAt: string | null;
  revokedAt: string | null;
  revocationReason: string | null;
  createdAt: string;
  tenantName: string;
  tenantId: string;
  branchName: string;
  branchCode: string;
}

export interface PlatformAuditLog {
  id: string;
  tenantId: string;
  userId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export const apiClient = new ApiClient();

