'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Invoice, Branch, CreditNote } from '@/lib/api-client';
import { Printer, CheckCircle2, Receipt, ArrowLeft, CreditCard, Banknote, QrCode, BookOpen, RotateCcw } from 'lucide-react';
import { ReturnItemsModal } from './return-items-modal';
import { CreditNoteReceiptModal } from './credit-note-receipt-modal';

interface InvoiceDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  branch?: Branch | null;
  tenantName?: string;
  tenantId?: string;
  onReturnSuccess?: () => void;
}

export function InvoiceDetailsModal({
  open,
  onOpenChange,
  invoice,
  branch,
  tenantName = 'Kirana Supermart',
  tenantId = '',
  onReturnSuccess,
}: InvoiceDetailsModalProps) {
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [creditNoteModal, setCreditNoteModal] = useState<{
    open: boolean;
    creditNote: CreditNote | null;
  }>({
    open: false,
    creditNote: null,
  });

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleReturnSuccess = (creditNote: CreditNote) => {
    setCreditNoteModal({ open: true, creditNote });
    onReturnSuccess?.();
  };

  const getPaymentIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash':
        return <Banknote className="h-3.5 w-3.5 text-emerald-600" />;
      case 'upi':
        return <QrCode className="h-3.5 w-3.5 text-indigo-600" />;
      case 'card':
        return <CreditCard className="h-3.5 w-3.5 text-blue-600" />;
      case 'credit':
      case 'khata':
        return <BookOpen className="h-3.5 w-3.5 text-purple-600" />;
      default:
        return <Receipt className="h-3.5 w-3.5 text-slate-600" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-white" data-testid="invoice-details-modal">
        {/* Modal Header */}
        <DialogHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Receipt className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold text-slate-900 font-mono">
                  {invoice.invoiceNumber}
                </DialogTitle>
                <DialogDescription className="text-[11px] text-slate-500">
                  {new Date(invoice.postedAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </DialogDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className={
                invoice.paymentStatus === 'paid'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] uppercase font-bold'
                  : 'bg-amber-50 text-amber-700 border-amber-200 text-[10px] uppercase font-bold'
              }
            >
              {invoice.paymentStatus}
            </Badge>
          </div>
        </DialogHeader>

        {/* Thermal Slip Content (Print-Ready) */}
        <div className="p-6 overflow-y-auto max-h-[65vh] space-y-4 text-slate-800 font-sans">
          {/* Store & Branch Meta */}
          <div className="text-center pb-3 border-b border-dashed border-slate-200">
            <h3 className="font-bold text-sm tracking-tight text-slate-900">{tenantName}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {branch?.name || 'Main Retail Store'}
            </p>
            {branch?.gstin && (
              <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                GSTIN: {branch.gstin}
              </p>
            )}
            {invoice.customerGstinSnapshot && (
              <p className="text-[11px] font-mono text-indigo-600 mt-0.5">
                Buyer GSTIN: {invoice.customerGstinSnapshot}
              </p>
            )}
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-100">
              <span>Item & Description</span>
              <span className="text-right">Qty x Price = Total</span>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {invoice.lines.map((line, idx) => (
                <div key={line.id || idx} className="py-2 flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 leading-snug">
                      {line.productNameSnapshot}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                      <span>SKU: {line.skuSnapshot}</span>
                      <span>GST: {line.gstRatePercent}%</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-slate-900">₹{line.lineTotal}</div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {line.quantity} × ₹{line.unitPrice}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bill Totals Summary */}
          <div className="pt-2 border-t border-dashed border-slate-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal:</span>
              <span className="font-mono">₹{invoice.subtotal}</span>
            </div>
            {parseFloat(invoice.discountTotal) > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount Applied:</span>
                <span className="font-mono">-₹{invoice.discountTotal}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>Taxable Value:</span>
              <span className="font-mono">₹{invoice.taxableTotal}</span>
            </div>
            {parseFloat(invoice.cgstTotal) > 0 && (
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>CGST:</span>
                <span className="font-mono">₹{invoice.cgstTotal}</span>
              </div>
            )}
            {parseFloat(invoice.sgstTotal) > 0 && (
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>SGST:</span>
                <span className="font-mono">₹{invoice.sgstTotal}</span>
              </div>
            )}
            {parseFloat(invoice.igstTotal) > 0 && (
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>IGST:</span>
                <span className="font-mono">₹{invoice.igstTotal}</span>
              </div>
            )}
            {parseFloat(invoice.roundingAdjustment) !== 0 && (
              <div className="flex justify-between text-slate-400 text-[10px]">
                <span>Rounding Adjustment:</span>
                <span className="font-mono">₹{invoice.roundingAdjustment}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-slate-900 border-t border-slate-200 pt-2">
              <span>Grand Total:</span>
              <span className="font-mono text-emerald-700">₹{invoice.grandTotal}</span>
            </div>
          </div>

          {/* Payment Tenders Breakdown */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Payment Allocation
              </p>
              <div className="space-y-1">
                {invoice.payments.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-100"
                  >
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      {getPaymentIcon(p.paymentMethod)}
                      <span className="capitalize">{p.paymentMethod}</span>
                      {p.externalReference && (
                        <span className="text-[10px] font-mono text-slate-400">
                          (Ref: {p.externalReference})
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-slate-900">₹{p.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Note & Idempotency Audit */}
          <div className="text-center pt-2 text-[10px] text-slate-400 border-t border-dashed border-slate-200 space-y-0.5">
            <p>Customer Support & Inquiries: +91 98765 43210</p>
            <p className="font-mono text-[9px] text-slate-400">
              Audit Idempotency: {invoice.idempotencyKey.slice(0, 24)}...
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-200 flex sm:flex-row gap-2">
          {invoice.status !== 'returned' && tenantId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReturnModalOpen(true)}
              data-testid="open-return-modal-btn"
              className="flex-1 font-semibold text-xs h-9 cursor-pointer border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100/60"
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              <span>Return / Credit Note</span>
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            data-testid="reprint-invoice-btn"
            className="flex-1 font-semibold text-xs h-9 cursor-pointer"
          >
            <Printer className="h-4 w-4 mr-1.5 text-slate-600" />
            <span>Reprint Receipt</span>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => onOpenChange(false)}
            data-testid="close-invoice-modal-btn"
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-9 cursor-pointer"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Return Items Dialog */}
      <ReturnItemsModal
        open={returnModalOpen}
        onOpenChange={setReturnModalOpen}
        invoice={invoice}
        tenantId={tenantId}
        onSuccess={handleReturnSuccess}
      />

      {/* Credit Note Receipt Voucher Dialog */}
      <CreditNoteReceiptModal
        open={creditNoteModal.open}
        onOpenChange={(val) => setCreditNoteModal((prev) => ({ ...prev, open: val }))}
        creditNote={creditNoteModal.creditNote}
        tenantName={tenantName}
      />
    </Dialog>
  );
}

