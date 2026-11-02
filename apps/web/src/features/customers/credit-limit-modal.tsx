'use client';

import React from 'react';
import { Customer } from '@/lib/api-client';
import { Coins, AlertTriangle, X } from 'lucide-react';
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

export interface CreditLimitFormData {
  open: boolean;
  customer: Customer | null;
  newLimit: string;
  reason: string;
  isSubmitting?: boolean;
  error?: string;
}

export interface CreditLimitModalProps<T extends CreditLimitFormData = CreditLimitFormData> {
  open: boolean;
  onClose: () => void;
  data: T;
  setData: React.Dispatch<React.SetStateAction<T>>;
  onSave: () => Promise<void>;
}

export function CreditLimitModal<T extends CreditLimitFormData = CreditLimitFormData>({
  open,
  onClose,
  data,
  setData,
  onSave,
}: CreditLimitModalProps<T>) {
  const updateField = (field: keyof CreditLimitFormData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden" data-testid="credit-limit-modal">
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Header */}
          <DialogHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                  <Coins className="h-4.5 w-4.5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold text-slate-900">
                    Modify Customer Credit Limit
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Adjust authorized store credit facility with mandatory audit logging
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

          <div className="p-5 space-y-4 text-xs">
            {data.error && (
              <div
                className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2 font-medium"
                data-testid="credit-limit-error"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{data.error}</span>
              </div>
            )}

            {/* Customer Summary Card */}
            {data.customer && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">{data.customer.name}</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    Current: ₹{data.customer.creditLimit}
                  </Badge>
                </div>
                <div className="text-slate-500 text-[11px] font-mono">
                  Outstanding Balance: ₹{data.customer.currentBalance || '0.00'}
                </div>
              </div>
            )}

            {/* New Credit Limit Input */}
            <div>
              <Label className="text-xs font-bold text-slate-700">New Credit Limit (₹) *</Label>
              <input
                type="text"
                placeholder="e.g. 10000.00"
                value={data.newLimit}
                onChange={(e) => updateField('newLimit', e.target.value)}
                data-testid="edit-limit-input"
                className="w-full text-xs mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                required
                autoFocus
              />
            </div>

            {/* Audit Reason Input */}
            <div>
              <Label className="text-xs font-bold text-slate-700">Mandatory Audit Reason *</Label>
              <input
                type="text"
                placeholder="e.g. Good monthly clearance, Credit facility expansion"
                value={data.reason}
                onChange={(e) => updateField('reason', e.target.value)}
                data-testid="edit-limit-reason-input"
                className="w-full text-xs mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <DialogFooter className="p-4 bg-slate-50 border-t border-slate-200 flex sm:flex-row gap-2">
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
              data-testid="confirm-edit-limit-btn"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-sm disabled:opacity-50"
            >
              {data.isSubmitting ? 'Updating...' : 'Update Credit Limit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

