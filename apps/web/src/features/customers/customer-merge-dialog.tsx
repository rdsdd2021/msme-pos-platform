'use client';

import React from 'react';
import { Customer } from '@/lib/api-client';
import { GitMerge, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
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

export interface CustomerMergeFormData {
  open: boolean;
  sourceCustomer: Customer | null;
  targetCustomerId: string;
  reason: string;
  isSubmitting?: boolean;
  error?: string;
  successMessage?: string;
}

export interface CustomerMergeDialogProps<T extends CustomerMergeFormData = CustomerMergeFormData> {
  open: boolean;
  onClose: () => void;
  data: T;
  setData: React.Dispatch<React.SetStateAction<T>>;
  customers: Customer[];
  onMerge: () => Promise<void>;
}

export function CustomerMergeDialog<T extends CustomerMergeFormData = CustomerMergeFormData>({
  open,
  onClose,
  data,
  setData,
  customers,
  onMerge,
}: CustomerMergeDialogProps<T>) {
  if (!data.sourceCustomer) return null;

  const updateField = (field: keyof CustomerMergeFormData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onMerge();
  };

  const eligibleTargets = customers.filter(
    (c) => c.id !== data.sourceCustomer?.id
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden" data-testid="customer-merge-modal">
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Header */}
          <DialogHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm">
                  <GitMerge className="h-4.5 w-4.5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold text-slate-900 flex items-center gap-1.5">
                    <span>Merge Customer Records</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Consolidates duplicate customer records while strictly preserving historical invoices and ledger entries (Rule 9).
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
            {data.successMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>✅ {data.successMessage}</span>
              </div>
            )}

            {data.error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>⚠️ {data.error}</span>
              </div>
            )}

            {/* Source Customer Box */}
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-amber-800 block mb-1">
                Source Profile (Will be soft-deactivated)
              </span>
              <div className="font-bold text-slate-900 text-sm">{data.sourceCustomer.name}</div>
              <div className="text-xs text-slate-600 font-mono mt-0.5">
                📞 {data.sourceCustomer.phone || 'No phone'} | Current Due: ₹{data.sourceCustomer.currentBalance}
              </div>
            </div>

            {/* Target Customer Selection */}
            <div>
              <Label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Customer (Will receive all invoices & ledger records) *
              </Label>
              <select
                value={data.targetCustomerId}
                onChange={(e) => updateField('targetCustomerId', e.target.value)}
                data-testid="merge-target-customer-select"
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choose Target Account --</option>
                {eligibleTargets.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''} — Due: ₹{c.currentBalance}
                  </option>
                ))}
              </select>
            </div>

            {/* Reason Field */}
            <div>
              <Label className="block text-xs font-semibold text-slate-700 mb-1">
                Mandatory Audit Reason *
              </Label>
              <input
                type="text"
                placeholder="e.g. Duplicate account created during offline sync"
                value={data.reason}
                onChange={(e) => updateField('reason', e.target.value)}
                data-testid="merge-reason-input"
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-[11px] text-slate-600 leading-relaxed flex items-start gap-2">
              <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <strong>Audit & Financial Safety:</strong> All invoices and Khata debt repayments are atomically
                reassigned in a PostgreSQL transaction. The source profile is soft-deactivated and NEVER deleted.
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
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
              disabled={data.isSubmitting || !data.targetCustomerId}
              data-testid="confirm-merge-btn"
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-9 px-4 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {data.isSubmitting ? 'Merging Atomically...' : 'Confirm Customer Merge'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

