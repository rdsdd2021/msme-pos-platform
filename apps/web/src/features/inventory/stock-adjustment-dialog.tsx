'use client';

import React from 'react';
import { Product } from '@/lib/api-client';
import { Scale, AlertTriangle, ArrowRight, X } from 'lucide-react';
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

export interface StockAdjustmentDialogProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  currentStock: string;
  qty: string;
  setQty: (val: string) => void;
  reason: string;
  setReason: (val: string) => void;
  error?: string;
  isSubmitting?: boolean;
  onConfirm: () => Promise<void>;
}

export function StockAdjustmentDialog({
  open,
  onClose,
  product,
  currentStock,
  qty,
  setQty,
  reason,
  setReason,
  error,
  isSubmitting,
  onConfirm,
}: StockAdjustmentDialogProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm();
  };

  const currentNum = parseFloat(currentStock || '0');
  const deltaNum = parseFloat(qty || '0');
  const projectedStock = isNaN(deltaNum) ? currentNum : currentNum + deltaNum;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden" data-testid="stock-adjust-modal">
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Header */}
          <DialogHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                  <Scale className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-slate-900">
                    Audit-Logged Stock Adjustment
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Recording perpetual ledger adjustment for{' '}
                    <strong className="text-slate-700">{product?.name}</strong>
                  </DialogDescription>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </DialogHeader>

          <div className="p-5 space-y-4">
            {error && (
              <div
                className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2 font-medium"
                data-testid="stock-adjust-error"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Product Summary Box */}
            {product && (
              <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{product.name}</h4>
                    <p className="font-mono text-[11px] text-slate-500">{product.sku}</p>
                  </div>
                  <Badge variant="outline" className="font-mono font-bold text-xs">
                    Current: {currentStock || '0.000'}
                  </Badge>
                </div>

                {/* Projected Change Bar */}
                <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Projected Balance:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold">
                    <span className="text-slate-600">{currentNum.toFixed(3)}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    <span className={projectedStock < 0 ? 'text-rose-600' : 'text-emerald-700'}>
                      {projectedStock.toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quantity Input */}
            <div>
              <Label className="text-xs font-bold text-slate-700">
                Quantity Delta (Positive to add, Negative to deduct) *
              </Label>
              <input
                type="text"
                placeholder="e.g. +10.000 or -2.000"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                data-testid="adjust-qty-input"
                className="w-full text-xs mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono text-right font-bold text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                required
                autoFocus
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Enter positive value (e.g. +10) to add on-hand stock; enter negative value (e.g. -2) to deduct damaged/expired goods.
              </p>
            </div>

            {/* Reason Selection */}
            <div>
              <Label className="text-xs font-bold text-slate-700">Mandatory Audit Reason *</Label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                data-testid="adjust-reason-select"
                className="w-full text-xs mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="Restock / Purchase">Direct Restock / Purchase</option>
                <option value="Physical Stock Count Correction">Physical Stock Count Correction</option>
                <option value="Breakage / Discrepancy">Breakage / Damage</option>
                <option value="Expired Stock Removal">Expired Stock Removal</option>
                <option value="Internal Kirana Store Consumption">Internal Kirana Store Consumption</option>
              </select>
            </div>
          </div>

          <DialogFooter className="p-4 bg-slate-50/50 border-t border-slate-100 flex sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="flex-1 text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              data-testid="confirm-adjust-btn"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Adjusting...' : 'Confirm Stock Adjustment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
