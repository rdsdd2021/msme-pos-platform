'use client';

import React, { useState, useMemo } from 'react';
import {
  Invoice,
  CreditNote,
  apiClient,
  CreateSalesReturnPayload,
} from '@/lib/api-client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  PackageCheck,
  PackageX,
  IndianRupee,
  Receipt,
  Coins,
} from 'lucide-react';

interface ReturnItemsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  tenantId: string;
  onSuccess: (creditNote: CreditNote) => void;
}

interface ItemReturnState {
  resellableQty: string;
  damagedQty: string;
  reason: string;
}

export function ReturnItemsModal({
  open,
  onOpenChange,
  invoice,
  tenantId,
  onSuccess,
}: ReturnItemsModalProps) {
  const [returnStates, setReturnStates] = useState<Record<string, ItemReturnState>>({});
  const [returnReason, setReturnReason] = useState('Customer return / exchange');
  const [refundMethod, setRefundMethod] = useState<'cash' | 'upi' | 'card' | 'credit'>('cash');
  const [refundReference, setRefundReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute already returned quantity per invoice line if invoice has creditNotes
  const alreadyReturnedMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!invoice?.creditNotes) return map;
    invoice.creditNotes.forEach((cn) => {
      cn.lines?.forEach((line) => {
        if (line.originalInvoiceLineId) {
          const current = map.get(line.originalInvoiceLineId) || 0;
          map.set(line.originalInvoiceLineId, current + parseFloat(line.quantityReturned || '0'));
        }
      });
    });
    return map;
  }, [invoice]);

  // Reset states when opening
  React.useEffect(() => {
    if (invoice && open) {
      const initial: Record<string, ItemReturnState> = {};
      invoice.lines.forEach((l) => {
        initial[l.id] = { resellableQty: '', damagedQty: '', reason: '' };
      });
      setReturnStates(initial);
      setReturnReason('Customer return / exchange');
      setRefundMethod(invoice.customerId ? 'cash' : 'cash');
      setRefundReference('');
      setError(null);
    }
  }, [invoice, open]);

  if (!invoice) return null;

  // Real-time calculation of returned amounts
  const { totalResellable, totalDamaged, totalTaxableCents, totalGstCents, grandTotalCents, hasAnyItems, isOverLimit } =
    useMemo(() => {
      let resellableCount = 0;
      let damagedCount = 0;
      let taxableCents = 0;
      let gstCents = 0;
      let overLimit = false;

      invoice.lines.forEach((line) => {
        const state = returnStates[line.id];
        const rQty = parseFloat(state?.resellableQty || '0');
        const dQty = parseFloat(state?.damagedQty || '0');

        if (rQty > 0 || dQty > 0) {
          resellableCount += rQty;
          damagedCount += dQty;

          const totalLineReturn = rQty + dQty;
          const origQty = parseFloat(line.quantity);
          const alreadyRet = alreadyReturnedMap.get(line.id) || 0;

          if (alreadyRet + totalLineReturn > origQty + 0.0001) {
            overLimit = true;
          }

          const unitPrice = parseFloat(line.unitPrice);
          const discountAmt = parseFloat(line.discountAmount || '0');
          const gstRate = parseFloat(line.gstRatePercent || '0');

          const fraction = totalLineReturn / origQty;
          const lineGross = Math.round(unitPrice * totalLineReturn * 100);
          const lineDisc = Math.round(discountAmt * fraction * 100);
          const lineTaxable = lineGross - lineDisc;
          const lineGst = Math.round((lineTaxable * gstRate) / 100);

          taxableCents += lineTaxable;
          gstCents += lineGst;
        }
      });

      const beforeRound = taxableCents + gstCents;
      const roundedGrand = Math.round(beforeRound / 100) * 100;

      return {
        totalResellable: resellableCount,
        totalDamaged: damagedCount,
        totalTaxableCents: taxableCents,
        totalGstCents: gstCents,
        grandTotalCents: roundedGrand,
        hasAnyItems: resellableCount + damagedCount > 0,
        isOverLimit: overLimit,
      };
    }, [invoice, returnStates, alreadyReturnedMap]);

  const handleUpdateItem = (lineId: string, field: keyof ItemReturnState, value: string) => {
    setReturnStates((prev) => ({
      ...prev,
      [lineId]: {
        ...(prev[lineId] || { resellableQty: '', damagedQty: '', reason: '' }),
        [field]: value,
      },
    }));
  };

  const handleSetMaxResellable = (lineId: string, maxQty: number) => {
    handleUpdateItem(lineId, 'resellableQty', maxQty.toString());
    handleUpdateItem(lineId, 'damagedQty', '0');
  };

  const handleSubmit = async () => {
    if (!hasAnyItems) {
      setError('Please enter return quantities for at least one item');
      return;
    }
    if (isOverLimit) {
      setError('One or more items exceed the maximum available return quantity');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const itemsToReturn = invoice.lines
        .map((l) => {
          const s = returnStates[l.id];
          const r = parseFloat(s?.resellableQty || '0');
          const d = parseFloat(s?.damagedQty || '0');
          if (r > 0 || d > 0) {
            return {
              invoiceLineId: l.id,
              resellableQuantity: r.toFixed(3),
              damagedQuantity: d.toFixed(3),
              reason: s?.reason || returnReason,
            };
          }
          return null;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      const idempotencyKey = `ret-${invoice.id}-${Date.now()}`;

      const payload: CreateSalesReturnPayload = {
        originalInvoiceId: invoice.id,
        idempotencyKey,
        reason: returnReason,
        refundPaymentMethod: refundMethod,
        refundReference: refundReference.trim() || undefined,
        items: itemsToReturn,
      };

      const creditNote = await apiClient.createSalesReturn(tenantId, payload);
      onOpenChange(false);
      onSuccess(creditNote);
    } catch (err: any) {
      setError(err.message || 'Failed to process sales return on server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="return-items-modal"
        className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl"
      >
        <DialogHeader className="p-5 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Process Sales Return & Issue Credit Note
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Linked to Original Bill <span className="font-mono font-bold text-slate-800">{invoice.invoiceNumber}</span>
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              Bill Date: {new Date(invoice.postedAt).toLocaleDateString('en-IN')}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Items Return Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
              <span>Original Invoice Line Items</span>
              <span className="text-slate-400 font-normal text-[11px]">Specify Resellable vs Damaged stock</span>
            </div>
            <div className="divide-y divide-slate-100">
              {invoice.lines.map((line) => {
                const alreadyReturned = alreadyReturnedMap.get(line.id) || 0;
                const origQty = parseFloat(line.quantity);
                const maxAvailable = Math.max(0, origQty - alreadyReturned);
                const state = returnStates[line.id] || { resellableQty: '', damagedQty: '', reason: '' };
                const currentTotal = parseFloat(state.resellableQty || '0') + parseFloat(state.damagedQty || '0');
                const isItemExceeded = currentTotal > maxAvailable + 0.0001;

                return (
                  <div key={line.id} className="p-3.5 space-y-2.5 hover:bg-slate-50/50 transition">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span>{line.productNameSnapshot}</span>
                          <span className="font-mono text-[10px] text-slate-400 font-normal">[{line.skuSnapshot}]</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                          <span>Sold: {origQty.toFixed(3)} units @ ₹{line.unitPrice}</span>
                          <span>•</span>
                          <span>GST {line.gstRatePercent}%</span>
                          {alreadyReturned > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-amber-600 font-semibold">Prev returned: {alreadyReturned.toFixed(3)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-mono ${
                            maxAvailable === 0
                              ? 'bg-slate-100 text-slate-400'
                              : isItemExceeded
                              ? 'bg-rose-100 text-rose-700 border-rose-300'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          Max returnable: {maxAvailable.toFixed(3)}
                        </Badge>
                        {maxAvailable > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetMaxResellable(line.id, maxAvailable)}
                            className="h-6 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 cursor-pointer font-bold"
                          >
                            Return All
                          </Button>
                        )}
                      </div>
                    </div>

                    {maxAvailable > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div>
                          <label className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1 mb-1">
                            <PackageCheck className="h-3 w-3" />
                            <span>Resellable Qty (Restock)</span>
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max={maxAvailable}
                            step="any"
                            placeholder="0.000"
                            value={state.resellableQty}
                            onChange={(e) => handleUpdateItem(line.id, 'resellableQty', e.target.value)}
                            className="h-7 text-xs bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-rose-700 flex items-center gap-1 mb-1">
                            <PackageX className="h-3 w-3" />
                            <span>Damaged Qty (Write-off)</span>
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max={maxAvailable}
                            step="any"
                            placeholder="0.000"
                            value={state.damagedQty}
                            onChange={(e) => handleUpdateItem(line.id, 'damagedQty', e.target.value)}
                            className="h-7 text-xs bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                            Line Return Reason
                          </label>
                          <Input
                            type="text"
                            placeholder="Condition notes..."
                            value={state.reason}
                            onChange={(e) => handleUpdateItem(line.id, 'reason', e.target.value)}
                            className="h-7 text-xs bg-white"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic bg-slate-50 p-2 rounded-lg">
                        This line item has already been 100% returned. No further returns permitted.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Refund Settlement & Tender Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Overall Return Reason *
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full text-xs h-8 px-2.5 rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="Customer return / exchange">Customer return / exchange</option>
                  <option value="Defective / Damaged goods">Defective / Damaged goods</option>
                  <option value="Expired / Past shelf life">Expired / Past shelf life</option>
                  <option value="Wrong product billed">Wrong product billed</option>
                  <option value="Customer dissatisfied with quality">Customer dissatisfied with quality</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Customer Refund Method *
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRefundMethod('cash')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition flex items-center justify-center gap-1.5 ${
                      refundMethod === 'cash'
                        ? 'bg-rose-50 border-rose-400 text-rose-800 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Coins className="h-3 w-3" />
                    <span>Cash Refund</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRefundMethod('upi')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition flex items-center justify-center gap-1.5 ${
                      refundMethod === 'upi'
                        ? 'bg-rose-50 border-rose-400 text-rose-800 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>UPI Refund</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRefundMethod('card')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition flex items-center justify-center gap-1.5 ${
                      refundMethod === 'card'
                        ? 'bg-rose-50 border-rose-400 text-rose-800 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>Card Reversal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRefundMethod('credit')}
                    disabled={!invoice.customerId}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition flex items-center justify-center gap-1.5 ${
                      !invoice.customerId
                        ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400'
                        : refundMethod === 'credit'
                        ? 'bg-rose-50 border-rose-400 text-rose-800 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                    title={invoice.customerId ? 'Credit to customer Khata account' : 'Khata store credit only available for registered customers'}
                  >
                    <span>Khata Store Credit</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Refund Reference (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="UPI transaction ID, ARN, or memo..."
                  value={refundReference}
                  onChange={(e) => setRefundReference(e.target.value)}
                  className="h-8 text-xs bg-white"
                />
              </div>
            </div>

            {/* Refund Financial Summary Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">
                  Credit Note Refund Summary
                </span>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Resellable Restock Qty:</span>
                    <span className="font-mono font-bold text-emerald-700">{totalResellable.toFixed(3)} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Damaged / Written-off Qty:</span>
                    <span className="font-mono font-bold text-rose-700">{totalDamaged.toFixed(3)} units</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5">
                    <span>Taxable Return Value:</span>
                    <span className="font-mono">₹{(totalTaxableCents / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST Tax Refund:</span>
                    <span className="font-mono">₹{(totalGstCents / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-300 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Total Refund Amount</span>
                  <span className="text-[10px] text-slate-400">Nearest ₹1 rounded (Sec 170)</span>
                </div>
                <div className="text-xl font-black font-mono text-rose-600">
                  ₹{(grandTotalCents / 100).toFixed(2)}
                </div>
              </div>
            </div>
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
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={!hasAnyItems || isOverLimit || isSubmitting}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Posting Return...</span>
              </>
            ) : (
              <>
                <Receipt className="h-3.5 w-3.5" />
                <span>Confirm & Issue Credit Note (₹{(grandTotalCents / 100).toFixed(2)})</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

