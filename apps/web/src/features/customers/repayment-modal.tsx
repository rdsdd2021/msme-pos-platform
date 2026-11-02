'use client';

import React from 'react';
import { Customer } from '@/lib/api-client';
import {
  Coins,
  AlertTriangle,
  X,
  Printer,
  CheckCircle2,
  Info,
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

export type RepaymentMethod = 'cash' | 'upi' | 'card' | 'bank_transfer';

export interface RepaymentFormData {
  open: boolean;
  customer: Customer | null;
  amount: string;
  paymentMethod: RepaymentMethod;
  notes: string;
  isSubmitting?: boolean;
  error?: string;
}

export interface RepaymentReceipt {
  transactionId: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string | null;
  amountPaid: string;
  previousBalance: string;
  remainingBalance: string;
  paymentMethod: string;
  timestamp: string;
  notes?: string;
}

export interface RepaymentModalProps<T extends RepaymentFormData = RepaymentFormData> {
  open: boolean;
  onClose: () => void;
  data: T;
  setData: React.Dispatch<React.SetStateAction<T>>;
  onSave: () => Promise<void>;
}

export function RepaymentModal<T extends RepaymentFormData = RepaymentFormData>({
  open,
  onClose,
  data,
  setData,
  onSave,
}: RepaymentModalProps<T>) {
  if (!data.customer) return null;

  const updateField = (field: keyof RepaymentFormData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave();
  };

  const outstanding = parseFloat(data.customer.currentBalance || '0');

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden" data-testid="repayment-modal">
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Header */}
          <DialogHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                  <Coins className="h-4.5 w-4.5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold text-slate-900 flex items-center gap-1.5">
                    <span>Receive Khata Debt Repayment</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Recording debt collection payment for <strong className="text-slate-900 font-semibold">{data.customer.name}</strong>
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

          <div className="p-5 space-y-3.5 text-xs">
            {/* Financial Invariant Alert */}
            <div className="bg-blue-50/80 border border-blue-200 text-blue-900 p-2.5 rounded-xl text-[11px] leading-relaxed flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Financial Invariant:</strong> This records debt recovery into the customer receivables ledger.
                It does <em>not</em> generate a sales invoice, deduct stock, or recalculate GST.
              </div>
            </div>

            {/* Balances Summary */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Current Outstanding:</span>
                <span className="font-bold font-mono text-rose-600">₹{data.customer.currentBalance}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Approved Credit Limit:</span>
                <span className="font-mono text-slate-700">₹{data.customer.creditLimit}</span>
              </div>
              <div className="flex justify-between py-0.5 border-t border-slate-200 pt-1.5">
                <span className="text-slate-500">Maximum Permissible Repayment:</span>
                <span className="font-bold font-mono text-emerald-700">₹{data.customer.currentBalance}</span>
              </div>
            </div>

            {/* Error Message */}
            {data.error && (
              <div
                className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2 font-medium"
                data-testid="repayment-error"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>⚠️ {data.error}</span>
              </div>
            )}

            {/* Repayment Amount */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label className="text-xs font-semibold text-slate-700">Repayment Amount (₹) *</Label>
                {outstanding > 0 && (
                  <button
                    type="button"
                    onClick={() => updateField('amount', data.customer?.currentBalance || '')}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
                  >
                    Full Clearance (₹{data.customer.currentBalance})
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder="0.00"
                value={data.amount}
                onChange={(e) => updateField('amount', e.target.value)}
                data-testid="repayment-amount-input"
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
              />
            </div>

            {/* Tender / Payment Method */}
            <div>
              <Label className="block text-xs font-semibold text-slate-700 mb-1">
                Tender / Payment Method
              </Label>
              <select
                value={data.paymentMethod}
                onChange={(e) => updateField('paymentMethod', e.target.value as RepaymentMethod)}
                data-testid="repayment-method-select"
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="cash">Cash (Counter Float)</option>
                <option value="upi">UPI (Instant Bank QR / VPA)</option>
                <option value="card">Card (POS Terminal)</option>
                <option value="bank_transfer">Bank Transfer (NEFT / IMPS)</option>
              </select>
            </div>

            {/* Notes / Reference */}
            <div>
              <Label className="block text-xs font-semibold text-slate-700 mb-1">
                Receipt Notes / Reference
              </Label>
              <input
                type="text"
                placeholder="e.g. Cleared pending dues for invoice #1042"
                value={data.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
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
              disabled={data.isSubmitting}
              data-testid="confirm-repayment-btn"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 cursor-pointer"
            >
              {data.isSubmitting ? 'Recording...' : 'Confirm Repayment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export interface RepaymentReceiptModalProps {
  open: boolean;
  onClose: () => void;
  receipt: RepaymentReceipt | null;
}

export function RepaymentReceiptModal({
  open,
  onClose,
  receipt,
}: RepaymentReceiptModalProps) {
  if (!receipt) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md p-6 overflow-hidden" data-testid="repayment-receipt-modal">
        <div className="text-center pb-4 border-b border-slate-100">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">
            ✓
          </div>
          <DialogTitle className="font-black text-lg text-slate-900 text-center">
            Khata Repayment Recorded
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-mono mt-0.5 text-center">
            Receipt Ref: {receipt.transactionId}
          </DialogDescription>
        </div>

        <div className="py-4 space-y-2.5 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Customer:</span>
            <span className="font-bold text-slate-800">{receipt.customerName}</span>
          </div>
          {receipt.customerPhone && (
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Phone:</span>
              <span className="font-mono text-slate-700">{receipt.customerPhone}</span>
            </div>
          )}
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Date & Time:</span>
            <span className="font-mono text-slate-700">
              {new Date(receipt.timestamp).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Payment Tender:</span>
            <span className="font-bold font-mono uppercase text-blue-700">
              {receipt.paymentMethod.replace('_', ' ')}
            </span>
          </div>
          <div className="flex justify-between py-1.5 bg-emerald-50/70 p-2.5 rounded-xl text-emerald-900 font-bold">
            <span>Amount Received:</span>
            <span className="text-base font-black font-mono">₹{receipt.amountPaid}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Previous Balance:</span>
            <span className="font-mono text-slate-600">₹{receipt.previousBalance}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500 font-semibold">Remaining Outstanding:</span>
            <span className="font-mono font-black text-slate-900">₹{receipt.remainingBalance}</span>
          </div>
          {receipt.notes && (
            <div className="py-1 text-slate-500 text-[11px] italic">
              Note: {receipt.notes}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-9 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer flex items-center gap-1.5"
            data-testid="print-receipt-btn"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Receipt</span>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onClose}
            className="h-9 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
            data-testid="close-receipt-btn"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
