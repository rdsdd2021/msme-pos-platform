'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Invoice, Branch, Customer, apiClient } from '@/lib/api-client';
import { InvoiceDetailsModal } from './invoice-details-modal';
import {
  Receipt,
  Search,
  Printer,
  RefreshCw,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

interface RecentBillsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  branchId?: string;
  tenantName?: string;
  customers?: Customer[];
  branches?: Branch[];
}

export function RecentBillsModal({
  open,
  onOpenChange,
  tenantId,
  branchId,
  tenantName = 'Kirana Supermart',
  customers = [],
  branches = [],
}: RecentBillsModalProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Load invoices whenever modal opens or branch changes
  const loadInvoices = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getInvoices(tenantId, branchId);
      setInvoices(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [tenantId, branchId]);

  useEffect(() => {
    if (open) {
      loadInvoices();
    }
  }, [open, loadInvoices]);

  // Customer map
  const customerMap = useMemo(() => {
    const map = new Map<string, Customer>();
    customers.forEach((c) => map.set(c.id, c));
    return map;
  }, [customers]);

  // Branch map
  const branchMap = useMemo(() => {
    const map = new Map<string, Branch>();
    branches.forEach((b) => map.set(b.id, b));
    return map;
  }, [branches]);

  // Filtered invoices
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return invoices;
    const q = searchTerm.toLowerCase().trim();
    return invoices.filter((inv) => {
      const numMatch = inv.invoiceNumber.toLowerCase().includes(q);
      const cust = inv.customerId ? customerMap.get(inv.customerId) : null;
      const custMatch = cust && (cust.name.toLowerCase().includes(q) || (cust.phone && cust.phone.includes(q)));
      const itemMatch = inv.lines?.some(
        (l) => l.productNameSnapshot.toLowerCase().includes(q) || l.skuSnapshot.toLowerCase().includes(q)
      );
      return numMatch || custMatch || itemMatch;
    });
  }, [invoices, searchTerm, customerMap]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-2xl p-0 overflow-hidden bg-white max-h-[85vh] flex flex-col"
          data-testid="pos-recent-bills-modal"
        >
          {/* Header */}
          <DialogHeader className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Receipt className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <span>Recent Bills & Sales History</span>
                    <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-600 border-slate-200 font-mono">
                      F4
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-[11px] text-slate-500">
                    Lookup past bills, view line items, or reprint receipts for counter customers
                  </DialogDescription>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={loadInvoices}
                disabled={loading}
                className="h-8 text-xs bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50"
              >
                <RefreshCw className={`h-3 w-3 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
            </div>
          </DialogHeader>

          {/* Search bar */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search by Bill # (e.g. INV-...), Customer Name, or Phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs h-8 bg-white"
                data-testid="recent-bills-search"
                autoFocus
              />
            </div>
          </div>

          {/* Bills List / Table */}
          <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
            {loading ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
                <span>Loading recent bills from server...</span>
              </div>
            ) : error ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs text-center">
                ⚠️ {error}
              </div>
            ) : filtered.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs gap-1.5">
                <Receipt className="h-8 w-8 text-slate-300" />
                <span className="font-semibold text-slate-600">No bills found</span>
                <span className="text-[11px] text-slate-400">
                  {searchTerm ? 'Try a different search term' : 'No sales have been processed at this branch yet.'}
                </span>
              </div>
            ) : (
              filtered.map((inv) => {
                const cust = inv.customerId ? customerMap.get(inv.customerId) : null;
                const timeStr = new Date(inv.postedAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const dateStr = new Date(inv.postedAt).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <div
                    key={inv.id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-lg transition-colors cursor-pointer"
                    onClick={() => setSelectedInvoice(inv)}
                    data-testid={`recent-bill-item-${inv.invoiceNumber}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-700 flex flex-col items-center justify-center font-bold text-[10px] shrink-0 border border-emerald-100">
                        <span>{dateStr.split(' ')[1]}</span>
                        <span className="text-[9px] font-normal">{dateStr.split(' ')[0]}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900">
                            {inv.invoiceNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {timeStr}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {cust ? (
                            <span>{cust.name} {cust.phone ? `(${cust.phone})` : ''}</span>
                          ) : (
                            <span className="italic">Walk-in Customer</span>
                          )}
                          <span className="mx-1.5 text-slate-300">•</span>
                          <span>{inv.lines?.length || 0} item{(inv.lines?.length || 0) !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="font-mono font-black text-sm text-slate-900">
                          ₹{inv.grandTotal}
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            inv.paymentStatus === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] px-1.5 py-0 font-bold uppercase'
                              : 'bg-amber-50 text-amber-700 border-amber-200 text-[9px] px-1.5 py-0 font-bold uppercase'
                          }
                        >
                          {inv.paymentStatus}
                        </Badge>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInvoice(inv);
                        }}
                        className="h-8 px-2.5 text-xs gap-1 font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                        title="View Thermal Receipt / Reprint"
                        data-testid={`reprint-bill-${inv.invoiceNumber}`}
                      >
                        <Printer className="h-3.5 w-3.5 text-slate-500" />
                        <span className="hidden sm:inline">Receipt</span>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
            <span className="text-[11px] text-slate-400">
              Showing {filtered.length} of {invoices.length} recent bills
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8 cursor-pointer"
            >
              Close (Esc)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Details & Thermal Receipt Reprint Modal */}
      {selectedInvoice && (
        <InvoiceDetailsModal
          open={!!selectedInvoice}
          onOpenChange={(open) => {
            if (!open) setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
          branch={selectedInvoice.branchId ? branchMap.get(selectedInvoice.branchId) : null}
          tenantName={tenantName}
          tenantId={tenantId}
          onReturnSuccess={loadInvoices}
        />
      )}
    </>
  );
}

