'use client';

import React from 'react';
import { Customer, CustomerHistoryResponse } from '@/lib/api-client';
import { History, X, AlertTriangle, FileText, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export interface CustomerDossierModalProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
  loading: boolean;
  data: CustomerHistoryResponse | null;
  error?: string;
}

export function CustomerDossierModal({
  open,
  onClose,
  customer,
  loading,
  data,
  error,
}: CustomerDossierModalProps) {
  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden flex flex-col max-h-[90vh]" data-testid="customer-history-modal">
        {/* Header */}
        <DialogHeader className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-row justify-between items-start">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
              Lifetime Customer Dossier
            </span>
            <DialogTitle className="text-lg font-bold text-slate-900 mt-1">
              {customer.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-mono mt-0.5">
              📞 {customer.phone || 'No phone'} | 🆔 {customer.id}
              {customer.gstin ? ` | GSTIN: ${customer.gstin}` : ''}
            </DialogDescription>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {loading && (
            <div className="p-10 text-center text-slate-400 text-xs">
              <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading comprehensive customer history...
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>⚠️ {error}</span>
            </div>
          )}

          {!loading && data && (
            <div className="space-y-4">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Invoices Count</span>
                  <p className="text-lg font-black text-slate-900 mt-0.5">
                    {data.lifetimeStats.totalInvoicesCount}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Lifetime Spend</span>
                  <p className="text-lg font-black text-emerald-700 mt-0.5 font-mono">
                    ₹{data.lifetimeStats.totalPurchasesValue}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Total Repayments</span>
                  <p className="text-lg font-black text-blue-700 mt-0.5 font-mono">
                    ₹{data.lifetimeStats.totalRepaymentsValue}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Current Outstanding</span>
                  <p className="text-lg font-black text-amber-700 mt-0.5 font-mono">
                    ₹{data.lifetimeStats.currentOutstandingBalance}
                  </p>
                </div>
              </div>

              {/* Invoices List */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Invoices ({data.invoices.length})
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold sticky top-0">
                      <tr>
                        <th className="p-2">Invoice #</th>
                        <th className="p-2">Date</th>
                        <th className="p-2 text-right">Grand Total</th>
                        <th className="p-2 text-center">Status</th>
                        <th className="p-2 text-center">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.invoices.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400">
                            No invoices recorded.
                          </td>
                        </tr>
                      ) : (
                        data.invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50">
                            <td className="p-2 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                            <td className="p-2 text-slate-600">{new Date(inv.createdAt).toLocaleString('en-IN')}</td>
                            <td className="p-2 text-right font-mono font-bold text-slate-900">₹{inv.grandTotal}</td>
                            <td className="p-2 text-center">
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold uppercase">
                                {inv.status}
                              </Badge>
                            </td>
                            <td className="p-2 text-center">
                              <Badge variant="outline" className="text-[10px] font-bold uppercase text-slate-700">
                                {inv.paymentStatus}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ledger Entries */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Financial Ledger Entries ({data.ledgerEntries.length})
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold sticky top-0">
                      <tr>
                        <th className="p-2">Timestamp</th>
                        <th className="p-2">Type</th>
                        <th className="p-2 text-right">Debit (+)</th>
                        <th className="p-2 text-right">Credit (-)</th>
                        <th className="p-2">Tender</th>
                        <th className="p-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.ledgerEntries.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-400">
                            No ledger transactions.
                          </td>
                        </tr>
                      ) : (
                        data.ledgerEntries.map((l) => (
                          <tr key={l.id} className="hover:bg-slate-50">
                            <td className="p-2 font-mono text-[11px] text-slate-600">
                              {new Date(l.occurredAt).toLocaleString('en-IN')}
                            </td>
                            <td className="p-2">
                              <span className="font-semibold text-slate-800">{l.entryType}</span>
                            </td>
                            <td className="p-2 text-right font-mono text-rose-600 font-bold">
                              {parseFloat(l.debit) > 0 ? `+₹${l.debit}` : '—'}
                            </td>
                            <td className="p-2 text-right font-mono text-emerald-700 font-bold">
                              {parseFloat(l.credit) > 0 ? `-₹${l.credit}` : '—'}
                            </td>
                            <td className="p-2 font-mono text-[11px] uppercase text-slate-500">
                              {l.paymentMethod || '—'}
                            </td>
                            <td className="p-2 text-slate-500 text-[11px] truncate max-w-xs">{l.notes || '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <Button
            size="sm"
            onClick={onClose}
            className="h-8 px-4 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 cursor-pointer"
          >
            Close Dossier
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

