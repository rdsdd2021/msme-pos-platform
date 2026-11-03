'use client';

import React, { useState } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PaymentMethod } from '@pos/shared-types';
import {
  RestaurantOrder,
  RestaurantSplitPayment,
  apiClient,
} from '@/lib/api-client';
import {
  Receipt,
  CreditCard,
  Banknote,
  QrCode,
  Users,
  CheckCircle2,
  Printer,
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-react';

interface SplitBillModalProps {
  order: RestaurantOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettlementSuccess: () => void;
}

type SplitMode = 'single' | 'equal' | 'custom';

export function SplitBillModal({
  order,
  open,
  onOpenChange,
  onSettlementSuccess,
}: SplitBillModalProps) {
  const [splitMode, setSplitMode] = useState<SplitMode>('single');
  const [singleMethod, setSingleMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [cashTendered, setCashTendered] = useState<string>(order.grandTotal);
  const [guestCount, setGuestCount] = useState<number>(order.guestCount || 2);
  const [customSplits, setCustomSplits] = useState<RestaurantSplitPayment[]>([
    { paymentMethod: PaymentMethod.CASH, amount: order.grandTotal },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settledInvoice, setSettledInvoice] = useState<any | null>(null);

  const grandTotalNum = parseFloat(order.grandTotal) || 0;

  // Handle Equal Split initialization
  const generateEqualSplits = (count: number): RestaurantSplitPayment[] => {
    if (count <= 0) return [];
    const perGuest = Math.floor((grandTotalNum / count) * 100) / 100;
    const remainder = Math.round((grandTotalNum - perGuest * count) * 100) / 100;

    const splits: RestaurantSplitPayment[] = [];
    for (let i = 0; i < count; i++) {
      // Add remainder to the first guest so sum is exact
      const amount = (i === 0 ? perGuest + remainder : perGuest).toFixed(2);
      splits.push({
        paymentMethod: PaymentMethod.UPI,
        amount,
        externalReference: `Guest #${i + 1}`,
      });
    }
    return splits;
  };

  const handleModeChange = (mode: SplitMode) => {
    setSplitMode(mode);
    setError(null);
    if (mode === 'equal') {
      setCustomSplits(generateEqualSplits(guestCount));
    } else if (mode === 'custom') {
      setCustomSplits([
        { paymentMethod: PaymentMethod.CASH, amount: (grandTotalNum / 2).toFixed(2) },
        { paymentMethod: PaymentMethod.UPI, amount: (grandTotalNum - grandTotalNum / 2).toFixed(2) },
      ]);
    }
  };

  const handleGuestCountChange = (count: number) => {
    const validCount = Math.max(1, count);
    setGuestCount(validCount);
    if (splitMode === 'equal') {
      setCustomSplits(generateEqualSplits(validCount));
    }
  };

  const handleUpdateSplit = (
    index: number,
    field: keyof RestaurantSplitPayment,
    value: any,
  ) => {
    const updated = [...customSplits];
    updated[index] = { ...updated[index], [field]: value };
    setCustomSplits(updated);
  };

  const handleAddSplitLine = () => {
    const currentSum = customSplits.reduce((acc, s) => acc + (parseFloat(s.amount) || 0), 0);
    const remaining = Math.max(0, Math.round((grandTotalNum - currentSum) * 100) / 100).toFixed(2);
    setCustomSplits([
      ...customSplits,
      { paymentMethod: PaymentMethod.CASH, amount: remaining },
    ]);
  };

  const handleRemoveSplitLine = (index: number) => {
    if (customSplits.length <= 1) return;
    setCustomSplits(customSplits.filter((_, i) => i !== index));
  };

  // Validation
  const totalSplitsSum = customSplits.reduce(
    (acc, s) => acc + (parseFloat(s.amount) || 0),
    0,
  );
  const isSumValid =
    splitMode === 'single' ||
    Math.abs(Math.round(totalSplitsSum * 100) - Math.round(grandTotalNum * 100)) <= 1;

  const cashChange =
    splitMode === 'single' && singleMethod === PaymentMethod.CASH
      ? Math.max(0, (parseFloat(cashTendered) || 0) - grandTotalNum).toFixed(2)
      : '0.00';

  const handleSettle = async () => {
    setError(null);
    if (!isSumValid) {
      setError(`Split payments sum (₹${totalSplitsSum.toFixed(2)}) must match Grand Total (₹${grandTotalNum.toFixed(2)})`);
      return;
    }

    setIsSubmitting(true);
    try {
      let payload;
      if (splitMode === 'single') {
        payload = {
          orderId: order.id,
          paymentMethod: singleMethod,
          isSplit: false,
          cashTendered: singleMethod === PaymentMethod.CASH ? cashTendered : undefined,
          customerId: order.customerId || undefined,
        };
      } else {
        payload = {
          orderId: order.id,
          paymentMethod: customSplits[0].paymentMethod,
          isSplit: true,
          splitPayments: customSplits.map((s) => ({
            paymentMethod: s.paymentMethod,
            amount: s.amount,
            externalReference: s.externalReference || undefined,
          })),
          customerId: order.customerId || undefined,
        };
      }

      const res = await apiClient.settleRestaurantOrder(order.tenantId, order.branchId, payload);
      setSettledInvoice(res.invoice);
      onSettlementSuccess();
    } catch (err: any) {
      setError(err?.message || 'Failed to settle order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Receipt className="w-5 h-5 text-emerald-600" />
            {settledInvoice ? 'Bill Settled Successfully' : 'Table Settlement & Checkout'}
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-slate-500 pt-1">
            <span>Table: <strong className="text-slate-800">{order.tableNumberSnapshot || 'Takeaway'}</strong></span>
            <span>•</span>
            <span>Order #{order.orderNumber}</span>
            <span>•</span>
            <span>Guests: {order.guestCount}</span>
          </div>
        </DialogHeader>

        {settledInvoice ? (
          <div className="space-y-4 py-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-emerald-950">Payment Confirmed</h3>
              <p className="text-sm text-emerald-800">
                Invoice #{settledInvoice.invoiceNumber} posted to central ledger. Table has been marked vacant.
              </p>
              <div className="mt-2 text-2xl font-black text-emerald-900">
                ₹{parseFloat(order.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Receipt Summary Card */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-2 text-sm font-mono">
              <div className="flex justify-between border-b pb-1 font-bold">
                <span>ITEM</span>
                <span>QTY x PRICE = TOTAL</span>
              </div>
              {order.lines?.map((line) => (
                <div key={line.id} className="flex justify-between text-xs py-0.5">
                  <span className="truncate max-w-[200px]">{line.productNameSnapshot}</span>
                  <span>{parseFloat(line.quantity).toFixed(0)} x ₹{parseFloat(line.unitPrice).toFixed(2)} = ₹{parseFloat(line.lineTotal).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>₹{parseFloat(order.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (5% Restaurant):</span>
                  <span>₹{parseFloat(order.taxTotal).toFixed(2)}</span>
                </div>
                {parseFloat(order.discountTotal) > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>-₹{parseFloat(order.discountTotal).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base border-t pt-1 text-slate-900">
                  <span>Grand Total:</span>
                  <span>₹{parseFloat(order.grandTotal).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2 sm:justify-between">
              <Button variant="outline" onClick={handlePrint} className="gap-2">
                <Printer className="w-4 h-4" /> Print Tax Receipt
              </Button>
              <Button onClick={() => onOpenChange(false)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {/* Bill Summary Banner */}
            <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Payable Amount</p>
                <p className="text-3xl font-black tracking-tight text-emerald-400">
                  ₹{grandTotalNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  Subtotal: ₹{parseFloat(order.subtotal).toFixed(2)} + GST (5%): ₹{parseFloat(order.taxTotal).toFixed(2)}
                </p>
              </div>
              <Badge variant="outline" className="bg-slate-800 text-slate-200 border-slate-700 px-3 py-1 text-xs">
                {order.lines?.length || 0} Items
              </Badge>
            </div>

            {/* Split Mode Selector */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => handleModeChange('single')}
                className={`py-2 px-3 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  splitMode === 'single'
                    ? 'bg-white shadow text-slate-900 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" /> Single Pay
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('equal')}
                className={`py-2 px-3 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  splitMode === 'equal'
                    ? 'bg-white shadow text-slate-900 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Equal Split
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('custom')}
                className={`py-2 px-3 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  splitMode === 'custom'
                    ? 'bg-white shadow text-slate-900 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" /> Custom Split
              </button>
            </div>

            {/* Mode 1: Single Payment */}
            {splitMode === 'single' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700">Payment Tender</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { method: PaymentMethod.CASH, label: 'Cash', icon: Banknote },
                      { method: PaymentMethod.UPI, label: 'UPI / QR', icon: QrCode },
                      { method: PaymentMethod.CARD, label: 'Card / POS', icon: CreditCard },
                      { method: PaymentMethod.CREDIT, label: 'Khata', icon: Receipt },
                    ].map(({ method, label, icon: Icon }) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setSingleMethod(method)}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium gap-1.5 transition-all ${
                          singleMethod === method
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-sm'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {singleMethod === PaymentMethod.CASH && (
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border">
                    <div>
                      <Label className="text-xs font-semibold text-slate-700">Cash Tendered (₹)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={cashTendered}
                        onChange={(e) => setCashTendered(e.target.value)}
                        className="mt-1 font-bold text-slate-900 bg-white"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-700">Change Due (₹)</Label>
                      <div className="mt-1 h-9 px-3 flex items-center font-bold text-emerald-700 bg-emerald-100 rounded-md">
                        ₹{cashChange}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: Equal Split */}
            {splitMode === 'equal' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-500" /> Number of Diners:
                  </span>
                  <div className="flex items-center gap-2">
                    {[2, 3, 4, 5, 6].map((num) => (
                      <Button
                        key={num}
                        type="button"
                        size="sm"
                        variant={guestCount === num ? 'default' : 'outline'}
                        className={`h-7 w-7 p-0 text-xs ${guestCount === num ? 'bg-emerald-600' : ''}`}
                        onClick={() => handleGuestCountChange(num)}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {customSplits.map((split, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border text-xs"
                    >
                      <span className="font-semibold text-slate-700 w-16">Guest #{idx + 1}</span>
                      <Select
                        value={split.paymentMethod}
                        onValueChange={(val) => handleUpdateSplit(idx, 'paymentMethod', val)}
                      >
                        <SelectTrigger className="w-28 h-8 text-xs bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={PaymentMethod.CASH}>Cash</SelectItem>
                          <SelectItem value={PaymentMethod.UPI}>UPI</SelectItem>
                          <SelectItem value={PaymentMethod.CARD}>Card</SelectItem>
                          <SelectItem value={PaymentMethod.CREDIT}>Khata</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="font-mono font-bold text-slate-900 ml-auto text-sm">
                        ₹{parseFloat(split.amount).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mode 3: Custom Split */}
            {splitMode === 'custom' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">Tender Allocations</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={handleAddSplitLine}
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Split Line
                  </Button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {customSplits.map((split, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border">
                      <Select
                        value={split.paymentMethod}
                        onValueChange={(val) => handleUpdateSplit(idx, 'paymentMethod', val)}
                      >
                        <SelectTrigger className="w-28 h-8 text-xs bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={PaymentMethod.CASH}>Cash</SelectItem>
                          <SelectItem value={PaymentMethod.UPI}>UPI</SelectItem>
                          <SelectItem value={PaymentMethod.CARD}>Card</SelectItem>
                          <SelectItem value={PaymentMethod.CREDIT}>Khata</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        step="0.01"
                        value={split.amount}
                        onChange={(e) => handleUpdateSplit(idx, 'amount', e.target.value)}
                        className="h-8 text-xs font-mono font-bold bg-white"
                        placeholder="Amount"
                      />
                      <Input
                        type="text"
                        value={split.externalReference || ''}
                        onChange={(e) => handleUpdateSplit(idx, 'externalReference', e.target.value)}
                        className="h-8 text-xs bg-white"
                        placeholder="Ref / Note"
                      />
                      {customSplits.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                          onClick={() => handleRemoveSplitLine(idx)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Split Balance Check */}
                <div className={`p-2.5 rounded-lg text-xs flex justify-between font-medium ${
                  isSumValid ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  <span>Allocated: ₹{totalSplitsSum.toFixed(2)} of ₹{grandTotalNum.toFixed(2)}</span>
                  <span>{isSumValid ? '✓ Balanced' : `Diff: ₹${Math.abs(grandTotalNum - totalSplitsSum).toFixed(2)}`}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <DialogFooter className="flex sm:justify-between items-center pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSettle}
                disabled={isSubmitting || !isSumValid}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 px-6"
              >
                {isSubmitting ? 'Posting Ledger...' : `Complete Settlement (₹${grandTotalNum.toFixed(2)})`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
