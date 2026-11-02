'use client';

import React from 'react';
import { StockTransfer } from '@/lib/api-client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  AlertTriangle,
  Send,
  PackageCheck,
  XCircle,
  Clock,
  Calendar,
  FileText,
} from 'lucide-react';

interface TransferDetailsModalProps {
  open: boolean;
  onClose: () => void;
  transfer: StockTransfer | null;
  onOpenDispatch?: (transfer: StockTransfer) => void;
  onOpenReceive?: (transfer: StockTransfer) => void;
  onCancel?: (transferId: string) => Promise<void>;
}

export function TransferDetailsModal({
  open,
  onClose,
  transfer,
  onOpenDispatch,
  onOpenReceive,
  onCancel,
}: TransferDetailsModalProps) {
  if (!transfer) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-300">
            DRAFT
          </Badge>
        );
      case 'in_transit':
      case 'dispatched':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-bold">
            IN TRANSIT
          </Badge>
        );
      case 'received':
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold">
            RECEIVED
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-800 border-rose-300">
            CANCELLED
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="transfer-details-modal">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span>Stock Transfer Audit Dossier</span>
            </DialogTitle>
            {getStatusBadge(transfer.status)}
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Header metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div>
              <span className="font-bold text-slate-400 uppercase text-[10px] block">
                Transfer #
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {transfer.transferNumber}
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-400 uppercase text-[10px] block">
                Origin Branch
              </span>
              <span className="font-medium text-slate-800">
                {transfer.sourceBranch?.name || transfer.sourceBranchId}
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-400 uppercase text-[10px] block">
                Destination Branch
              </span>
              <span className="font-medium text-emerald-700 font-bold">
                {transfer.destinationBranch?.name || transfer.destinationBranchId}
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-400 uppercase text-[10px] block">
                Created At
              </span>
              <span className="text-slate-600 font-mono">
                {new Date(transfer.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Discrepancy Alert */}
          {transfer.hasDiscrepancy && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-900 text-xs">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Discrepancy Flagged On Receipt</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                {transfer.discrepancyReason || 'Physical counts verified at destination differed from dispatched quantities.'}
              </p>
            </div>
          )}

          {/* Timeline Audit Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
              <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Step 1: Created
              </div>
              <div className="font-semibold text-slate-800 mt-1">
                {new Date(transfer.createdAt).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                Requested: {transfer.totalItemsRequested} units
              </div>
            </div>

            <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
              <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <Send className="h-3 w-3 text-blue-500" /> Step 2: Dispatched
              </div>
              <div className="font-semibold text-slate-800 mt-1">
                {transfer.dispatchedAt ? new Date(transfer.dispatchedAt).toLocaleString() : 'Pending dispatch'}
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                Dispatched: {transfer.totalItemsDispatched || '0.000'} units
              </div>
            </div>

            <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
              <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <PackageCheck className="h-3 w-3 text-emerald-500" /> Step 3: Received
              </div>
              <div className="font-semibold text-slate-800 mt-1">
                {transfer.receivedAt ? new Date(transfer.receivedAt).toLocaleString() : 'In transit'}
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                Received: {transfer.totalItemsReceived || '0.000'} units
              </div>
            </div>
          </div>

          {/* Line items table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider">
              Manifest Line Items
            </div>
            <table className="w-full text-xs">
              <thead className="bg-slate-50/50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3 text-left">Product</th>
                  <th className="py-2 px-3 text-right">Requested</th>
                  <th className="py-2 px-3 text-right">Dispatched</th>
                  <th className="py-2 px-3 text-right">Received</th>
                  <th className="py-2 px-3 text-right">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(transfer.lines || []).map((line) => {
                  const req = parseFloat(line.quantityRequested);
                  const disp = parseFloat(line.quantityDispatched);
                  const rec = parseFloat(line.quantityReceived);
                  const variance = disp - rec;
                  return (
                    <tr key={line.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {line.product?.name || line.productId}
                        <span className="block text-[10px] text-slate-400 font-mono">
                          SKU: {line.product?.sku || 'N/A'}
                        </span>
                        {line.discrepancyReason && (
                          <span className="block text-[10px] text-rose-600 font-medium mt-0.5">
                            Note: {line.discrepancyReason}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-600">
                        {req.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                        {disp.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        {rec.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {line.hasDiscrepancy ? (
                          <span className="text-rose-600 font-bold">
                            {variance > 0 ? `-${variance.toFixed(1)}` : `+${(-variance).toFixed(1)}`}
                          </span>
                        ) : (
                          <span className="text-slate-400">0.0</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Notes */}
          {transfer.notes && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <span className="font-bold text-slate-500 uppercase text-[10px] block">
                Transfer Notes & Memos
              </span>
              <p className="text-slate-700 whitespace-pre-wrap">{transfer.notes}</p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 gap-2">
          {transfer.status === 'draft' && onOpenDispatch && (
            <Button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1 text-xs"
              onClick={() => {
                onClose();
                onOpenDispatch(transfer);
              }}
              data-testid="dossier-dispatch-btn"
            >
              <Send className="h-3.5 w-3.5" /> Dispatch Shipment
            </Button>
          )}

          {(transfer.status === 'in_transit' || transfer.status === 'dispatched') && onOpenReceive && (
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 text-xs"
              onClick={() => {
                onClose();
                onOpenReceive(transfer);
              }}
              data-testid="dossier-receive-btn"
            >
              <PackageCheck className="h-3.5 w-3.5" /> Receive & Reconcile
            </Button>
          )}

          {(transfer.status === 'draft' || transfer.status === 'in_transit') && onCancel && (
            <Button
              type="button"
              variant="outline"
              className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs gap-1"
              onClick={async () => {
                if (window.confirm('Are you sure you want to cancel this transfer? Any dispatched stock will be reversed.')) {
                  await onCancel(transfer.id);
                  onClose();
                }
              }}
              data-testid="dossier-cancel-btn"
            >
              <XCircle className="h-3.5 w-3.5" /> Cancel Transfer
            </Button>
          )}

          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

