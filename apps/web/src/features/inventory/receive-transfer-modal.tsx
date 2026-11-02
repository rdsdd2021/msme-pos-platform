'use client';

import React, { useState, useEffect } from 'react';
import { StockTransfer, ReceiveStockTransferRequest } from '@/lib/api-client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  PackageCheck,
  CheckCheck,
} from 'lucide-react';

interface ReceiveTransferModalProps {
  open: boolean;
  onClose: () => void;
  transfer: StockTransfer | null;
  onSubmit: (transferId: string, dto: ReceiveStockTransferRequest) => Promise<void>;
}

export function ReceiveTransferModal({
  open,
  onClose,
  transfer,
  onSubmit,
}: ReceiveTransferModalProps) {
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [lineReasons, setLineReasons] = useState<Record<string, string>>({});
  const [overallReason, setOverallReason] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (transfer?.lines) {
      const initQty: Record<string, string> = {};
      transfer.lines.forEach((l) => {
        initQty[l.id] = l.quantityDispatched;
      });
      setQuantities(initQty);
      setLineReasons({});
      setOverallReason('');
      setNotes('');
      setError(null);
    }
  }, [transfer]);

  if (!transfer) return null;

  // Calculate variances
  const linesWithVariance = (transfer.lines || []).map((l) => {
    const received = parseFloat(quantities[l.id] || '0');
    const dispatched = parseFloat(l.quantityDispatched || '0');
    const diff = dispatched - received;
    return {
      line: l,
      received,
      dispatched,
      hasDiscrepancy: Math.abs(diff) > 0.0001,
      variance: diff,
    };
  });

  const hasAnyDiscrepancy = linesWithVariance.some((lv) => lv.hasDiscrepancy);

  const handleSetFullAll = () => {
    const fullQty: Record<string, string> = {};
    (transfer.lines || []).forEach((l) => {
      fullQty[l.id] = l.quantityDispatched;
    });
    setQuantities(fullQty);
    setLineReasons({});
    setOverallReason('');
    setError(null);
  };

  const handleSubmit = async () => {
    if (hasAnyDiscrepancy && !overallReason.trim()) {
      setError('Please provide a discrepancy reason explaining why received quantities differ from dispatched.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const items = (transfer.lines || []).map((l) => ({
        lineId: l.id,
        quantityReceived: quantities[l.id] || '0',
        discrepancyReason: lineReasons[l.id] || undefined,
      }));

      await onSubmit(transfer.id, {
        items,
        discrepancyReason: hasAnyDiscrepancy ? overallReason.trim() : undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to receive stock transfer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="receive-transfer-modal">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-emerald-600" />
            <span>Reconcile & Receive Inward Stock Transfer</span>
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Transfer Header Card */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                Transfer Number
              </span>
              <div className="font-mono font-bold text-slate-900 text-sm">
                {transfer.transferNumber}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-700">
                {transfer.sourceBranch?.name || transfer.sourceBranchId}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-bold text-emerald-700">
                {transfer.destinationBranch?.name || transfer.destinationBranchId}
              </span>
            </div>
            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
              IN TRANSIT
            </Badge>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Physical Receipt Verification
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            onClick={handleSetFullAll}
            data-testid="receive-all-full-btn"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Full Shipment (Match Dispatched)
          </Button>
        </div>

        {/* Lines Reconciliation Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-xs" data-testid="reconciliation-table">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 text-left">Product</th>
                <th className="py-2.5 px-3 text-right">Dispatched</th>
                <th className="py-2.5 px-3 text-right w-28">Received Count</th>
                <th className="py-2.5 px-3 text-center w-24">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {linesWithVariance.map(({ line, received, dispatched, hasDiscrepancy, variance }) => {
                const prod = line.product;
                return (
                  <React.Fragment key={line.id}>
                    <tr className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 font-medium text-slate-900">
                        {prod?.name || line.productId}
                        <span className="block text-[10px] text-slate-400 font-mono">
                          SKU: {prod?.sku || 'N/A'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-600">
                        {dispatched.toFixed(3)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          className="h-8 text-xs font-mono text-right w-24 ml-auto"
                          value={quantities[line.id] ?? line.quantityDispatched}
                          onChange={(e) =>
                            setQuantities({ ...quantities, [line.id]: e.target.value })
                          }
                          data-testid={`qty-received-input-${line.id}`}
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        {hasDiscrepancy ? (
                          <span className="inline-flex items-center gap-1 font-bold text-[11px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <AlertTriangle className="h-3 w-3" />
                            {variance > 0 ? `-${variance.toFixed(1)}` : `+${(-variance).toFixed(1)}`}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> Matched
                          </span>
                        )}
                      </td>
                    </tr>
                    {hasDiscrepancy && (
                      <tr className="bg-rose-50/40">
                        <td colSpan={4} className="px-3 pb-2 pt-0">
                          <Input
                            placeholder="Reason for line discrepancy (e.g. Broken carton, 1 jar leaked)"
                            className="text-xs h-7 bg-white border-rose-200 text-rose-900"
                            value={lineReasons[line.id] || ''}
                            onChange={(e) =>
                              setLineReasons({ ...lineReasons, [line.id]: e.target.value })
                            }
                            data-testid={`line-discrepancy-reason-${line.id}`}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Discrepancy Warning Banner */}
        {hasAnyDiscrepancy && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Stock Discrepancy Detected Between Dispatch and Physical Receipt</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              The received quantities differ from the dispatched shipment. Inward stock ledger movements will only record the actual verified physical counts, and an immutable discrepancy audit flag will be logged.
            </p>
            <div>
              <Label className="text-xs font-bold text-amber-900 mb-1 block">
                Mandatory Discrepancy Explanation:
              </Label>
              <Input
                className="text-xs bg-white border-amber-300 text-slate-900"
                placeholder="e.g. Package damaged in transit; 2 bottles broken"
                value={overallReason}
                onChange={(e) => setOverallReason(e.target.value)}
                data-testid="overall-discrepancy-reason"
              />
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <Label className="text-xs font-bold text-slate-700 mb-1 block">Receipt Memo / Notes</Label>
          <Input
            className="text-xs"
            placeholder="e.g. Received at receiving dock by Store Manager"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            data-testid="receive-notes-input"
          />
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
            onClick={handleSubmit}
            disabled={isSubmitting || (hasAnyDiscrepancy && !overallReason.trim())}
            data-testid="confirm-receive-btn"
          >
            <PackageCheck className="h-4 w-4" /> Confirm & Inward Stock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

