'use client';

import React from 'react';
import { PurchaseOrder } from '@/lib/api-client';
import {
  ArrowDownToLine,
  CheckCircle2,
  AlertTriangle,
  X,
  Boxes,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export interface GrnFormData {
  open: boolean;
  po: PurchaseOrder | null;
  receivedItems: Record<string, string>;
  notes: string;
  isSubmitting?: boolean;
  error?: string;
  successMessage?: string;
}

export interface GrnReceiptModalProps<T extends GrnFormData = GrnFormData> {
  open: boolean;
  onClose: () => void;
  data: T;
  setData: React.Dispatch<React.SetStateAction<T>>;
  onConfirm: () => Promise<void>;
}

export function GrnReceiptModal<T extends GrnFormData = GrnFormData>({
  open,
  onClose,
  data,
  setData,
  onConfirm,
}: GrnReceiptModalProps<T>) {
  const updateField = (field: keyof GrnFormData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleQtyChange = (lineId: string, qty: string) => {
    setData((prev) => ({
      ...prev,
      receivedItems: { ...prev.receivedItems, [lineId]: qty },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden" data-testid="grn-modal">
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
          {/* Header */}
          <DialogHeader className="p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                  <ArrowDownToLine className="h-4.5 w-4.5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold text-slate-900">
                    Receive Goods (Goods Received Note — GRN)
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Order: <strong className="font-mono text-slate-900 font-semibold">{data.po?.orderNumber}</strong>{' '}
                    | Vendor: <strong className="text-slate-900 font-semibold">{data.po?.supplier?.name}</strong>
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
            {/* Success Message Banner */}
            {data.successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{data.successMessage}</span>
              </div>
            )}

            {/* Error Message Banner */}
            {data.error && (
              <div
                className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2 font-medium"
                data-testid="grn-modal-error"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{data.error}</span>
              </div>
            )}

            {/* Inward Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Product Name & SKU</th>
                    <th className="p-3 text-right">Ordered</th>
                    <th className="p-3 text-right">Previously Received</th>
                    <th className="p-3 text-right">Remaining</th>
                    <th className="p-3 text-right">Inward Now *</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.po?.lines?.map((line, idx) => {
                    const ordered = parseFloat(line.quantityOrdered) || 0;
                    const prevReceived = parseFloat(line.quantityReceived || '0') || 0;
                    const remaining = Math.max(0, ordered - prevReceived);

                    return (
                      <tr key={line.id} className="hover:bg-slate-50/80">
                        <td className="p-3 font-semibold text-slate-900">
                          <div>{line.product?.name || 'Product SKU'}</div>
                          <div className="text-[11px] font-mono text-slate-400">
                            {line.product?.sku}
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono text-slate-700">{line.quantityOrdered}</td>
                        <td className="p-3 text-right font-mono text-slate-700">
                          {line.quantityReceived || '0.000'}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-amber-700">
                          {remaining.toFixed(3)}
                        </td>
                        <td className="p-3 text-right">
                          <input
                            type="text"
                            placeholder="0.000"
                            value={data.receivedItems[line.id] || ''}
                            onChange={(e) => handleQtyChange(line.id, e.target.value)}
                            data-testid={`grn-qty-input-${idx}`}
                            className="w-24 text-right px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-emerald-800 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-xs font-bold text-slate-700">
                Inward Receipt Notes / Challan Number
              </Label>
              <input
                type="text"
                placeholder="e.g. Inward Challan #CH-8891, Received in full condition without damages"
                value={data.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                className="w-full text-xs mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
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
              data-testid="confirm-grn-btn"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-sm disabled:opacity-50"
            >
              {data.isSubmitting ? 'Inwarding Stock...' : 'Confirm Goods Receipt (Inward to Stock)'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

