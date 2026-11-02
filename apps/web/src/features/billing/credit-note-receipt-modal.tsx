'use client';

import React from 'react';
import { CreditNote } from '@/lib/api-client';
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
import { Printer, CheckCircle2, RotateCcw } from 'lucide-react';

interface CreditNoteReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creditNote: CreditNote | null;
  tenantName?: string;
}

export function CreditNoteReceiptModal({
  open,
  onOpenChange,
  creditNote,
  tenantName,
}: CreditNoteReceiptModalProps) {
  if (!creditNote) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="credit-note-receipt-modal"
        className="max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl"
      >
        <DialogHeader className="p-4 border-b border-slate-100 bg-rose-50/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <RotateCcw className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Credit Note Issued Successfully
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Document Reference: <span className="font-mono font-bold text-slate-900">{creditNote.creditNoteNumber}</span>
                </DialogDescription>
              </div>
            </div>
            <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-bold uppercase text-[10px]">
              {creditNote.status}
            </Badge>
          </div>
        </DialogHeader>

        {/* Printable Voucher Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-xs text-slate-800 print:text-black">
          {/* Header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300 space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-wider">{tenantName || 'Kirana Supermart'}</h2>
            <p className="text-[11px] text-slate-500">CREDIT NOTE (SECTION 34 CGST ACT)</p>
            <p className="text-[10px] text-slate-400">Statutory Tax Adjustment Voucher</p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px] pb-3 border-b border-slate-200">
            <div>
              <span className="text-slate-400 block text-[10px]">Credit Note No:</span>
              <span className="font-bold">{creditNote.creditNoteNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Date & Time:</span>
              <span>{new Date(creditNote.createdAt).toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Original Invoice No:</span>
              <span className="font-bold text-slate-900">{creditNote.originalInvoiceNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Place of Supply:</span>
              <span>State Code {creditNote.placeOfSupply || '27'}</span>
            </div>
            {creditNote.customerGstinSnapshot && (
              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px]">Customer GSTIN:</span>
                <span className="font-bold">{creditNote.customerGstinSnapshot}</span>
              </div>
            )}
            <div className="col-span-2">
              <span className="text-slate-400 block text-[10px]">Reason:</span>
              <span>{creditNote.reason}</span>
            </div>
          </div>

          {/* Returned Items Table */}
          <div className="space-y-2 pb-3 border-b border-slate-200">
            <div className="text-[10px] font-bold uppercase text-slate-500 grid grid-cols-12 pb-1 border-b border-slate-100">
              <span className="col-span-6">Item & Condition</span>
              <span className="col-span-2 text-right">Qty</span>
              <span className="col-span-2 text-right">Rate</span>
              <span className="col-span-2 text-right">Refund</span>
            </div>

            {creditNote.lines.map((line) => {
              const rQty = parseFloat(line.resellableQuantity || '0');
              const dQty = parseFloat(line.damagedQuantity || '0');
              return (
                <div key={line.id} className="grid grid-cols-12 text-[11px] py-1 border-b border-slate-50">
                  <div className="col-span-6">
                    <div className="font-bold truncate">{line.productNameSnapshot}</div>
                    <div className="text-[10px] text-slate-400">
                      {rQty > 0 && <span className="text-emerald-600 font-semibold">{rQty} Restocked </span>}
                      {dQty > 0 && <span className="text-rose-600 font-semibold">{dQty} Damaged</span>}
                      {line.hsnSnapshot && <span> • HSN {line.hsnSnapshot}</span>}
                    </div>
                  </div>
                  <div className="col-span-2 text-right font-medium">
                    {line.quantityReturned}
                  </div>
                  <div className="col-span-2 text-right">
                    ₹{line.unitPrice}
                  </div>
                  <div className="col-span-2 text-right font-bold text-rose-700">
                    ₹{line.lineTotal}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Financial Breakdown */}
          <div className="space-y-1 text-[11px] pt-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Taxable Returned Value:</span>
              <span>₹{creditNote.taxableTotal}</span>
            </div>
            {parseFloat(creditNote.cgstTotal || '0') > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">CGST Refund:</span>
                <span>₹{creditNote.cgstTotal}</span>
              </div>
            )}
            {parseFloat(creditNote.sgstTotal || '0') > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">SGST Refund:</span>
                <span>₹{creditNote.sgstTotal}</span>
              </div>
            )}
            {parseFloat(creditNote.igstTotal || '0') > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">IGST Refund:</span>
                <span>₹{creditNote.igstTotal}</span>
              </div>
            )}
            {parseFloat(creditNote.roundingAdjustment || '0') !== 0 && (
              <div className="flex justify-between text-slate-400 text-[10px]">
                <span>Rounding Adjustment (Sec 170):</span>
                <span>₹{creditNote.roundingAdjustment}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black pt-2 border-t border-slate-300 text-slate-900">
              <span>TOTAL AMOUNT REFUNDED:</span>
              <span className="text-rose-700">₹{creditNote.grandTotal}</span>
            </div>
          </div>

          {/* Settlement Badge */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center space-y-0.5">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Settlement Mode</div>
            <div className="font-bold text-xs uppercase text-slate-800">
              Refunded via {creditNote.refundPaymentMethod}
              {creditNote.refundReference && ` (Ref: ${creditNote.refundReference})`}
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 italic pt-2">
            This is a computer generated statutory credit note.
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-slate-100 bg-white flex justify-between items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs cursor-pointer"
          >
            Close
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handlePrint}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Credit Note</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

