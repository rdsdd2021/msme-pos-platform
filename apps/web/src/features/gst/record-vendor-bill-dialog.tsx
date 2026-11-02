'use client';

import React from 'react';
import { Supplier, Branch, Product } from '@/lib/api-client';
import { Receipt, AlertTriangle, Plus, Trash2, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export interface VendorBillLine {
  productId: string;
  description: string;
  hsnCode: string;
  quantity: string;
  unitCost: string;
  gstRatePercent: string;
}

export interface VendorBillFormData {
  open: boolean;
  branchId: string;
  supplierId: string;
  purchaseOrderId: string;
  supplierInvoiceNumber: string;
  supplierInvoiceDate: string;
  isItcEligible: boolean;
  ineligibilityReason: string;
  isReverseCharge: boolean;
  placeOfSupply: string;
  notes: string;
  lines: VendorBillLine[];
  isSubmitting?: boolean;
  error?: string;
}

export interface RecordVendorBillDialogProps<T extends VendorBillFormData = VendorBillFormData> {
  open: boolean;
  onClose: () => void;
  data: T;
  setData: React.Dispatch<React.SetStateAction<T>>;
  branches: Branch[];
  suppliers: Supplier[];
  products: Product[];
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export function RecordVendorBillDialog<T extends VendorBillFormData = VendorBillFormData>({
  open,
  onClose,
  data,
  setData,
  branches,
  suppliers,
  products,
  onSubmit,
}: RecordVendorBillDialogProps<T>) {
  const updateField = (field: keyof VendorBillFormData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddLine = () => {
    setData((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          productId: '',
          description: '',
          hsnCode: '',
          quantity: '1.000',
          unitCost: '0.00',
          gstRatePercent: '5.00',
        },
      ],
    }));
  };

  const handleRemoveLine = (index: number) => {
    setData((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }));
  };

  const handleLineChange = (index: number, field: string, val: string) => {
    setData((prev) => {
      const nextLines = [...prev.lines];
      const line = { ...nextLines[index], [field]: val };

      // Auto-populate description, HSN & cost if product selected
      if (field === 'productId') {
        const prod = products.find((p) => p.id === val);
        if (prod) {
          line.description = prod.name;
          line.hsnCode = prod.hsnCode || '';
          line.unitCost = prod.purchaseCost || '0.00';
          line.gstRatePercent = prod.gstRatePercent || '5.00';
        }
      }

      nextLines[index] = line;
      return { ...prev, lines: nextLines };
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <form onSubmit={onSubmit} className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <DialogHeader className="p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm">
                  <Receipt className="h-4.5 w-4.5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold text-slate-900">
                    Record Inward Vendor Tax Invoice
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Captures verified purchase invoices for Input Tax Credit (ITC) claim reconciliation
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

          {/* Form Content */}
          <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
            {data.error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>⚠️ {data.error}</span>
              </div>
            )}

            {/* Branch and Supplier Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="block text-xs font-semibold text-slate-700 mb-1">Receiving Branch *</Label>
                <select
                  value={data.branchId}
                  onChange={(e) => updateField('branchId', e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-purple-500"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="block text-xs font-semibold text-slate-700 mb-1">Supplier *</Label>
                <select
                  value={data.supplierId}
                  onChange={(e) => updateField('supplierId', e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.gstin ? `(${s.gstin})` : '(Unregistered)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Invoice Number *</Label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. VEN-2026-9041"
                  value={data.supplierInvoiceNumber}
                  onChange={(e) => updateField('supplierInvoiceNumber', e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div>
                <Label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Date *</Label>
                <Input
                  type="date"
                  required
                  value={data.supplierInvoiceDate}
                  onChange={(e) => updateField('supplierInvoiceDate', e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>

            {/* ITC Eligibility & Flags */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="itcEligibleCheck"
                  checked={data.isItcEligible}
                  onChange={(e) => updateField('isItcEligible', e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                />
                <Label htmlFor="itcEligibleCheck" className="font-bold text-slate-900 cursor-pointer text-xs">
                  Eligible for Input Tax Credit (ITC) under Section 16(2)
                </Label>
              </div>

              {!data.isItcEligible && (
                <div>
                  <Label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Ineligibility / Blocked Reason (Section 17(5))
                  </Label>
                  <Input
                    type="text"
                    placeholder="e.g. Motor vehicles, personal consumption, food & beverages"
                    value={data.ineligibilityReason}
                    onChange={(e) => updateField('ineligibilityReason', e.target.value)}
                    className="text-xs h-8 bg-white"
                  />
                </div>
              )}
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900 text-xs">Line Items & Tax Slabs</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLine}
                  className="h-7 px-2.5 text-xs font-semibold cursor-pointer flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Item</span>
                </Button>
              </div>

              {data.lines.map((line, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4">
                    <Label className="block text-[10px] text-slate-500 font-bold mb-0.5">Product / Description</Label>
                    <input
                      type="text"
                      required
                      placeholder="Item name"
                      value={line.description}
                      onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded-lg bg-white text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="block text-[10px] text-slate-500 font-bold mb-0.5">HSN</Label>
                    <input
                      type="text"
                      placeholder="HSN"
                      value={line.hsnCode}
                      onChange={(e) => handleLineChange(idx, 'hsnCode', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded-lg bg-white text-xs font-mono"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="block text-[10px] text-slate-500 font-bold mb-0.5">Qty</Label>
                    <input
                      type="number"
                      step="0.001"
                      required
                      value={line.quantity}
                      onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded-lg bg-white text-xs font-mono"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="block text-[10px] text-slate-500 font-bold mb-0.5">Cost (₹)</Label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={line.unitCost}
                      onChange={(e) => handleLineChange(idx, 'unitCost', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded-lg bg-white text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="col-span-1">
                    <Label className="block text-[10px] text-slate-500 font-bold mb-0.5">GST%</Label>
                    <select
                      value={line.gstRatePercent}
                      onChange={(e) => handleLineChange(idx, 'gstRatePercent', e.target.value)}
                      className="w-full px-1 py-1 border border-slate-300 rounded-lg bg-white text-xs font-mono"
                    >
                      <option value="0.00">0%</option>
                      <option value="5.00">5%</option>
                      <option value="12.00">12%</option>
                      <option value="18.00">18%</option>
                      <option value="28.00">28%</option>
                    </select>
                  </div>
                  <div className="col-span-1 text-right pt-3">
                    {data.lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        title="Remove Line"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-[11px] text-slate-600 leading-relaxed flex items-start gap-2">
              <Info className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <strong>Section 16(2) Proof:</strong> Recorded invoices update Table 4 ITC and are reconciled against
                GSTR-2B data for accurate input tax set-off calculations.
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-9 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={data.isSubmitting}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-9 px-4 cursor-pointer"
            >
              {data.isSubmitting ? 'Recording Invoice...' : 'Save Vendor Invoice'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

