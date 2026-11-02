'use client';

import React from 'react';
import { Supplier, Branch, Product } from '@/lib/api-client';
import {
  FileText,
  AlertTriangle,
  Plus,
  Trash2,
  X,
  IndianRupee,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export interface PoLineItem {
  productId: string;
  quantityOrdered: string;
  unitCost: string;
  taxRatePercent: string;
}

export interface PoFormData {
  open: boolean;
  supplierId: string;
  branchId: string;
  orderNumber: string;
  expectedDeliveryDate: string;
  notes: string;
  lines: PoLineItem[];
  isSubmitting?: boolean;
  error?: string;
}

export interface CreatePoModalProps<T extends PoFormData = PoFormData> {
  open: boolean;
  onClose: () => void;
  data: T;
  setData: React.Dispatch<React.SetStateAction<T>>;
  suppliers: Supplier[];
  branches: Branch[];
  products: Product[];
  activeBranch: Branch | null;
  onSave: () => Promise<void>;
}

export function CreatePoModal<T extends PoFormData = PoFormData>({
  open,
  onClose,
  data,
  setData,
  suppliers,
  branches,
  products,
  activeBranch,
  onSave,
}: CreatePoModalProps<T>) {
  const updateField = (field: keyof PoFormData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddLine = () => {
    setData((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          productId: products[0]?.id || '',
          quantityOrdered: '10.000',
          unitCost: products[0]?.purchaseCost || '100.00',
          taxRatePercent: products[0]?.gstRatePercent || '5.00',
        },
      ],
    }));
  };

  const handleRemoveLine = (idx: number) => {
    setData((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== idx),
    }));
  };

  const handleUpdateLine = (idx: number, patch: Partial<PoLineItem>) => {
    setData((prev) => {
      const nextLines = [...prev.lines];
      nextLines[idx] = { ...nextLines[idx], ...patch };
      return { ...prev, lines: nextLines };
    });
  };

  const calculateSubtotal = () =>
    data.lines.reduce((sum, line) => {
      const qty = parseFloat(line.quantityOrdered) || 0;
      const cost = parseFloat(line.unitCost) || 0;
      return sum + qty * cost;
    }, 0);

  const calculateTax = () =>
    data.lines.reduce((sum, line) => {
      const qty = parseFloat(line.quantityOrdered) || 0;
      const cost = parseFloat(line.unitCost) || 0;
      const rate = parseFloat(line.taxRatePercent) || 0;
      return sum + (qty * cost * rate) / 100;
    }, 0);

  const subtotal = calculateSubtotal();
  const tax = calculateTax();
  const total = subtotal + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden" data-testid="po-modal">
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
          {/* Header */}
          <DialogHeader className="p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold text-slate-900">
                    Create Procurement Purchase Order (PO)
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Draft a structured purchase order for stock replenishment from registered vendors
                  </DialogDescription>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </DialogHeader>

          <div className="p-5 overflow-y-auto space-y-4 text-xs">
            {data.error && (
              <div
                className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2 font-medium"
                data-testid="po-modal-error"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{data.error}</span>
              </div>
            )}

            {/* Top Grid: Supplier & Destination Branch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-slate-700">Vendor / Supplier *</Label>
                <select
                  value={data.supplierId}
                  onChange={(e) => updateField('supplierId', e.target.value)}
                  data-testid="po-supplier-select"
                  className="w-full text-xs mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
                  required
                >
                  <option value="">Select Vendor</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.gstin ? `(${s.gstin})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Destination Branch *</Label>
                <select
                  value={data.branchId}
                  onChange={(e) => updateField('branchId', e.target.value)}
                  data-testid="po-branch-select"
                  className="w-full text-xs mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
                  required
                >
                  <option value={activeBranch?.id || ''}>{activeBranch?.name || 'Active Branch'}</option>
                  {branches
                    .filter((b) => b.id !== activeBranch?.id)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* PO Number & Delivery Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-slate-700">PO Reference Number *</Label>
                <input
                  type="text"
                  value={data.orderNumber}
                  onChange={(e) => updateField('orderNumber', e.target.value)}
                  data-testid="po-number-input"
                  className="w-full text-xs mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Expected Delivery Date</Label>
                <input
                  type="date"
                  value={data.expectedDeliveryDate}
                  onChange={(e) => updateField('expectedDeliveryDate', e.target.value)}
                  className="w-full text-xs mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Line Items Builder */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
              <div className="p-3 bg-slate-100/70 border-b border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-800 text-xs">
                  Order Line Items ({data.lines.length})
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLine}
                  data-testid="add-po-line-btn"
                  className="h-7 text-xs bg-white text-blue-700 font-bold border-blue-300 hover:bg-blue-50 cursor-pointer flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Line Item</span>
                </Button>
              </div>

              <div className="p-3 space-y-2">
                {data.lines.map((line, idx) => {
                  const lineProduct = products.find((p) => p.id === line.productId);
                  const lineQty = parseFloat(line.quantityOrdered) || 0;
                  const lineCost = parseFloat(line.unitCost) || 0;
                  const lineTotal = lineQty * lineCost;

                  return (
                    <div
                      key={idx}
                      className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center gap-2.5"
                    >
                      {/* Product Selector */}
                      <div className="flex-1 w-full sm:w-auto">
                        <Label className="text-[10px] text-slate-500 font-semibold mb-0.5 block">
                          Product SKU
                        </Label>
                        <select
                          value={line.productId}
                          onChange={(e) => {
                            const selectedProd = products.find((p) => p.id === e.target.value);
                            handleUpdateLine(idx, {
                              productId: e.target.value,
                              unitCost: selectedProd?.purchaseCost || line.unitCost,
                              taxRatePercent: selectedProd?.gstRatePercent || line.taxRatePercent,
                            });
                          }}
                          className="w-full text-xs bg-white border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="w-full sm:w-24">
                        <Label className="text-[10px] text-slate-500 font-semibold mb-0.5 block">
                          Quantity
                        </Label>
                        <input
                          type="text"
                          value={line.quantityOrdered}
                          onChange={(e) => handleUpdateLine(idx, { quantityOrdered: e.target.value })}
                          className="w-full text-xs font-mono text-right bg-white border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* Unit Cost */}
                      <div className="w-full sm:w-28">
                        <Label className="text-[10px] text-slate-500 font-semibold mb-0.5 block">
                          Cost ₹
                        </Label>
                        <input
                          type="text"
                          value={line.unitCost}
                          onChange={(e) => handleUpdateLine(idx, { unitCost: e.target.value })}
                          className="w-full text-xs font-mono text-right bg-white border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* GST Slab */}
                      <div className="w-full sm:w-20">
                        <Label className="text-[10px] text-slate-500 font-semibold mb-0.5 block">
                          GST %
                        </Label>
                        <select
                          value={line.taxRatePercent}
                          onChange={(e) => handleUpdateLine(idx, { taxRatePercent: e.target.value })}
                          className="w-full text-xs bg-white border border-slate-200 rounded-md px-1.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-center"
                        >
                          <option value="0.00">0%</option>
                          <option value="5.00">5%</option>
                          <option value="12.00">12%</option>
                          <option value="18.00">18%</option>
                          <option value="28.00">28%</option>
                        </select>
                      </div>

                      {/* Line Total */}
                      <div className="w-full sm:w-28 text-right">
                        <Label className="text-[10px] text-slate-500 font-semibold mb-0.5 block">
                          Line Total
                        </Label>
                        <span className="font-mono font-bold text-slate-800 text-xs py-1.5 block">
                          ₹{lineTotal.toFixed(2)}
                        </span>
                      </div>

                      {/* Remove Button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveLine(idx)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md self-end cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}

                {data.lines.length === 0 && (
                  <p className="text-center py-6 text-slate-400 text-xs">
                    No items in this purchase order. Click <strong>"Add Line Item"</strong> above.
                  </p>
                )}
              </div>
            </div>

            {/* Calculations Summary */}
            {data.lines.length > 0 && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-center text-xs gap-2">
                <span className="text-slate-500">
                  Procurement Summary ({data.lines.length} items)
                </span>
                <div className="flex items-center gap-4 font-mono">
                  <span>Subtotal: ₹{subtotal.toFixed(2)}</span>
                  <span>GST: ₹{tax.toFixed(2)}</span>
                  <span className="font-bold text-slate-900 text-sm">
                    Grand Total: ₹{total.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <Label className="text-xs font-bold text-slate-700">Internal Notes / Delivery Terms</Label>
              <textarea
                rows={2}
                placeholder="e.g. Delivery via Transport Carrier, Net 30 payment terms"
                value={data.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                className="w-full text-xs mt-1 bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="p-4 bg-slate-50 border-t border-slate-200 flex sm:flex-row gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="px-4 py-2 text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={data.isSubmitting}
              data-testid="save-po-btn"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-sm disabled:opacity-50"
            >
              {data.isSubmitting ? 'Creating Order...' : 'Submit Purchase Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
