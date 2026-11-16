'use client';

import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  TableStatus,
  KitchenStation,
  KotStatus,
  FoodDietaryType,
} from '@pos/shared-types';
import {
  RestaurantTable,
  RestaurantOrder,
  RestaurantKot,
  DispatchKotItemRequest,
  apiClient,
} from '@/lib/api-client';
import { SplitBillModal } from './split-bill-modal';
import { RestaurantDishModal } from './restaurant-dish-modal';
import { useRealtimeEvents } from '@/hooks/use-realtime-events';
import {
  Flame,
  UtensilsCrossed,
  Utensils,
  Clock,
  Users,
  Search,
  Plus,
  Minus,
  Trash2,
  ArrowRightLeft,
  Receipt,
  CheckCircle2,
  Printer,
  ChefHat,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface TableOrderDrawerProps {
  table: RestaurantTable | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefreshTable: () => void;
  allVacantTables?: RestaurantTable[];
}

interface DraftItem {
  itemKey?: string;
  productId: string;
  productName: string;
  variantName?: string;
  unitPrice: number;
  quantity: number;
  specialInstructions: string;
  kitchenStation: KitchenStation;
}

export function TableOrderDrawer({
  table,
  open,
  onOpenChange,
  onRefreshTable,
  allVacantTables = [],
}: TableOrderDrawerProps) {
  const [activeOrder, setActiveOrder] = useState<RestaurantOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vacant seating state
  const [guestCount, setGuestCount] = useState<number>(2);
  const [captainNotes, setCaptainNotes] = useState<string>('');

  // Products catalog
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDietary, setSelectedDietary] = useState<'all' | 'veg' | 'non_veg' | 'egg'>('all');
  const [variantDish, setVariantDish] = useState<any | null>(null);
  const [addDishModalOpen, setAddDishModalOpen] = useState(false);

  // Draft KOT items
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [isFiringKot, setIsFiringKot] = useState(false);

  // Transfer Table modal
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedTargetTableId, setSelectedTargetTableId] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Split bill settlement modal
  const [settleModalOpen, setSettleModalOpen] = useState(false);

  // Reload active order data (handles SSE real-time updates and manual refresh)
  const loadOrderData = React.useCallback(async () => {
    if (!open || !table) return;
    try {
      if (table.activeOrder?.id) {
        const orderRes = await apiClient.getRestaurantOrder(table.tenantId, table.activeOrder.id);
        setActiveOrder(orderRes);
      } else if (table.branchId) {
        try {
          const tables = await apiClient.getRestaurantTables(table.tenantId, table.branchId);
          const currentTable = tables.find((t) => t.id === table.id);
          if (currentTable?.activeOrder?.id) {
            const orderRes = await apiClient.getRestaurantOrder(table.tenantId, currentTable.activeOrder.id);
            setActiveOrder(orderRes);
            return;
          }
        } catch {
          // Ignore background table check errors
        }
        setActiveOrder(null);
      } else {
        setActiveOrder(null);
      }
    } catch (err: any) {
      console.warn('Could not load active order:', err);
      setActiveOrder(table.activeOrder || null);
    }
  }, [open, table]);

  // Load active order and products when drawer opens
  useEffect(() => {
    if (!open || !table) return;

    setError(null);
    setDraftItems([]);
    if (table.currentGuestCount && table.currentGuestCount > 0) {
      setGuestCount(table.currentGuestCount);
    }

    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [prodResult] = await Promise.allSettled([
          apiClient.getProducts(table.tenantId),
          loadOrderData(),
        ]);
        if (prodResult.status === 'fulfilled') {
          setProducts(prodResult.value || []);
        } else {
          console.warn('Could not load products:', prodResult.reason);
          setProducts([]);
        }
      } catch (err: any) {
        console.warn('Failed to load restaurant initial data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [open, table, loadOrderData]);

  // Listen to SSE real-time events while drawer is open
  useRealtimeEvents({
    tenantId: table?.tenantId,
    enabled: open,
    onRestaurantTableChanged: () => {
      loadOrderData();
      onRefreshTable();
    },
    pollIntervalMs: 10000,
  });

  // Categories extracted from products
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filtered products
  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery));
      const matchCategory =
        selectedCategory === 'all' || p.category === selectedCategory;
      const matchDietary =
        selectedDietary === 'all' ||
        (selectedDietary === 'veg' && (p.foodType === 'veg' || p.foodType === 'vegan')) ||
        (selectedDietary === 'non_veg' && p.foodType === 'non_veg') ||
        (selectedDietary === 'egg' && p.foodType === 'egg');
      return matchSearch && matchCategory && matchDietary;
    });
  }, [products, searchQuery, selectedCategory, selectedDietary]);

  // Handle Seating new guests at vacant table
  const handleSeatGuests = async () => {
    if (!table) return;
    setLoading(true);
    setError(null);
    try {
      const newOrder = await apiClient.createRestaurantOrder(table.tenantId, table.branchId, {
        tableId: table.id,
        guestCount,
        notes: captainNotes || undefined,
      });
      setActiveOrder(newOrder);
      onRefreshTable();
    } catch (err: any) {
      setError(err?.message || 'Failed to seat guests at table.');
    } finally {
      setLoading(false);
    }
  };

  // Add Product to draft KOT
  const handleAddProductToDraft = (product: any) => {
    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      setVariantDish(product);
      return;
    }

    const resolvedStation = product.kitchenStation || KitchenStation.MAIN_KITCHEN;
    const existingIndex = draftItems.findIndex((i) => i.productId === product.id && !i.itemKey);
    if (existingIndex >= 0) {
      const updated = [...draftItems];
      updated[existingIndex].quantity += 1;
      setDraftItems(updated);
    } else {
      setDraftItems([
        ...draftItems,
        {
          productId: product.id,
          productName: product.name,
          unitPrice: parseFloat(product.sellingPrice || product.retailPrice || '0'),
          quantity: 1,
          specialInstructions: '',
          kitchenStation: resolvedStation,
        },
      ]);
    }
  };

  // Add specific variant/portion to draft KOT
  const handleConfirmAddVariant = (product: any, variant: { name: string; price: number | string }) => {
    const itemKey = `${product.id}__${variant.name}`;
    const displayName = `${product.name} (${variant.name})`;
    const price = typeof variant.price === 'number' ? variant.price : parseFloat(variant.price || '0');
    const resolvedStation = product.kitchenStation || KitchenStation.MAIN_KITCHEN;

    const existingIndex = draftItems.findIndex((i) => i.itemKey === itemKey);
    if (existingIndex >= 0) {
      const updated = [...draftItems];
      updated[existingIndex].quantity += 1;
      setDraftItems(updated);
    } else {
      setDraftItems([
        ...draftItems,
        {
          itemKey,
          productId: product.id,
          productName: displayName,
          variantName: variant.name,
          unitPrice: price,
          quantity: 1,
          specialInstructions: '',
          kitchenStation: resolvedStation,
        },
      ]);
    }
    setVariantDish(null);
  };

  const handleUpdateDraftQuantity = (key: string, delta: number) => {
    setDraftItems((prev) =>
      prev
        .map((item) => {
          const itemIdentifier = item.itemKey || item.productId;
          if (itemIdentifier === key) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as DraftItem[],
    );
  };

  const handleUpdateDraftInstructions = (key: string, instructions: string) => {
    setDraftItems((prev) =>
      prev.map((item) =>
        (item.itemKey || item.productId) === key ? { ...item, specialInstructions: instructions } : item,
      ),
    );
  };

  const handleUpdateDraftStation = (key: string, station: KitchenStation) => {
    setDraftItems((prev) =>
      prev.map((item) =>
        (item.itemKey || item.productId) === key ? { ...item, kitchenStation: station } : item,
      ),
    );
  };

  // Fire KOT to Kitchen
  const handleFireKot = async () => {
    if (!table || draftItems.length === 0) return;
    setIsFiringKot(true);
    setError(null);
    try {
      let orderId = activeOrder?.id;
      if (!orderId) {
        // Automatically seat and open order if table doesn't have an active order yet
        const newOrder = await apiClient.createRestaurantOrder(table.tenantId, table.branchId, {
          tableId: table.id,
          guestCount,
          notes: captainNotes || undefined,
        });
        orderId = newOrder.id;
        setActiveOrder(newOrder);
      }

      const items: DispatchKotItemRequest[] = draftItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        variantName: (item as any).variantName,
        unitPrice: item.unitPrice ? item.unitPrice.toFixed(2) : undefined,
        quantity: item.quantity.toString(),
        specialInstructions: item.specialInstructions || undefined,
        kitchenStation: item.kitchenStation,
      }));

      await apiClient.dispatchRestaurantKot(table.tenantId, table.branchId, {
        orderId,
        items,
      });

      // Clear draft
      setDraftItems([]);

      // Reload fresh order details
      const refreshedOrder = await apiClient.getRestaurantOrder(table.tenantId, orderId);
      setActiveOrder(refreshedOrder);
      onRefreshTable();
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch KOT ticket to kitchen.');
    } finally {
      setIsFiringKot(false);
    }
  };

  // Transfer Table
  const handleTransfer = async () => {
    if (!table || !selectedTargetTableId) return;
    setIsTransferring(true);
    setError(null);
    try {
      await apiClient.transferRestaurantTable(
        table.tenantId,
        table.branchId,
        table.id,
        selectedTargetTableId,
      );
      setTransferModalOpen(false);
      onRefreshTable();
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to transfer table.');
    } finally {
      setIsTransferring(false);
    }
  };

  // Print KOT
  const handlePrintKot = (kot: RestaurantKot) => {
    const printWindow = window.open('', '_blank', 'width=380,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>KOT - ${kot.kotNumber}</title>
          <style>
            body { font-family: monospace; font-size: 13px; padding: 12px; margin: 0; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
            .title { font-size: 18px; font-weight: bold; }
            .meta { font-size: 12px; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th { text-align: left; border-bottom: 1px solid #000; padding: 4px 0; }
            td { padding: 5px 0; vertical-align: top; }
            .qty { font-size: 16px; font-weight: bold; width: 40px; }
            .notes { font-size: 11px; font-style: italic; color: #333; }
            .footer { border-top: 2px dashed #000; margin-top: 12px; padding-top: 8px; text-align: center; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">*** KITCHEN ORDER TICKET ***</div>
            <div class="meta"><strong>TABLE: ${kot.tableNumber}</strong> | ${kot.kotNumber}</div>
            <div class="meta">Station: ${kot.kitchenStation} | Captain: ${kot.captainName || 'Staff'}</div>
            <div class="meta">Time: ${new Date(kot.dispatchedAt).toLocaleTimeString()}</div>
          </div>
          <table>
            <thead><tr><th>QTY</th><th>ITEM & INSTRUCTIONS</th></tr></thead>
            <tbody>
              ${(kot.lines || [])
                .map(
                  (l) => `
                <tr>
                  <td class="qty">${parseFloat(l.quantity).toFixed(0)}</td>
                  <td>
                    <strong>${l.productNameSnapshot}</strong>
                    ${l.specialInstructions ? `<div class="notes">Note: ${l.specialInstructions}</div>` : ''}
                  </td>
                </tr>`,
                )
                .join('')}
            </tbody>
          </table>
          <div class="footer">Please dispatch immediately upon preparation</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // Print Customer Bill & update table status to BILLED
  const handlePrintBill = async () => {
    if (!table || !activeOrder) return;

    // 1. Mark table as BILLED on server so floorplan and mobile update via SSE
    try {
      await apiClient.updateRestaurantTable(table.tenantId, table.branchId, table.id, {
        status: TableStatus.BILLED,
      });
      onRefreshTable();
    } catch (_) {}

    // 2. Open printable receipt window
    const printWindow = window.open('', '_blank', 'width=380,height=600');
    if (!printWindow) return;

    const subtotal = parseFloat(activeOrder.subtotal || '0');
    const taxTotal = parseFloat(activeOrder.taxTotal || '0');
    const cgst = taxTotal / 2;
    const sgst = taxTotal / 2;
    const grandTotal = parseFloat(activeOrder.grandTotal || '0');

    // Aggregate line items from order lines or kots
    const lines = activeOrder.lines || [];

    printWindow.document.write(`
      <html>
        <head>
          <title>Bill - ${table.tableNumber}</title>
          <style>
            body { font-family: monospace; font-size: 13px; padding: 12px; margin: 0; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
            .title { font-size: 16px; font-weight: bold; }
            .subtitle { font-size: 12px; margin-top: 2px; }
            .meta { font-size: 11px; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th { text-align: left; border-bottom: 1px solid #000; padding: 4px 0; font-size: 11px; }
            td { padding: 4px 0; vertical-align: top; font-size: 12px; }
            .qty { width: 30px; font-weight: bold; }
            .price { text-align: right; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .totals-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px; }
            .grand-total { display: flex; justify-content: space-between; font-size: 15px; font-weight: bold; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 6px 0; margin-top: 6px; }
            .footer { margin-top: 12px; padding-top: 8px; text-align: center; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">*** RESTAURANT DINE-IN BILL ***</div>
            <div class="subtitle">Table: ${table.tableNumber} (${table.section})</div>
            <div class="meta">Order: ${activeOrder.orderNumber} | Guests: ${activeOrder.guestCount} Pax</div>
            <div class="meta">Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th class="qty">QTY</th>
                <th>ITEM</th>
                <th class="price">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${lines
                .map(
                  (l) => `
                <tr>
                  <td class="qty">${parseFloat(l.quantity).toFixed(0)}</td>
                  <td>${l.productNameSnapshot}</td>
                  <td class="price">₹${parseFloat(l.lineTotal).toFixed(2)}</td>
                </tr>`,
                )
                .join('')}
            </tbody>
          </table>
          <div class="divider"></div>
          <div class="totals-row">
            <span>Subtotal:</span>
            <span>₹${subtotal.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>CGST (2.5%):</span>
            <span>₹${cgst.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>SGST (2.5%):</span>
            <span>₹${sgst.toFixed(2)}</span>
          </div>
          <div class="grand-total">
            <span>GRAND TOTAL:</span>
            <span>₹${grandTotal.toFixed(2)}</span>
          </div>
          <div class="footer">
            <p>Scan UPI QR to pay or pay at cashier</p>
            <p>Thank you for dining with us! Please visit again.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  if (!table) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-5xl lg:max-w-6xl p-0 flex flex-col h-full bg-slate-50 border-l shadow-2xl">
          {/* Header */}
          <div className="bg-white border-b px-6 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shrink-0 shadow-sm border border-slate-700">
                {table.tableNumber}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-black text-slate-900 truncate tracking-tight">
                    {table.tableName || `Table ${table.tableNumber}`}
                  </h2>
                  <Badge variant="outline" className="text-xs font-semibold shrink-0 bg-slate-50">
                    {table.section}
                  </Badge>
                  <Badge
                    className={`text-xs uppercase font-bold shrink-0 ${
                      table.status === TableStatus.VACANT
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : table.status === TableStatus.SEATED
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : table.status === TableStatus.ORDERED
                        ? 'bg-sky-100 text-sky-800 border-sky-200'
                        : 'bg-purple-100 text-purple-800 border-purple-200'
                    }`}
                  >
                    {table.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 truncate">
                  <span className="flex items-center gap-1 shrink-0 font-medium">
                    <Users className="w-3.5 h-3.5 text-slate-400" /> Max Cap: {table.seatingCapacity}
                  </span>
                  {activeOrder && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="truncate font-mono font-medium text-slate-600">
                        Order #{activeOrder.orderNumber}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1 shrink-0 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />{' '}
                        {new Date(activeOrder.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Actions / Header Right: 1-Click Pax Pills & Actions */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* 1-Click Pax Selector */}
              <div className="flex items-center gap-1.5 bg-slate-100/80 rounded-xl p-1 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 pl-1.5 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" /> Pax:
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 6].map((pax) => (
                    <button
                      key={pax}
                      type="button"
                      onClick={() => setGuestCount(pax)}
                      className={`w-6 h-6 rounded-lg text-xs font-bold transition-all ${
                        guestCount === pax
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200/60'
                      }`}
                    >
                      {pax}
                    </button>
                  ))}
                  <div className="flex items-center pl-0.5 border-l border-slate-200 ml-0.5">
                    <button
                      type="button"
                      onClick={() => setGuestCount((prev) => Math.max(1, prev - 1))}
                      className="w-5 h-6 flex items-center justify-center text-xs font-bold text-slate-500 hover:text-slate-900"
                    >
                      -
                    </button>
                    <span className="w-4 text-center text-xs font-black text-slate-900">{guestCount}</span>
                    <button
                      type="button"
                      onClick={() => setGuestCount((prev) => prev + 1)}
                      className="w-5 h-6 flex items-center justify-center text-xs font-bold text-slate-500 hover:text-slate-900"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {activeOrder && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setTransferModalOpen(true)}
                    className="gap-1.5 text-xs text-slate-700 h-8 rounded-lg border-slate-200 hover:bg-slate-100"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setSettleModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 text-xs h-8 rounded-lg whitespace-nowrap shadow-xs"
                  >
                    <Receipt className="w-3.5 h-3.5" /> Settle
                  </Button>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-xs px-6 py-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-amber-700 hover:text-amber-950 font-bold p-1 rounded"
              >
                ✕
              </button>
            </div>
          )}

          {/* Body Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Direct Dual-Pane Menu & Order Sheet */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Pane: Menu Catalog (58% width for comfortable reading and spacious cards) */}
                <div className="w-[58%] border-r bg-white flex flex-col">
                  {/* Menu Search & Categories */}
                  <div className="p-3.5 border-b space-y-2.5 bg-slate-50/70">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <Input
                        placeholder="Search dishes by name, category or scan barcode..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-8 h-9 text-xs bg-white rounded-xl border-slate-200 focus:border-emerald-500 shadow-2xs"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-700 w-4 h-4 flex items-center justify-center font-bold"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Course Categories with Visual Emojis */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none items-center">
                      <button
                        type="button"
                        onClick={() => setSelectedCategory('all')}
                        className={`px-3 py-1.5 text-xs rounded-xl whitespace-nowrap font-bold transition-all shadow-2xs ${
                          selectedCategory === 'all'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        All Courses
                      </button>
                      {categories.map((cat) => {
                        const icon =
                          cat.toLowerCase().includes('starter') || cat.toLowerCase().includes('appetizer')
                            ? '🥟'
                            : cat.toLowerCase().includes('main')
                            ? '🍛'
                            : cat.toLowerCase().includes('bread') || cat.toLowerCase().includes('roti') || cat.toLowerCase().includes('rice')
                            ? '🍚'
                            : cat.toLowerCase().includes('dessert') || cat.toLowerCase().includes('sweet')
                            ? '🍰'
                            : cat.toLowerCase().includes('drink') || cat.toLowerCase().includes('beverage') || cat.toLowerCase().includes('bar')
                            ? '🥤'
                            : '🍽️';
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 text-xs rounded-xl whitespace-nowrap font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                              selectedCategory === cat
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <span>{icon}</span>
                            <span>{cat}</span>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setAddDishModalOpen(true)}
                        className="px-3 py-1.5 text-xs rounded-xl whitespace-nowrap font-black bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100/80 flex items-center gap-1 shrink-0 ml-auto shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add Dish
                      </button>
                    </div>

                    {/* Quick FSSAI Dietary Segmented Filter */}
                    <div className="flex gap-1.5 items-center pt-1.5 border-t border-slate-200/80">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1 shrink-0">Diet:</span>
                      <button
                        type="button"
                        onClick={() => setSelectedDietary('all')}
                        className={`px-3 py-1 text-xs rounded-lg transition-all font-bold shrink-0 ${
                          selectedDietary === 'all'
                            ? 'bg-slate-800 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedDietary('veg')}
                        className={`px-3 py-1 text-xs rounded-lg transition-all flex items-center gap-1.5 font-bold shrink-0 ${
                          selectedDietary === 'veg'
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-emerald-50/70 border border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block border border-white" />
                        Pure Veg
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedDietary('non_veg')}
                        className={`px-3 py-1 text-xs rounded-lg transition-all flex items-center gap-1.5 font-bold shrink-0 ${
                          selectedDietary === 'non_veg'
                            ? 'bg-rose-600 text-white shadow-2xs'
                            : 'bg-rose-50/70 border border-rose-200 text-rose-800 hover:bg-rose-100'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-500 inline-block border border-white" />
                        Non-Veg
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedDietary('egg')}
                        className={`px-3 py-1 text-xs rounded-lg transition-all flex items-center gap-1.5 font-bold shrink-0 ${
                          selectedDietary === 'egg'
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'bg-amber-50/70 border border-amber-200 text-amber-800 hover:bg-amber-100'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block border border-white" />
                        Egg
                      </button>
                    </div>
                  </div>

                  {/* Menu Product Grid with Spacious Cards & Engaging Empty State */}
                  <div className="flex-1 overflow-y-auto p-3.5">
                    {filteredProducts.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50/60 rounded-2xl border-2 border-dashed border-slate-200">
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 shadow-xs">
                          <UtensilsCrossed className="w-8 h-8" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">No dishes found in menu</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-xs mb-4">
                          {searchQuery
                            ? `No items matching "${searchQuery}". Try clearing search.`
                            : 'Add your popular appetizers, curries, and drinks to build the digital menu.'}
                        </p>
                        <Button
                          size="sm"
                          onClick={() => setAddDishModalOpen(true)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 rounded-xl shadow-xs"
                        >
                          <Plus className="w-4 h-4" /> Add First Dish
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2.5 content-start">
                        {filteredProducts.map((p) => {
                          const isSoldOut = p.isAvailable === false;
                          const inDraft = draftItems.find((i) => i.productId === p.id);
                          const hasVariants = p.variants && Array.isArray(p.variants) && p.variants.length > 0;
                          return (
                            <div
                              key={p.id}
                              onClick={() => !isSoldOut && handleAddProductToDraft(p)}
                              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between relative select-none group shadow-2xs ${
                                isSoldOut
                                  ? 'border-slate-200 bg-slate-50/80 opacity-60 cursor-not-allowed'
                                  : inDraft
                                  ? 'border-emerald-500 bg-emerald-50/20 cursor-pointer shadow-xs hover:border-emerald-600'
                                  : 'bg-white border-slate-200/90 hover:border-slate-400 cursor-pointer hover:shadow-xs'
                              }`}
                            >
                              {inDraft && (
                                <span className="absolute top-2.5 right-2.5 w-5 h-5 bg-emerald-600 text-white text-[11px] font-black rounded-full flex items-center justify-center shadow-xs">
                                  {inDraft.quantity}
                                </span>
                              )}
                              <div>
                                <div className="flex items-start gap-2 mb-1.5">
                                  {p.foodType === 'non_veg' ? (
                                    <span
                                      className="w-4 h-4 rounded border-2 border-rose-600 flex items-center justify-center shrink-0 bg-white mt-0.5"
                                      title="Non-Veg"
                                    >
                                      <span className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-rose-600" />
                                    </span>
                                  ) : p.foodType === 'egg' ? (
                                    <span
                                      className="w-4 h-4 rounded border-2 border-amber-500 flex items-center justify-center shrink-0 bg-white mt-0.5"
                                      title="Egg"
                                    >
                                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    </span>
                                  ) : (
                                    <span
                                      className="w-4 h-4 rounded border-2 border-emerald-600 flex items-center justify-center shrink-0 bg-white mt-0.5"
                                      title="Pure Veg"
                                    >
                                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                                    </span>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">
                                      {p.name}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {p.category || 'Kitchen'}
                                  </span>
                                  {p.prepTimeMinutes && (
                                    <span className="text-[9px] font-medium text-slate-400 flex items-center gap-0.5">
                                      <Clock className="w-2.5 h-2.5" /> {p.prepTimeMinutes}m
                                    </span>
                                  )}
                                  {p.kitchenStation && p.kitchenStation !== 'main_kitchen' && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800">
                                      {p.kitchenStation === 'tandoor'
                                        ? 'Tandoor'
                                        : p.kitchenStation === 'beverage_bar'
                                        ? 'Bar'
                                        : 'Bakery'}
                                    </span>
                                  )}
                                  {hasVariants && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-sky-100 text-sky-800">
                                      {p.variants.length} portions
                                    </span>
                                  )}
                                  {isSoldOut && (
                                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-700 uppercase">
                                      Sold Out
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                                <span className="font-black text-sm text-slate-900 font-mono">
                                  ₹{parseFloat(p.sellingPrice || p.retailPrice || '0').toFixed(2)}
                                </span>
                                {isSoldOut ? (
                                  <span className="text-[10px] text-rose-600 font-bold">86&apos;d</span>
                                ) : (
                                  <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-emerald-100 transition-colors">
                                    <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add
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

                {/* Right Pane: Draft KOT Cart & Active KOT History (42% width) */}
                <div className="w-[42%] flex flex-col bg-slate-50 border-l border-slate-200">
                  <Tabs defaultValue="draft" className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-4 pt-2.5 bg-white border-b border-slate-200 shadow-2xs">
                      <TabsList className="grid grid-cols-2 w-full h-9 p-1 bg-slate-100 rounded-xl">
                        <TabsTrigger value="draft" className="text-xs font-bold gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          Draft KOT {draftItems.length > 0 && `(${draftItems.length})`}
                        </TabsTrigger>
                        <TabsTrigger value="history" className="text-xs font-bold gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                          <ChefHat className="w-3.5 h-3.5 text-sky-500" />
                          Dispatched KOTs ({activeOrder?.kots?.length || 0})
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    {/* Tab 1: Draft KOT */}
                    <TabsContent value="draft" className="flex-1 flex flex-col m-0 p-0 overflow-hidden">
                      <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
                        {draftItems.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6">
                            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-3">
                              <Flame className="w-7 h-7" />
                            </div>
                            <p className="text-xs font-bold text-slate-700">Draft KOT is empty</p>
                            <p className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
                              Tap dishes from the menu on the left to fire them directly to the kitchen.
                            </p>
                          </div>
                        ) : (
                          draftItems.map((item) => {
                            const itemIdentifier = item.itemKey || item.productId;
                            return (
                              <div key={itemIdentifier} className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5 hover:border-slate-300 transition-all">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <h4 className="font-bold text-xs text-slate-900 leading-tight">
                                      {item.productName}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                      ₹{item.unitPrice.toFixed(2)} each
                                    </p>
                                  </div>
                                  <div className="font-black text-sm text-slate-900 font-mono">
                                    ₹{(item.unitPrice * item.quantity).toFixed(2)}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateDraftQuantity(itemIdentifier, -1)}
                                      className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 rounded-lg transition-all"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="w-8 text-center font-black text-xs text-slate-900 font-mono">{item.quantity}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateDraftQuantity(itemIdentifier, 1)}
                                      className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 rounded-lg transition-all"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>

                                  <Select
                                    value={item.kitchenStation}
                                    onValueChange={(val) => handleUpdateDraftStation(itemIdentifier, val as KitchenStation)}
                                  >
                                    <SelectTrigger className="h-7 text-[11px] min-w-[125px] w-auto px-2.5 bg-slate-50 border-slate-200 rounded-lg font-medium">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value={KitchenStation.MAIN_KITCHEN}>Main Kitchen</SelectItem>
                                      <SelectItem value={KitchenStation.BEVERAGE_BAR}>Bar / Drinks</SelectItem>
                                      <SelectItem value={KitchenStation.TANDOOR}>Tandoor & Grill</SelectItem>
                                      <SelectItem value={KitchenStation.BAKERY_DESSERT}>Bakery & Dessert</SelectItem>
                                    </SelectContent>
                                  </Select>

                                  <button
                                    type="button"
                                    onClick={() => handleUpdateDraftQuantity(itemIdentifier, -item.quantity)}
                                    className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors"
                                    title="Remove item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <Input
                                  placeholder="Kitchen instruction (e.g. less spicy, no onion)"
                                  value={item.specialInstructions}
                                  onChange={(e) => handleUpdateDraftInstructions(itemIdentifier, e.target.value)}
                                  className="h-7 text-[11px] bg-slate-50 border-slate-200 rounded-lg placeholder:italic"
                                />
                              </div>
                            );
                          })
                        )}
                      </div>
                    </TabsContent>

                    {/* Tab 2: Dispatched KOTs */}
                    <TabsContent value="history" className="flex-1 flex flex-col m-0 p-0 overflow-y-auto">
                      <div className="p-3.5 space-y-3">
                        {(!activeOrder?.kots || activeOrder.kots.length === 0) ? (
                          <div className="text-center p-8 text-slate-400 text-xs">
                            <ChefHat className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            No KOT tickets dispatched yet.
                          </div>
                        ) : (
                          activeOrder.kots.map((kot) => (
                            <div key={kot.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5 text-xs">
                              <div className="flex items-center justify-between border-b pb-2">
                                <div>
                                  <span className="font-black text-slate-900 font-mono">{kot.kotNumber}</span>
                                  <span className="text-[10px] text-slate-400 ml-2">
                                    {new Date(kot.dispatchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Badge
                                    className={`text-[10px] uppercase font-black px-2 py-0.5 ${
                                      kot.status === KotStatus.READY
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                        : kot.status === KotStatus.PREPARING
                                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                                        : kot.status === KotStatus.SERVED
                                        ? 'bg-slate-100 text-slate-700 border-slate-200'
                                        : 'bg-sky-100 text-sky-800 border-sky-200'
                                    }`}
                                  >
                                    {kot.status}
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                                    onClick={() => handlePrintKot(kot)}
                                    title="Print KOT Slip"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-1.5 pt-0.5">
                                {kot.lines?.map((line) => (
                                  <div key={line.id} className="flex justify-between items-start text-[11px]">
                                    <div>
                                      <span className="font-black text-slate-900 font-mono">{parseFloat(line.quantity).toFixed(0)}x</span>{' '}
                                      <span className="font-medium text-slate-800">{line.productNameSnapshot}</span>
                                      {line.specialInstructions && (
                                        <p className="text-[10px] text-amber-700 font-medium italic mt-0.5">
                                          Note: {line.specialInstructions}
                                        </p>
                                      )}
                                    </div>
                                    <span className="font-mono text-slate-600 font-bold">
                                      ₹{parseFloat(line.lineTotal).toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Running Bill Totals & Tax Breakdown */}
                  <div className="bg-slate-900 text-white p-3.5 space-y-1.5 border-t border-slate-800">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Subtotal</span>
                      <span className="font-mono">₹{parseFloat(activeOrder?.subtotal || '0').toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>GST (5% Restaurant)</span>
                      <span className="font-mono">₹{parseFloat(activeOrder?.taxTotal || '0').toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-black text-base text-emerald-400 border-t border-slate-800/80 pt-1.5 mt-1">
                      <span>Grand Total</span>
                      <span className="font-mono text-lg">₹{parseFloat(activeOrder?.grandTotal || '0').toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Dynamic Action Bar */}
                  <div className="p-3.5 bg-white border-t border-slate-200">
                    {draftItems.length > 0 ? (
                      <Button
                        onClick={handleFireKot}
                        disabled={isFiringKot}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm h-11 rounded-xl gap-2 shadow-xs transition-all"
                      >
                        <Flame className="w-4 h-4 fill-white" />
                        {isFiringKot ? 'Sending to Kitchen...' : `🔥 Send KOT to Kitchen (${draftItems.length} items)`}
                      </Button>
                    ) : (activeOrder?.kots?.length || 0) > 0 ? (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (activeOrder?.kots && activeOrder.kots.length > 0) {
                              handlePrintKot(activeOrder.kots[activeOrder.kots.length - 1]);
                            }
                          }}
                          className="flex-1 text-xs font-bold gap-1.5 h-11 rounded-xl border-slate-300 hover:bg-slate-50"
                          title="Print latest KOT slip"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600" /> KOT Slip
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handlePrintBill}
                          className="flex-1 text-xs font-bold gap-1.5 h-11 rounded-xl border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                          title="Print Customer Bill Receipt"
                        >
                          <Receipt className="w-3.5 h-3.5 text-emerald-700" /> Print Bill
                        </Button>
                        <Button
                          onClick={() => setSettleModalOpen(true)}
                          className="flex-[1.5] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-11 rounded-xl gap-1.5 shadow-xs"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Settle (₹{parseFloat(activeOrder?.grandTotal || '0').toFixed(2)})
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 text-center">
                        <p className="text-xs font-bold text-emerald-900 flex items-center justify-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          Ready for Ordering
                        </p>
                        <p className="text-[11px] text-emerald-700/80 mt-0.5">
                          Tap dishes from the menu on the left to fire a KOT to the kitchen.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
        </SheetContent>
      </Sheet>

      {/* Transfer Table Dialog */}
      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <ArrowRightLeft className="w-4 h-4 text-sky-600" />
              Transfer Order from Table {table.tableNumber}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label className="text-xs font-semibold text-slate-700">Select Vacant Target Table</Label>
            {allVacantTables.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No other tables are currently vacant.</p>
            ) : (
              <Select value={selectedTargetTableId} onValueChange={setSelectedTargetTableId}>
                <SelectTrigger className="text-xs bg-white">
                  <SelectValue placeholder="Choose target table..." />
                </SelectTrigger>
                <SelectContent>
                  {allVacantTables
                    .filter((t) => t.id !== table.id)
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.tableNumber} ({t.section}) - Cap: {t.seatingCapacity}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={!selectedTargetTableId || isTransferring}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs"
            >
              {isTransferring ? 'Moving...' : 'Confirm Transfer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settlement Modal */}
      {activeOrder && (
        <SplitBillModal
          order={activeOrder}
          open={settleModalOpen}
          onOpenChange={setSettleModalOpen}
          onSettlementSuccess={() => {
            setSettleModalOpen(false);
            onRefreshTable();
            onOpenChange(false);
          }}
        />
      )}

      {/* Quick Add Restaurant Dish Modal */}
      <RestaurantDishModal
        open={addDishModalOpen}
        onOpenChange={setAddDishModalOpen}
        tenantId={table?.tenantId}
        onSuccess={async () => {
          if (table?.tenantId) {
            try {
              const res = await apiClient.getProducts(table.tenantId);
              setProducts(res || []);
            } catch (e) {
              console.error(e);
            }
          }
        }}
      />

      {/* Portion / Variant Selection Modal */}
      <Dialog open={variantDish !== null} onOpenChange={(isOpen) => !isOpen && setVariantDish(null)}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-amber-600" />
              Select Portion for {variantDish?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-2">
            <p className="text-xs text-slate-500 mb-2">
              Choose the portion size to add to the table order:
            </p>

            <div className="grid grid-cols-1 gap-2">
              {variantDish?.variants?.map((v: any, idx: number) => {
                const price = typeof v.price === 'number' ? v.price : parseFloat(v.price || '0');
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleConfirmAddVariant(variantDish, v)}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 text-left transition-all group"
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-900 group-hover:text-amber-800">
                        {v.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {variantDish.category || 'Dishes'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-slate-900">
                        ₹{price.toFixed(2)}
                      </span>
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                        <Plus className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setVariantDish(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
