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
} from 'lucide-react';

interface TableOrderDrawerProps {
  table: RestaurantTable | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefreshTable: () => void;
  allVacantTables?: RestaurantTable[];
}

interface DraftItem {
  productId: string;
  productName: string;
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
      } else {
        // Query server tables to check if an order was just created by mobile
        const tables = await apiClient.getRestaurantTables(table.tenantId, table.branchId);
        const currentTable = tables.find((t) => t.id === table.id);
        if (currentTable?.activeOrder?.id) {
          const orderRes = await apiClient.getRestaurantOrder(table.tenantId, currentTable.activeOrder.id);
          setActiveOrder(orderRes);
        } else {
          setActiveOrder(null);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load restaurant data.');
    }
  }, [open, table]);

  // Load active order and products when drawer opens
  useEffect(() => {
    if (!open || !table) return;

    setError(null);
    setDraftItems([]);

    const loadInitialData = async () => {
      setLoading(true);
      try {
        const prodRes = await apiClient.getProducts(table.tenantId);
        setProducts(prodRes || []);
        await loadOrderData();
      } catch (err: any) {
        setError(err?.message || 'Failed to load restaurant data.');
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
      return matchSearch && matchCategory;
    });
  }, [products, searchQuery, selectedCategory]);

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
    const existingIndex = draftItems.findIndex((i) => i.productId === product.id);
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
          kitchenStation: KitchenStation.MAIN_KITCHEN,
        },
      ]);
    }
  };

  const handleUpdateDraftQuantity = (productId: string, delta: number) => {
    setDraftItems((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as DraftItem[],
    );
  };

  const handleUpdateDraftInstructions = (productId: string, instructions: string) => {
    setDraftItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, specialInstructions: instructions } : item,
      ),
    );
  };

  const handleUpdateDraftStation = (productId: string, station: KitchenStation) => {
    setDraftItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, kitchenStation: station } : item,
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
        <SheetContent side="right" className="w-full sm:max-w-4xl p-0 flex flex-col h-full bg-slate-50">
          {/* Header */}
          <div className="bg-white border-b px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-lg shrink-0">
                {table.tableNumber}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-black text-slate-900 truncate">{table.tableName || `Table ${table.tableNumber}`}</h2>
                  <Badge variant="outline" className="text-xs font-semibold shrink-0">
                    {table.section}
                  </Badge>
                  <Badge
                    className={`text-xs uppercase font-bold shrink-0 ${
                      table.status === TableStatus.VACANT
                        ? 'bg-emerald-100 text-emerald-800'
                        : table.status === TableStatus.SEATED
                        ? 'bg-amber-100 text-amber-800'
                        : table.status === TableStatus.ORDERED
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {table.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 truncate">
                  <span className="flex items-center gap-1 shrink-0">
                    <Users className="w-3.5 h-3.5" /> Cap: {table.seatingCapacity}
                  </span>
                  {activeOrder && (
                    <>
                      <span>•</span>
                      <span className="truncate">Order #{activeOrder.orderNumber}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Clock className="w-3.5 h-3.5" />{' '}
                        {new Date(activeOrder.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Actions / Header Right */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 border border-slate-200">
                <Users className="w-3.5 h-3.5 text-slate-500 ml-1" />
                <span className="text-[11px] font-bold text-slate-600">Pax:</span>
                <button
                  type="button"
                  onClick={() => setGuestCount((prev) => Math.max(1, prev - 1))}
                  className="w-5 h-5 flex items-center justify-center bg-white rounded border border-slate-200 text-xs font-black text-slate-700 hover:bg-slate-50"
                >
                  -
                </button>
                <span className="w-4 text-center text-xs font-black text-slate-900">{guestCount}</span>
                <button
                  type="button"
                  onClick={() => setGuestCount((prev) => prev + 1)}
                  className="w-5 h-5 flex items-center justify-center bg-white rounded border border-slate-200 text-xs font-black text-slate-700 hover:bg-slate-50"
                >
                  +
                </button>
              </div>

              {activeOrder && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setTransferModalOpen(true)}
                    className="gap-1.5 text-xs text-slate-700 h-8"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setSettleModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 text-xs h-8 whitespace-nowrap"
                  >
                    <Receipt className="w-3.5 h-3.5" /> Bill
                  </Button>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-b border-red-200 text-red-800 text-xs px-6 py-2.5 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Body Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Direct Dual-Pane Menu & Order Sheet */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Pane: Menu Catalog */}
                <div className="w-1/2 border-r bg-white flex flex-col">
                  {/* Menu Search & Categories */}
                  <div className="p-3 border-b space-y-2 bg-slate-50/50">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <Input
                        placeholder="Search menu items or scan barcode..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 text-xs bg-white"
                      />
                    </div>

                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none items-center">
                      <button
                        type="button"
                        onClick={() => setSelectedCategory('all')}
                        className={`px-3 py-1 text-xs rounded-full whitespace-nowrap font-medium transition-all ${
                          selectedCategory === 'all'
                            ? 'bg-slate-900 text-white font-bold'
                            : 'bg-white border text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        All Items
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-1 text-xs rounded-full whitespace-nowrap font-medium transition-all ${
                            selectedCategory === cat
                              ? 'bg-slate-900 text-white font-bold'
                              : 'bg-white border text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setAddDishModalOpen(true)}
                        className="px-2.5 py-1 text-xs rounded-full whitespace-nowrap font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 flex items-center gap-1 shrink-0 ml-auto"
                      >
                        <Plus className="w-3 h-3 stroke-[3]" /> Add Dish
                      </button>
                    </div>
                  </div>

                  {/* Menu Product Grid */}
                  <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2 content-start">
                    {filteredProducts.map((p) => {
                      const isSoldOut = p.isAvailable === false;
                      const inDraft = draftItems.find((i) => i.productId === p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => !isSoldOut && handleAddProductToDraft(p)}
                          className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between relative select-none ${
                            isSoldOut
                              ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                              : inDraft
                              ? 'border-emerald-500 bg-emerald-50/30 cursor-pointer hover:border-slate-400'
                              : 'bg-white cursor-pointer hover:border-slate-400'
                          }`}
                        >
                          {inDraft && (
                            <span className="absolute top-2 right-2 w-5 h-5 bg-emerald-600 text-white text-[11px] font-black rounded-full flex items-center justify-center">
                              {inDraft.quantity}
                            </span>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              {p.foodType === 'non_veg' ? (
                                <span
                                  className="w-3.5 h-3.5 rounded border border-rose-600 flex items-center justify-center shrink-0 bg-white"
                                  title="Non-Veg"
                                >
                                  <span className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-rose-600" />
                                </span>
                              ) : p.foodType === 'egg' ? (
                                <span
                                  className="w-3.5 h-3.5 rounded border border-amber-500 flex items-center justify-center shrink-0 bg-white"
                                  title="Egg"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                </span>
                              ) : (
                                <span
                                  className="w-3.5 h-3.5 rounded border border-emerald-600 flex items-center justify-center shrink-0 bg-white"
                                  title="Pure Veg"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                </span>
                              )}
                              <p className="font-bold text-xs text-slate-900 leading-tight truncate">
                                {p.name}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-[10px] text-slate-400">
                                {p.category || 'Kitchen'}
                              </span>
                              {p.kitchenStation && p.kitchenStation !== 'main_kitchen' && (
                                <span className="text-[9px] font-bold px-1 rounded bg-amber-100 text-amber-800">
                                  {p.kitchenStation === 'tandoor'
                                    ? 'Tandoor'
                                    : p.kitchenStation === 'beverage_bar'
                                    ? 'Bar'
                                    : 'Bakery'}
                                </span>
                              )}
                              {isSoldOut && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 uppercase">
                                  Sold Out
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                            <span className="font-black text-xs text-slate-900">
                              ₹{parseFloat(p.sellingPrice || p.retailPrice || '0').toFixed(2)}
                            </span>
                            {isSoldOut ? (
                              <span className="text-[10px] text-rose-600 font-bold">86&apos;d</span>
                            ) : (
                              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                                <Plus className="w-3 h-3" /> Add
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Pane: Draft KOT Cart & Active KOT History */}
                <div className="w-1/2 flex flex-col bg-slate-50">
                  <Tabs defaultValue="draft" className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-4 pt-2 bg-white border-b">
                      <TabsList className="grid grid-cols-2 w-full h-8">
                        <TabsTrigger value="draft" className="text-xs font-bold gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          Draft KOT {draftItems.length > 0 && `(${draftItems.length})`}
                        </TabsTrigger>
                        <TabsTrigger value="history" className="text-xs font-bold gap-1.5">
                          <ChefHat className="w-3.5 h-3.5 text-sky-500" />
                          Dispatched KOTs ({activeOrder?.kots?.length || 0})
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    {/* Tab 1: Draft KOT */}
                    <TabsContent value="draft" className="flex-1 flex flex-col m-0 p-0 overflow-hidden">
                      <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {draftItems.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6">
                            <Flame className="w-10 h-10 text-slate-300 mb-2" />
                            <p className="text-xs font-bold text-slate-600">Draft KOT is empty</p>
                            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                              Select items from the menu on the left to fire them to the kitchen.
                            </p>
                          </div>
                        ) : (
                          draftItems.map((item) => (
                            <div key={item.productId} className="bg-white p-3 rounded-xl border shadow-sm space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="font-bold text-xs text-slate-900">{item.productName}</div>
                                <div className="font-black text-xs text-slate-900">
                                  ₹{(item.unitPrice * item.quantity).toFixed(2)}
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center border rounded-lg bg-slate-50 p-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateDraftQuantity(item.productId, -1)}
                                    className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-white rounded"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-8 text-center font-bold text-xs">{item.quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateDraftQuantity(item.productId, 1)}
                                    className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-white rounded"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>

                                <Select
                                  value={item.kitchenStation}
                                  onValueChange={(val) => handleUpdateDraftStation(item.productId, val as KitchenStation)}
                                >
                                  <SelectTrigger className="h-7 text-[11px] min-w-[130px] w-auto px-2 bg-slate-50">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={KitchenStation.MAIN_KITCHEN}>Main Kitchen</SelectItem>
                                    <SelectItem value={KitchenStation.BEVERAGE_BAR}>Bar / Beverages</SelectItem>
                                    <SelectItem value={KitchenStation.TANDOOR}>Tandoor & Grill</SelectItem>
                                    <SelectItem value={KitchenStation.BAKERY_DESSERT}>Bakery & Dessert</SelectItem>
                                  </SelectContent>
                                </Select>

                                <button
                                  type="button"
                                  onClick={() => handleUpdateDraftQuantity(item.productId, -item.quantity)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <Input
                                placeholder="Special instruction (e.g. less spicy, no onion)"
                                value={item.specialInstructions}
                                onChange={(e) => handleUpdateDraftInstructions(item.productId, e.target.value)}
                                className="h-7 text-[11px] bg-slate-50 placeholder:italic"
                              />
                            </div>
                          ))
                        )}
                      </div>
                    </TabsContent>

                    {/* Tab 2: Dispatched KOTs */}
                    <TabsContent value="history" className="flex-1 flex flex-col m-0 p-0 overflow-y-auto">
                      <div className="p-3 space-y-3">
                        {(!activeOrder?.kots || activeOrder.kots.length === 0) ? (
                          <div className="text-center p-6 text-slate-400 text-xs">
                            No KOT tickets dispatched yet.
                          </div>
                        ) : (
                          activeOrder.kots.map((kot) => (
                            <div key={kot.id} className="bg-white p-3 rounded-xl border shadow-sm space-y-2 text-xs">
                              <div className="flex items-center justify-between border-b pb-1.5">
                                <div>
                                  <span className="font-bold text-slate-900">{kot.kotNumber}</span>
                                  <span className="text-[10px] text-slate-400 ml-2">
                                    {new Date(kot.dispatchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Badge
                                    className={`text-[10px] uppercase font-bold ${
                                      kot.status === KotStatus.READY
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : kot.status === KotStatus.PREPARING
                                        ? 'bg-amber-100 text-amber-800'
                                        : kot.status === KotStatus.SERVED
                                        ? 'bg-slate-100 text-slate-700'
                                        : 'bg-sky-100 text-sky-800'
                                    }`}
                                  >
                                    {kot.status}
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-slate-500"
                                    onClick={() => handlePrintKot(kot)}
                                    title="Print KOT"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-1">
                                {kot.lines?.map((line) => (
                                  <div key={line.id} className="flex justify-between items-start text-[11px]">
                                    <div>
                                      <span className="font-bold text-slate-800">{parseFloat(line.quantity).toFixed(0)}x</span>{' '}
                                      <span>{line.productNameSnapshot}</span>
                                      {line.specialInstructions && (
                                        <p className="text-[10px] text-amber-700 font-medium italic">
                                          Note: {line.specialInstructions}
                                        </p>
                                      )}
                                    </div>
                                    <span className="font-mono text-slate-600">
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

                  {/* Running Bill Totals & Settlement Trigger */}
                  <div className="bg-slate-900 text-white p-3 space-y-1.5 border-t border-slate-800">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Subtotal:</span>
                      <span>₹{parseFloat(activeOrder?.subtotal || '0').toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>GST (5% Restaurant):</span>
                      <span>₹{parseFloat(activeOrder?.taxTotal || '0').toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-black text-sm text-emerald-400 border-t border-slate-800 pt-1">
                      <span>Grand Total:</span>
                      <span>₹{parseFloat(activeOrder?.grandTotal || '0').toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Dynamic Action Area: Place Order <-> Print Bill */}
                  <div className="p-3 bg-white border-t space-y-2">
                    {draftItems.length > 0 ? (
                      <Button
                        onClick={handleFireKot}
                        disabled={isFiringKot}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm h-11 gap-2 shadow-sm"
                      >
                        <Flame className="w-4 h-4 fill-slate-950" />
                        {isFiringKot ? 'Firing to Kitchen...' : `🔥 Place Order (${draftItems.length} items)`}
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
                          className="flex-1 text-xs font-bold gap-1.5 h-11 border-slate-300"
                          title="Print latest KOT slip"
                        >
                          <Printer className="w-4 h-4 text-slate-600" /> Print KOT
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handlePrintBill}
                          className="flex-1 text-xs font-bold gap-1.5 h-11 border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                          title="Print Customer Bill Receipt & Mark Table Billed"
                        >
                          <Receipt className="w-4 h-4 text-emerald-700" /> Print Bill
                        </Button>
                        <Button
                          onClick={() => setSettleModalOpen(true)}
                          className="flex-[1.5] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm h-11 gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Settle (₹{parseFloat(activeOrder?.grandTotal || '0').toFixed(2)})
                        </Button>
                      </div>
                    ) : (
                      <Button
                        disabled
                        className="w-full bg-slate-100 text-slate-400 font-bold text-xs h-10 border border-slate-200 cursor-not-allowed"
                      >
                        Select dishes from menu to place order
                      </Button>
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
    </>
  );
}
