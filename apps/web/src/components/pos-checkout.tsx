'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, Product, StockBalance, Customer, Invoice, Category } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { PaymentMethod } from '@pos/shared-types';
import {
  ShoppingCart,
  Barcode,
  Search,
  Plus,
  Minus,
  Trash2,
  RefreshCw,
  User,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Printer,
  X,
  CreditCard,
  Banknote,
  QrCode,
  BookOpen,
  Split,
  Sparkles,
  Camera,
} from 'lucide-react';
import { CameraBarcodeModal } from '@/components/camera-barcode-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { RecentBillsModal } from '@/features/billing/recent-bills-modal';

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function PosCheckoutScreen() {
  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    updateDiscount,
    clearCart,
    getSubtotal,
    getTaxTotal,
    getUnroundedTotal,
    getRoundingAdjustment,
    getGrandTotal,
    getDiscountTotal,
  } = useCartStore();
  const { activeTenant, activeBranch, branches } = useAuthStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [stockMap, setStockMap] = useState<Map<string, string>>(new Map());
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Recent Bills state
  const [recentBillsOpen, setRecentBillsOpen] = useState(false);
  const [cameraScannerOpen, setCameraScannerOpen] = useState(false);

  // Checkout modal & payment state
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [cashTendered, setCashTendered] = useState<string>('');
  const [splitPayments, setSplitPayments] = useState<{ method: PaymentMethod; amount: string; externalReference?: string }[]>([]);
  const [isSplit, setIsSplit] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState<string>(generateUuid());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Quick Customer Creation Modal from POS
  const [posCustomerModal, setPosCustomerModal] = useState<{
    open: boolean;
    name: string;
    phone: string;
    gstin: string;
    creditLimit: string;
    isSubmitting: boolean;
    duplicateWarning?: {
      message: string;
      existingCustomer: Customer;
    } | null;
    error?: string | null;
  }>({
    open: false,
    name: '',
    phone: '',
    gstin: '',
    creditLimit: '0.00',
    isSubmitting: false,
    duplicateWarning: null,
    error: null,
  });

  // Server confirmed invoice receipt modal
  const [confirmedInvoice, setConfirmedInvoice] = useState<Invoice | null>(null);

  // Fetch products, stocks, and customers from live backend
  const loadData = useCallback(async () => {
    if (!activeTenant) return;
    setLoading(true);
    setError(null);
    try {
      const [productList, balanceList, customerList, categoryList] = await Promise.all([
        apiClient.getProducts(activeTenant.tenantId),
        activeBranch ? apiClient.getStockBalances(activeTenant.tenantId, activeBranch.id).catch(() => [] as StockBalance[]) : Promise.resolve([] as StockBalance[]),
        apiClient.getCustomers(activeTenant.tenantId).catch(() => [] as Customer[]),
        apiClient.getCategories ? apiClient.getCategories(activeTenant.tenantId).catch(() => [] as Category[]) : Promise.resolve([] as Category[]),
      ]);

      setProducts(productList);

      const map = new Map<string, string>();
      balanceList.forEach((b) => map.set(b.productId, b.quantityOnHand));
      setStockMap(map);

      setCustomers(customerList);
      setCategories(categoryList || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load catalog from server');
    } finally {
      setLoading(false);
    }
  }, [activeTenant, activeBranch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keyboard shortcut listener for high-speed cashier billing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

      if (e.key === 'F1') {
        e.preventDefault();
        if (items.length > 0) openCheckout(PaymentMethod.CASH);
      } else if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      } else if (e.key === 'F3') {
        e.preventDefault();
        if (items.length > 0) openCheckout(PaymentMethod.CARD);
      } else if (e.key === 'F4') {
        e.preventDefault();
        setRecentBillsOpen((prev) => !prev);
      } else if (e.key === 'F6') {
        e.preventDefault();
        if (items.length > 0) openCheckout(PaymentMethod.CREDIT);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items]);

  // Customer search filtering
  const filteredCustomers = useMemo(() => {
    const q = customerSearchQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.gstin && c.gstin.toLowerCase().includes(q)) ||
        c.id.toLowerCase().includes(q)
    );
  }, [customers, customerSearchQuery]);

  // Direct Customer Creation from POS Checkout
  const handleCreateCustomerFromPos = async (confirmDuplicate = false) => {
    if (!activeTenant) return;
    if (!posCustomerModal.name.trim()) {
      setPosCustomerModal((prev) => ({ ...prev, error: 'Customer name is required' }));
      return;
    }

    setPosCustomerModal((prev) => ({ ...prev, isSubmitting: true, error: null }));
    try {
      const newCust = await apiClient.createCustomer(activeTenant.tenantId, {
        name: posCustomerModal.name.trim(),
        phone: posCustomerModal.phone.trim() || undefined,
        gstin: posCustomerModal.gstin.trim() || undefined,
        creditLimit: posCustomerModal.creditLimit || '0.00',
        confirmDuplicate,
      });

      setCustomers((prev) => [newCust, ...prev]);
      setSelectedCustomerId(newCust.id);
      setPosCustomerModal({
        open: false,
        name: '',
        phone: '',
        gstin: '',
        creditLimit: '0.00',
        isSubmitting: false,
        duplicateWarning: null,
        error: null,
      });
    } catch (err: any) {
      if (
        err.status === 409 ||
        err.duplicateCode === 'CUSTOMER_PHONE_EXISTS' ||
        (err.message && err.message.includes('already exists'))
      ) {
        setPosCustomerModal((prev) => ({
          ...prev,
          isSubmitting: false,
          duplicateWarning: {
            message: err.message || 'A customer with this phone number already exists.',
            existingCustomer:
              err.existingCustomer ||
              customers.find(
                (c) =>
                  c.phone &&
                  posCustomerModal.phone &&
                  c.phone.replace(/\D/g, '').endsWith(posCustomerModal.phone.replace(/\D/g, ''))
              ),
          },
        }));
      } else {
        setPosCustomerModal((prev) => ({
          ...prev,
          isSubmitting: false,
          error: err.message || 'Failed to create customer',
        }));
      }
    }
  };

  // Core barcode lookup & cart addition
  const processBarcodeScan = async (rawCode: string) => {
    const query = rawCode.trim();
    if (!query) return;

    // Search cached products first
    const localMatch = products.find(
      (p) =>
        p.barcodePrimary === query ||
        p.sku.toLowerCase() === query.toLowerCase()
    );

    if (localMatch) {
      addItem({
        productId: localMatch.id,
        name: localMatch.name,
        sku: localMatch.sku,
        price: localMatch.sellingPrice,
        mrp: localMatch.mrp,
        gstRate: localMatch.gstRatePercent || '5.00',
        currentStock: stockMap.get(localMatch.id),
      });
      toast.success(`Added ${localMatch.name} to bill`);
      return;
    }

    // Try backend search
    if (activeTenant) {
      try {
        const found = await apiClient.searchProduct(activeTenant.tenantId, query);
        if (found) {
          addItem({
            productId: found.id,
            name: found.name,
            sku: found.sku,
            price: found.sellingPrice,
            mrp: found.mrp,
            gstRate: found.gstRatePercent || '5.00',
            currentStock: stockMap.get(found.id),
          });
          toast.success(`Added ${found.name} to bill`);
          return;
        }
      } catch {
        // Fallthrough
      }
    }

    toast.error(`Barcode/SKU "${query}" not found in catalogue`);
  };

  // Barcode scanner wedge handler (fast keyboard entry)
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = barcodeInput.trim();
    if (!query) return;
    await processBarcodeScan(query);
    setBarcodeInput('');
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const lower = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !lower ||
        p.name.toLowerCase().includes(lower) ||
        p.sku.toLowerCase().includes(lower) ||
        (p.barcodePrimary && p.barcodePrimary.toLowerCase().includes(lower));

      const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [products, searchTerm, selectedCategory]);

  // Open checkout modal / drawer
  const openCheckout = (defaultMethod: PaymentMethod) => {
    if (items.length === 0) return;
    const total = getGrandTotal();
    setSelectedMethod(defaultMethod);
    setCashTendered(total);
    setIsSplit(false);
    setSplitPayments([{ method: defaultMethod, amount: total }]);
    setCheckoutError(null);
    setCheckoutModalOpen(true);
  };

  // Change due calculation for cash payments
  const changeDue = useMemo(() => {
    if (selectedMethod !== PaymentMethod.CASH || isSplit) return 0;
    const tendered = parseFloat(cashTendered || '0');
    const grand = parseFloat(getGrandTotal() || '0');
    return Math.max(0, tendered - grand);
  }, [selectedMethod, isSplit, cashTendered, getGrandTotal]);

  // Quick cash preset helper
  const handleCashPreset = (amount: number) => {
    setCashTendered(amount.toFixed(2));
  };

  // Submit sale to live backend
  const handleSubmitSale = async () => {
    if (!activeTenant || !activeBranch) {
      setCheckoutError('No active tenant or branch selected');
      return;
    }

    const grandTotalNum = parseFloat(getGrandTotal());

    let paymentsPayload: { paymentMethod: PaymentMethod; amount: string; externalReference?: string }[];
    if (isSplit) {
      const splitSum = splitPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
      if (Math.round(splitSum * 100) < Math.round(grandTotalNum * 100)) {
        setCheckoutError(`Split payment total ₹${splitSum.toFixed(2)} is less than grand total ₹${grandTotalNum.toFixed(2)}`);
        return;
      }
      paymentsPayload = splitPayments.map((p) => ({
        paymentMethod: p.method,
        amount: parseFloat(p.amount).toFixed(2),
        externalReference: p.externalReference,
      }));
    } else {
      paymentsPayload = [
        {
          paymentMethod: selectedMethod,
          amount: grandTotalNum.toFixed(2),
        },
      ];
    }

    // Require customer if Khata is chosen
    const hasKhata = paymentsPayload.some((p) => p.paymentMethod === PaymentMethod.CREDIT);
    if (hasKhata && !selectedCustomerId) {
      setCheckoutError('Customer selection is required for Khata credit billing');
      return;
    }

    setIsSubmitting(true);
    setCheckoutError(null);

    try {
      const saleRequest = {
        branchId: activeBranch.id,
        idempotencyKey,
        customerId: selectedCustomerId || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity.toFixed(3),
          discountAmount: i.discountAmount && parseFloat(i.discountAmount) > 0 ? parseFloat(i.discountAmount).toFixed(2) : undefined,
          gstRatePercent: i.gstRate,
        })),
        payments: paymentsPayload,
      };

      const invoice = await apiClient.createSale(activeTenant.tenantId, saleRequest);

      // Sale succeeded
      setConfirmedInvoice(invoice);
      clearCart();
      setCheckoutModalOpen(false);

      // Generate a new idempotency key for the next sale
      setIdempotencyKey(generateUuid());

      // Refresh stock balance
      loadData();
    } catch (err: any) {
      setCheckoutError(err.message || 'Sale checkout failed. Idempotency key preserved for safe retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="grid grid-cols-12 h-full bg-slate-50 text-slate-900 overflow-hidden select-none"
      data-testid="pos-checkout-screen"
    >
      {/* =========================================================================
          LEFT PANE (7 COLS / 60%): High-Speed Catalog & Touch Product Grid
          ========================================================================= */}
      <div className="col-span-12 lg:col-span-7 xl:col-span-8 flex flex-col h-full border-r border-slate-200/90 overflow-hidden bg-white/70">
        {/* Top Action Bar: Search & Barcode Wedge */}
        <div className="p-3.5 border-b border-slate-200/90 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          {/* Barcode scanner wedge input */}
          <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-1.5 flex-1 max-w-md">
            <div className="relative flex-1">
              <Barcode className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Scan Barcode / Enter SKU (F2)..."
                data-testid="pos-barcode-input"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-medium"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              data-testid="pos-barcode-add-btn"
              className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3 rounded-lg shadow-2xs cursor-pointer shrink-0"
            >
              Add
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setCameraScannerOpen(true)}
              data-testid="pos-camera-scan-btn"
              title="Scan product barcode directly using device camera"
              className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-2.5 rounded-lg shadow-2xs cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <Camera className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Camera</span>
            </Button>
          </form>

          {/* Search bar & Action triggers */}
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search catalog by name..."
                data-testid="pos-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => loadData()}
              title="Refresh Catalog from Server"
              className="h-8 w-8 text-slate-500 hover:text-slate-900 border-slate-200 shrink-0 cursor-pointer shadow-2xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRecentBillsOpen(true)}
              title="Recent Bills & Invoices (F4)"
              data-testid="pos-recent-bills-btn"
              className="h-8 gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50 shrink-0 cursor-pointer shadow-2xs"
            >
              <Receipt className="h-3.5 w-3.5 text-blue-600" />
              <span className="hidden sm:inline">Recent Bills</span>
              <kbd className="hidden md:inline-block bg-slate-100 border border-slate-200 px-1 py-0.2 rounded text-[10px] font-mono text-slate-500">
                F4
              </kbd>
            </Button>
          </div>
        </div>

        {/* Quick Category Filter Pills Bar */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2 border-b border-slate-200/80 bg-slate-50/50 scrollbar-none shrink-0">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              All Items ({products.length})
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-100'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Product Cards Grid Area */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2.5">
              <div className="animate-spin h-7 w-7 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="text-xs font-medium text-slate-500">Loading catalog from PostgreSQL...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex flex-col gap-2">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4" />
                <span>Error: {error}</span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => loadData()}
                className="self-start text-xs font-bold"
              >
                Retry
              </Button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs gap-1.5">
              <Search className="h-8 w-8 text-slate-300" />
              <span>No products match &quot;{searchTerm}&quot;</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map((product) => {
                const stock = stockMap.get(product.id);
                const isOutOfStock = stock !== undefined && parseFloat(stock) <= 0;
                const isLowStock = stock !== undefined && parseFloat(stock) > 0 && parseFloat(stock) <= 5;

                return (
                  <div
                    key={product.id}
                    onClick={() =>
                      addItem({
                        productId: product.id,
                        name: product.name,
                        sku: product.sku,
                        price: product.sellingPrice,
                        mrp: product.mrp,
                        gstRate: product.gstRatePercent || '5.00',
                        currentStock: stock,
                      })
                    }
                    data-testid={`product-card-${product.sku}`}
                    className={`group relative bg-white border rounded-xl p-3 flex flex-col justify-between transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-md hover:border-blue-500 active:scale-[0.98] select-none ${
                      isOutOfStock ? 'border-amber-200/80 bg-amber-50/20' : 'border-slate-200/90'
                    }`}
                  >
                    <div>
                      {/* SKU & Stock Pill */}
                      <div className="flex items-center justify-between gap-1 text-[10px] font-mono mb-1.5">
                        <span className="text-slate-400 font-semibold truncate max-w-[80px]">{product.sku}</span>
                        {stock !== undefined && (
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] px-1.5 py-0 h-4.5 font-mono font-semibold shadow-2xs',
                              !isOutOfStock && !isLowStock && 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
                              isLowStock && !isOutOfStock && 'bg-amber-50 text-amber-700 border-amber-200/70',
                              isOutOfStock && 'bg-rose-50 text-rose-700 border-rose-200/70'
                            )}
                          >
                            Qty: {parseFloat(stock).toFixed(0)}
                          </Badge>
                        )}
                      </div>

                      {/* Product Thumbnail (if photo uploaded) */}
                      {product.imageUrl && (
                        <div className="w-full h-20 mb-2 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      )}

                      {/* Product Name */}
                      <h3 className="font-semibold text-slate-900 text-xs line-clamp-2 leading-snug group-hover:text-blue-700 transition-colors">
                        {product.name}
                      </h3>
                    </div>

                    {/* Price & MRP */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-baseline justify-between">
                      <span className="text-sm font-black text-slate-900 tracking-tight font-mono">
                        ₹{parseFloat(product.sellingPrice).toFixed(2)}
                      </span>
                      {product.mrp && parseFloat(product.mrp) > parseFloat(product.sellingPrice) && (
                        <span className="text-[10px] text-slate-400 line-through font-mono">
                          ₹{parseFloat(product.mrp).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          RIGHT PANE (5 COLS / 40%): Live Cart, Bill Summary & High-Speed Tender
          ========================================================================= */}
      <div className="col-span-12 lg:col-span-5 xl:col-span-4 flex flex-col h-full bg-white shadow-lg overflow-hidden border-l border-slate-200/80">
        {/* Cart Header */}
        <div className="h-14 px-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Current Cart</h2>
            <Badge variant="secondary" className="font-bold text-[11px] px-2 py-0 h-5">
              {items.length} items
            </Badge>
          </div>

          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              data-testid="clear-cart-btn"
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-7 px-2 font-medium cursor-pointer"
            >
              Clear Cart
            </Button>
          )}
        </div>

        {/* Customer Link / Walk-in Bar in Cart */}
        <div className="px-3.5 py-2 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-hidden text-xs">
            <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            {selectedCustomerId ? (
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-bold text-slate-900 truncate">
                  {customers.find((c) => c.id === selectedCustomerId)?.name || 'Selected Customer'}
                </span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[9px] px-1.5 py-0 font-medium">
                  Khata Active
                </Badge>
              </div>
            ) : (
              <span className="text-slate-500 font-medium truncate">Walk-in Customer</span>
            )}
          </div>
          {selectedCustomerId ? (
            <button
              type="button"
              onClick={() => setSelectedCustomerId('')}
              className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer shrink-0"
              title="Unlink Customer"
            >
              Unlink
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setCheckoutModalOpen(true);
              }}
              className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer shrink-0"
            >
              + Link Customer
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div
          className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin"
          data-testid="cart-items-container"
        >
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <p className="text-xs font-semibold text-slate-600">Cart is empty</p>
              <p className="text-[11px] text-slate-400 max-w-[200px]">
                Tap products on the left or scan a barcode (F2) to add items.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.productId}
                data-testid={`cart-row-${item.productId}`}
                className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-2.5 flex flex-col gap-2 transition hover:bg-slate-50 hover:border-slate-300 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate leading-snug">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      ₹{parseFloat(item.price).toFixed(2)} each
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.productId)}
                    data-testid={`remove-item-${item.productId}`}
                    className="h-6 w-6 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  {/* Quantity Stepper (32px touch targets) */}
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="h-7 w-7 text-slate-700 font-bold hover:bg-slate-100 rounded-md cursor-pointer text-xs"
                    >
                      -
                    </Button>
                    <span
                      className="text-xs font-bold font-mono w-7 text-center select-none text-slate-900"
                      data-testid={`qty-${item.productId}`}
                    >
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="h-7 w-7 text-slate-700 font-bold hover:bg-slate-100 rounded-md cursor-pointer text-xs"
                    >
                      +
                    </Button>
                  </div>

                  {/* Line Total */}
                  <span className="text-xs font-bold font-mono text-slate-900">
                    ₹{(parseFloat(item.price) * item.quantity - parseFloat(item.discountAmount || '0')).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bill Calculation & Tender Section */}
        <div className="border-t border-slate-200 p-4 bg-slate-50/60 shrink-0 space-y-3">
          {/* Subtotal & Rounding breakdown */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono">₹{getSubtotal()}</span>
            </div>
            {parseFloat(getDiscountTotal()) > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discounts:</span>
                <span className="font-mono">-₹{getDiscountTotal()}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>Estimated GST:</span>
              <span className="font-mono">₹{getTaxTotal()}</span>
            </div>
            {parseFloat(getRoundingAdjustment()) !== 0 && (
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Rounding (Sec 170):</span>
                <span className="font-mono">
                  {parseFloat(getRoundingAdjustment()) > 0
                    ? `+₹${getRoundingAdjustment()}`
                    : `-₹${Math.abs(parseFloat(getRoundingAdjustment())).toFixed(2)}`}
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Grand Total Hero Display (Large typography) */}
          <div className="flex items-baseline justify-between bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Total Due
              </span>
              <span className="text-[10px] text-slate-400 font-medium">All taxes included</span>
            </div>
            <span
              className="text-3xl font-black text-slate-900 tracking-tight font-mono"
              data-testid="pos-grand-total"
            >
              ₹{getGrandTotal()}
            </span>
          </div>

          {/* Touch Tender Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              onClick={() => openCheckout(PaymentMethod.CASH)}
              disabled={items.length === 0}
              data-testid="pay-cash-btn"
              className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.98]"
            >
              <Banknote className="h-4.5 w-4.5" />
              <span>Cash (F1)</span>
            </Button>
            <Button
              onClick={() => openCheckout(PaymentMethod.UPI)}
              disabled={items.length === 0}
              data-testid="pay-upi-btn"
              className="h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.98]"
            >
              <QrCode className="h-4.5 w-4.5" />
              <span>UPI</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => openCheckout(PaymentMethod.CARD)}
              disabled={items.length === 0}
              data-testid="pay-card-btn"
              className="h-10 border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <CreditCard className="h-4 w-4" />
              <span>Card (F3)</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => openCheckout(PaymentMethod.CREDIT)}
              disabled={items.length === 0}
              data-testid="pay-khata-btn"
              className="h-10 border-amber-300 bg-amber-50/50 text-amber-900 hover:bg-amber-100 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <BookOpen className="h-3.5 w-3.5 text-amber-700" />
              <span>Khata (F6)</span>
            </Button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SLIDE-OVER PAYMENT DRAWER (SHADCN SHEET)
          ========================================================================= */}
      <Sheet open={checkoutModalOpen} onOpenChange={setCheckoutModalOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 flex flex-col justify-between overflow-hidden"
          data-testid="checkout-modal"
        >
          {/* Header */}
          <SheetHeader className="p-5 border-b border-slate-200 bg-white text-slate-900">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                <Receipt className="h-5 w-5" />
              </div>
              <div className="text-left">
                <SheetTitle className="text-base font-bold text-slate-900">
                  {selectedMethod === PaymentMethod.CREDIT ? 'Khata Credit Billing' : 'Complete Sale Checkout'}
                </SheetTitle>
                <SheetDescription className="text-xs text-slate-500 mt-0.5">
                  {selectedMethod === PaymentMethod.CREDIT
                    ? 'Invoice items on customer credit ledger with automatic stock movement'
                    : 'Server-side GST calculation, idempotency & instant receipt'}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Grand Total Hero Box */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Bill Grand Total
                </span>
                {parseFloat(getRoundingAdjustment()) !== 0 && (
                  <span className="text-[11px] font-mono text-slate-500 mt-0.5 block">
                    Net: ₹{getUnroundedTotal()} | Round: {parseFloat(getRoundingAdjustment()) > 0 ? `+₹${getRoundingAdjustment()}` : `-₹${Math.abs(parseFloat(getRoundingAdjustment())).toFixed(2)}`}
                  </span>
                )}
              </div>
              <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                ₹{getGrandTotal()}
              </span>
            </div>

            {/* Error banner if validation fails */}
            {checkoutError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{checkoutError}</span>
              </div>
            )}

            {/* Khata Credit Notice */}
            {selectedMethod === PaymentMethod.CREDIT && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Khata Credit Sale Policy</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-900/90">
                  This transaction adds to the customer&apos;s outstanding balance and deducts stock. Repayments should be recorded under Customer Khata.
                </p>
              </div>
            )}

            {/* Tender Mode Selector & Split Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Tender Mode</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsSplit(!isSplit);
                    if (!isSplit) {
                      setSplitPayments([
                        { method: PaymentMethod.CASH, amount: (parseFloat(getGrandTotal()) / 2).toFixed(2) },
                        { method: PaymentMethod.UPI, amount: (parseFloat(getGrandTotal()) / 2).toFixed(2) },
                      ]);
                    }
                  }}
                  className="h-7 text-xs text-blue-600 hover:text-blue-700 p-0 font-semibold cursor-pointer"
                >
                  {isSplit ? 'Single Tender' : '+ Split Tender'}
                </Button>
              </div>

              {!isSplit ? (
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { m: PaymentMethod.CASH, label: 'Cash', icon: Banknote },
                    { m: PaymentMethod.UPI, label: 'UPI', icon: QrCode },
                    { m: PaymentMethod.CARD, label: 'Card', icon: CreditCard },
                    { m: PaymentMethod.CREDIT, label: 'Khata', icon: BookOpen },
                  ].map(({ m, label, icon: Icon }) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setSelectedMethod(m);
                        if (m === PaymentMethod.CASH) setCashTendered(getGrandTotal());
                      }}
                      data-testid={`tender-select-${m}`}
                      className={`py-2.5 px-1.5 text-xs font-bold rounded-xl border flex flex-col items-center gap-1.5 transition cursor-pointer shadow-2xs ${
                        selectedMethod === m
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <p className="text-[11px] text-slate-500 font-medium">Split Tender Allocations:</p>
                  {splitPayments.map((p, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <select
                        value={p.method}
                        onChange={(e) => {
                          const val = e.target.value as PaymentMethod;
                          setSplitPayments((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, method: val } : item))
                          );
                        }}
                        className="text-xs bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none"
                      >
                        <option value={PaymentMethod.CASH}>Cash</option>
                        <option value={PaymentMethod.UPI}>UPI</option>
                        <option value={PaymentMethod.CARD}>Card</option>
                        <option value={PaymentMethod.CREDIT}>Khata</option>
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        value={p.amount}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSplitPayments((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, amount: val } : item))
                          );
                        }}
                        className="flex-1 text-xs bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-right font-mono"
                        placeholder="0.00"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Cash Presets & Change Due Calculation (When Cash Mode Active) */}
            {selectedMethod === PaymentMethod.CASH && !isSplit && (
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-950">Cash Received</label>
                  <div className="flex items-center gap-1.5 bg-white border border-emerald-300 rounded-lg px-2.5 py-1 shadow-2xs">
                    <span className="text-xs text-emerald-700 font-bold font-mono">₹</span>
                    <input
                      type="number"
                      step="1"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      className="w-24 text-right font-mono font-bold text-xs bg-transparent focus:outline-none text-slate-900"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Preset Fast Buttons */}
                <div className="grid grid-cols-4 gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCashTendered(getGrandTotal())}
                    className="h-8 text-xs font-bold border-emerald-300 bg-white hover:bg-emerald-100 text-emerald-950 cursor-pointer shadow-2xs"
                  >
                    Exact
                  </Button>
                  {[100, 200, 500].map((amt) => (
                    <Button
                      key={amt}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCashPreset(amt)}
                      className="h-8 text-xs font-bold border-emerald-300 bg-white hover:bg-emerald-100 text-emerald-950 cursor-pointer font-mono shadow-2xs"
                    >
                      ₹{amt}
                    </Button>
                  ))}
                </div>

                {/* Change Due Highlight Box */}
                <div className="flex items-baseline justify-between pt-2 border-t border-emerald-200/80">
                  <span className="text-xs font-bold text-emerald-950">Change Due</span>
                  <span className="text-2xl font-black font-mono text-emerald-700">
                    ₹{changeDue.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Customer Account Picker */}
            <div className="border border-slate-200 rounded-xl p-3.5 space-y-2 bg-slate-50/40">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-500" />
                  <span>Customer Profile</span>
                  {selectedCustomerId ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[9px] px-1.5 py-0">
                      Linked Account
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-slate-100 text-slate-600 text-[9px] px-1.5 py-0 font-medium">
                      Walk-in (Anonymous)
                    </Badge>
                  )}
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setPosCustomerModal({
                      open: true,
                      name: '',
                      phone: '',
                      gstin: '',
                      creditLimit: '0.00',
                      isSubmitting: false,
                      duplicateWarning: null,
                      error: null,
                    })
                  }
                  data-testid="pos-new-customer-btn"
                  className="h-6 text-xs text-emerald-600 hover:text-emerald-700 p-0 font-semibold cursor-pointer"
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  <span>+ New</span>
                </Button>
              </div>

              {selectedCustomerId ? (
                (() => {
                  const cust = customers.find((c) => c.id === selectedCustomerId);
                  return (
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{cust?.name || 'Customer'}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                          <span>📞 {cust?.phone || 'No phone'}</span>
                          <span>Due: ₹{cust?.currentBalance || '0.00'}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCustomerId('')}
                        data-testid="pos-unlink-customer-btn"
                        className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-7 px-2 font-bold cursor-pointer"
                      >
                        ✕ Unlink
                      </Button>
                    </div>
                  );
                })()
              ) : (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="Search customer by name or phone..."
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    data-testid="pos-customer-search-input"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {customerSearchQuery.trim() ? (
                    <div className="max-h-36 overflow-y-auto space-y-1 bg-white border border-slate-200 rounded-lg p-1">
                      {filteredCustomers.length === 0 ? (
                        <div className="text-xs text-slate-400 p-2 text-center">
                          No customers found. Click &quot;+ New&quot; to register.
                        </div>
                      ) : (
                        filteredCustomers.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedCustomerId(c.id);
                              setCustomerSearchQuery('');
                            }}
                            data-testid={`select-customer-${c.id}`}
                            className="p-1.5 hover:bg-slate-50 rounded cursor-pointer text-xs flex justify-between items-center transition"
                          >
                            <div>
                              <span className="font-semibold text-slate-800">{c.name}</span>
                              <span className="text-[11px] font-mono text-slate-500 ml-2">{c.phone || ''}</span>
                            </div>
                            <span className="text-[11px] font-mono text-amber-700 font-bold">
                              Due: ₹{c.currentBalance}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      {selectedMethod === PaymentMethod.CREDIT
                        ? '⚠️ Khata sale requires selecting a customer above.'
                        : 'Walk-in sale (no profile required).'}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Idempotency Footer */}
            <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
              <span>Safe Idempotency Key:</span>
              <span className="truncate max-w-[180px]">{idempotencyKey}</span>
            </div>
          </div>

          {/* Drawer Actions */}
          <SheetFooter className="p-4 border-t border-slate-200 bg-slate-50 flex sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCheckoutModalOpen(false)}
              className="flex-1 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmitSale}
              disabled={isSubmitting}
              data-testid="confirm-checkout-btn"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-sm"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                  <span>Posting Sale...</span>
                </span>
              ) : (
                'Confirm & Print (F5)'
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* =========================================================================
          CONFIRMED INVOICE RECEIPT MODAL (SHADCN DIALOG)
          ========================================================================= */}
      {confirmedInvoice && (
        <Dialog open={!!confirmedInvoice} onOpenChange={() => setConfirmedInvoice(null)}>
          <DialogContent className="max-w-md p-0 overflow-hidden" data-testid="confirmed-invoice-modal">
            <DialogHeader className="bg-emerald-600 text-white p-5">
              <Badge variant="outline" className="bg-emerald-700 text-white border-none w-fit text-[10px] uppercase font-bold tracking-wider">
                Sale Confirmed in PostgreSQL
              </Badge>
              <DialogTitle className="text-xl font-black mt-1 text-white" data-testid="confirmed-invoice-number">
                {confirmedInvoice.invoiceNumber}
              </DialogTitle>
              <DialogDescription className="text-xs text-emerald-100">
                Receipt generated and stock movement ledger updated atomically.
              </DialogDescription>
            </DialogHeader>

            {/* Receipt Body */}
            <div className="p-6 font-mono text-xs text-slate-800 space-y-3 bg-white">
              <div className="text-center border-b pb-3">
                <p className="font-bold text-sm text-slate-950">
                  {activeTenant?.tenantName || 'KIRANA SUPERMART'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Branch: {activeBranch?.name || 'Main Counter'}
                </p>
                <p className="text-[11px] text-slate-500">
                  GSTIN: {activeBranch?.gstin || '27AABCU9603R1ZM'}
                </p>
              </div>

              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Date: {new Date(confirmedInvoice.postedAt).toLocaleString('en-IN')}</span>
                <span>Branch: {activeBranch?.code || 'MAIN'}</span>
              </div>

              {/* Items List */}
              <div className="border-t border-b py-2 space-y-1">
                {confirmedInvoice.lines?.map((line, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="truncate max-w-[200px]">{line.productNameSnapshot}</span>
                    <span>
                      {line.quantity} x ₹{line.unitPrice} = ₹{line.lineTotal}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{confirmedInvoice.subtotal}</span>
                </div>
                {parseFloat(confirmedInvoice.discountTotal) > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>-₹{confirmedInvoice.discountTotal}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>CGST:</span>
                  <span>₹{confirmedInvoice.cgstTotal}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>SGST:</span>
                  <span>₹{confirmedInvoice.sgstTotal}</span>
                </div>
                {parseFloat(confirmedInvoice.roundingAdjustment) !== 0 && (
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Rounding:</span>
                    <span>₹{confirmedInvoice.roundingAdjustment}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-950 border-t pt-1">
                  <span>Grand Total:</span>
                  <span>₹{confirmedInvoice.grandTotal}</span>
                </div>
              </div>

              <div className="text-center pt-2 text-[10px] text-slate-400">
                <p>Thank you for shopping with us!</p>
                <p className="font-mono text-[9px] mt-0.5">
                  Idempotency: {confirmedInvoice.idempotencyKey.slice(0, 18)}...
                </p>
              </div>
            </div>

            <DialogFooter className="p-4 bg-slate-50 border-t border-slate-200 flex sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="flex-1 text-xs font-semibold cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                <span>Print Receipt</span>
              </Button>
              <Button
                onClick={() => setConfirmedInvoice(null)}
                data-testid="close-receipt-btn"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
              >
                Next Sale (Done)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* =========================================================================
          QUICK ADD CUSTOMER MODAL (SHADCN DIALOG)
          ========================================================================= */}
      {posCustomerModal.open && (
        <Dialog
          open={posCustomerModal.open}
          onOpenChange={(open) => setPosCustomerModal((prev) => ({ ...prev, open }))}
        >
          <DialogContent className="max-w-sm p-0 overflow-hidden" data-testid="pos-new-customer-modal">
            <DialogHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
              <DialogTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UserPlus className="h-4 w-4" />
                </div>
                <span>Quick Add Customer</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Register customer profile directly from the POS counter
              </DialogDescription>
            </DialogHeader>

            <div className="p-5 space-y-3">
              {posCustomerModal.error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium">
                  ⚠️ {posCustomerModal.error}
                </div>
              )}

              {posCustomerModal.duplicateWarning && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Duplicate Phone Detected</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    A customer with this phone number already exists:
                    <strong className="block text-slate-900 mt-0.5">
                      {posCustomerModal.duplicateWarning.existingCustomer?.name || 'Existing Customer'}
                      {posCustomerModal.duplicateWarning.existingCustomer?.phone ? ` (${posCustomerModal.duplicateWarning.existingCustomer.phone})` : ''}
                    </strong>
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        const ex = posCustomerModal.duplicateWarning?.existingCustomer;
                        if (ex) {
                          setSelectedCustomerId(ex.id);
                        }
                        setPosCustomerModal((prev) => ({ ...prev, open: false, duplicateWarning: null }));
                      }}
                      data-testid="link-existing-customer-btn"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-7 cursor-pointer"
                    >
                      ✓ Select Existing
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateCustomerFromPos(true)}
                      data-testid="force-create-customer-btn"
                      className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 font-semibold text-xs h-7 cursor-pointer"
                    >
                      Create Separate
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Kumar"
                  value={posCustomerModal.name}
                  onChange={(e) => setPosCustomerModal((prev) => ({ ...prev, name: e.target.value }))}
                  data-testid="pos-cust-name-input"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={posCustomerModal.phone}
                  onChange={(e) => setPosCustomerModal((prev) => ({ ...prev, phone: e.target.value }))}
                  data-testid="pos-cust-phone-input"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="27AABCK1234F1Z5"
                    value={posCustomerModal.gstin}
                    onChange={(e) => setPosCustomerModal((prev) => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                    data-testid="pos-cust-gstin-input"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono uppercase focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    step="500"
                    placeholder="0.00"
                    value={posCustomerModal.creditLimit}
                    onChange={(e) => setPosCustomerModal((prev) => ({ ...prev, creditLimit: e.target.value }))}
                    data-testid="pos-cust-limit-input"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="p-4 bg-slate-50 border-t border-slate-200 flex sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPosCustomerModal((prev) => ({ ...prev, open: false }))}
                className="flex-1 text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleCreateCustomerFromPos(false)}
                disabled={posCustomerModal.isSubmitting || !posCustomerModal.name.trim()}
                data-testid="save-pos-customer-btn"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
              >
                {posCustomerModal.isSubmitting ? 'Saving...' : 'Save & Link'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* =========================================================================
          RECENT BILLS & SALES HISTORY MODAL (F4)
          ========================================================================= */}
      <RecentBillsModal
        open={recentBillsOpen}
        onOpenChange={setRecentBillsOpen}
        tenantId={activeTenant?.tenantId || ''}
        branchId={activeBranch?.id}
        tenantName={activeTenant?.tenantName}
        customers={customers}
        branches={branches}
      />

      {/* Camera Barcode Scanner for POS Ring-up */}
      <CameraBarcodeModal
        open={cameraScannerOpen}
        onClose={() => setCameraScannerOpen(false)}
        onScan={async (scannedCode) => {
          await processBarcodeScan(scannedCode);
        }}
        title="Scan Item to Add to Bill"
        description="Point your device camera at the item's barcode to instantly ring it up."
      />
    </div>
  );
}
