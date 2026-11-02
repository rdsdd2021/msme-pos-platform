'use client';

import React, { useState } from 'react';
import { Product, Branch, CreateStockTransferRequest } from '@/lib/api-client';
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
import { ArrowRight, Plus, Trash2, AlertCircle, Send, ArrowRightLeft } from 'lucide-react';

interface CreateTransferModalProps {
  open: boolean;
  onClose: () => void;
  branches: Branch[];
  products: Product[];
  currentBranchId: string;
  stockMap: Map<string, string>;
  onSubmit: (dto: CreateStockTransferRequest) => Promise<void>;
}

interface TransferLineForm {
  productId: string;
  quantityRequested: string;
  notes?: string;
}

export function CreateTransferModal({
  open,
  onClose,
  branches,
  products,
  currentBranchId,
  stockMap,
  onSubmit,
}: CreateTransferModalProps) {
  const [sourceBranchId, setSourceBranchId] = useState(currentBranchId);
  const [destinationBranchId, setDestinationBranchId] = useState('');
  const [notes, setNotes] = useState('');
  const [autoDispatch, setAutoDispatch] = useState(false);
  const [lines, setLines] = useState<TransferLineForm[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available destination branches (excluding source)
  const availableDestBranches = branches.filter((b) => b.id !== sourceBranchId);

  const handleAddLine = () => {
    if (!selectedProductId) {
      setError('Please select a product to transfer');
      return;
    }
    const qty = parseFloat(selectedQuantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Please enter a valid positive quantity');
      return;
    }

    // Check if already in lines
    const existingIndex = lines.findIndex((l) => l.productId === selectedProductId);
    if (existingIndex >= 0) {
      const updated = [...lines];
      const prevQty = parseFloat(updated[existingIndex].quantityRequested);
      updated[existingIndex].quantityRequested = (prevQty + qty).toFixed(3);
      setLines(updated);
    } else {
      setLines([...lines, { productId: selectedProductId, quantityRequested: qty.toFixed(3) }]);
    }

    setSelectedProductId('');
    setSelectedQuantity('1');
    setError(null);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!destinationBranchId) {
      setError('Please select a destination branch');
      return;
    }
    if (sourceBranchId === destinationBranchId) {
      setError('Source and destination branches cannot be the same');
      return;
    }
    if (lines.length === 0) {
      setError('Please add at least one product line item to transfer');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        sourceBranchId,
        destinationBranchId,
        notes: notes.trim() || undefined,
        autoDispatch,
        lines: lines.map((l) => ({
          productId: l.productId,
          quantityRequested: l.quantityRequested,
        })),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create stock transfer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="create-transfer-modal">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-blue-600" />
            <span>Initiate Inter-Branch Stock Transfer</span>
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4 pt-1">
          {/* Branch Route Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <Label className="text-xs font-bold text-slate-700 mb-1.5 block">
                Origin (Source Branch)
              </Label>
              <select
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                value={sourceBranchId}
                onChange={(e) => {
                  setSourceBranchId(e.target.value);
                  if (destinationBranchId === e.target.value) {
                    setDestinationBranchId('');
                  }
                }}
                data-testid="source-branch-select"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700 mb-1.5 block">
                Destination Branch
              </Label>
              <select
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                value={destinationBranchId}
                onChange={(e) => setDestinationBranchId(e.target.value)}
                data-testid="dest-branch-select"
              >
                <option value="">-- Select Destination Branch --</option>
                {availableDestBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Add Line Items Section */}
          <div className="border border-slate-200 rounded-xl p-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Add Products To Transfer
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-8">
                <select
                  className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  data-testid="transfer-product-picker"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map((p) => {
                    const onHand = stockMap.get(p.id) || '0';
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} (SKU: {p.sku}) — Available: {onHand}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Input
                  type="number"
                  min="0.001"
                  step="any"
                  className="h-9 text-xs font-mono"
                  placeholder="Qty"
                  value={selectedQuantity}
                  onChange={(e) => setSelectedQuantity(e.target.value)}
                  data-testid="transfer-qty-input"
                />
              </div>
              <div className="sm:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-9 text-xs font-semibold gap-1"
                  onClick={handleAddLine}
                  data-testid="add-transfer-line-btn"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </div>
            </div>

            {/* Line Items List */}
            {lines.length > 0 ? (
              <div className="border border-slate-100 rounded-lg overflow-hidden mt-2">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 text-left">Product</th>
                      <th className="py-2 px-3 text-right">Requested Qty</th>
                      <th className="py-2 px-3 text-center w-12">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lines.map((line, idx) => {
                      const prod = products.find((p) => p.id === line.productId);
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-medium text-slate-800">
                            {prod?.name || line.productId}
                            <span className="block text-[10px] text-slate-400 font-mono">
                              SKU: {prod?.sku || 'N/A'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            {line.quantityRequested}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              className="text-slate-400 hover:text-rose-600 p-1 transition"
                              onClick={() => handleRemoveLine(idx)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                No products added yet. Select a product above to add to this transfer.
              </div>
            )}
          </div>

          {/* Notes & Options */}
          <div>
            <Label className="text-xs font-bold text-slate-700 mb-1 block">
              Transfer Notes / Dispatch Memo
            </Label>
            <Input
              className="text-xs"
              placeholder="e.g. Replenishment for weekend rush; Driver: Rajan"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              data-testid="transfer-notes-input"
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <input
              type="checkbox"
              id="autoDispatchCheckbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              checked={autoDispatch}
              onChange={(e) => setAutoDispatch(e.target.checked)}
              data-testid="auto-dispatch-checkbox"
            />
            <label htmlFor="autoDispatchCheckbox" className="text-xs text-blue-900 cursor-pointer">
              <span className="font-bold">Dispatch Immediately:</span> Deduct stock from origin branch right away and set status to <span className="font-semibold">IN_TRANSIT</span>.
            </label>
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1.5"
            onClick={handleSubmit}
            disabled={isSubmitting || lines.length === 0 || !destinationBranchId}
            data-testid="submit-create-transfer-btn"
          >
            {autoDispatch ? (
              <>
                <Send className="h-4 w-4" /> Create & Dispatch
              </>
            ) : (
              'Save Transfer Order'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

