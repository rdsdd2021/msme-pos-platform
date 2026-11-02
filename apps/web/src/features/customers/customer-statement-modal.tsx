'use client';

import React from 'react';
import { Customer, CustomerStatementResponse } from '@/lib/api-client';
import {
  FileText,
  Printer,
  Download,
  Coins,
  X,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface CustomerStatementModalProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
  statement: CustomerStatementResponse | null;
  loading?: boolean;
  error?: string;
  from: string;
  to: string;
  setFrom: (val: string) => void;
  setTo: (val: string) => void;
  onFilter: () => void;
  onOpenRepayment: (customer: Customer) => void;
  onPrint: () => void;
  onExportCsv: () => void;
}

export function CustomerStatementModal({
  open,
  onClose,
  customer,
  statement,
  loading,
  error,
  from,
  to,
  setFrom,
  setTo,
  onFilter,
  onOpenRepayment,
  onPrint,
  onExportCsv,
}: CustomerStatementModalProps) {
  if (!customer) return null;

  const hasBalance = parseFloat(customer.currentBalance || '0') > 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <DialogHeader className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-row justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <DialogTitle className="font-semibold text-base text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
                  <FileText className="h-4 w-4" />
                </div>
                <span>Khata Ledger Statement — {customer.name}</span>
              </DialogTitle>
              {statement && (
                <Badge
                  variant="outline"
                  className={`text-[10px] font-bold uppercase ${
                    statement.customer.creditStatus === 'healthy'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : statement.customer.creditStatus === 'near_limit'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : statement.customer.creditStatus === 'exceeded'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {statement.customer.creditStatus}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Phone: {customer.phone || '—'} | Credit Limit: ₹{customer.creditLimit} | Outstanding: ₹{customer.currentBalance}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => onOpenRepayment(customer)}
              disabled={!hasBalance}
              data-testid="statement-record-repayment-btn"
              className="h-8 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition"
              title={hasBalance ? 'Record Debt Repayment' : 'No outstanding balance to repay'}
            >
              <Coins className="h-3.5 w-3.5" />
              <span>Record Repayment</span>
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer text-sm"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Generating chronological statement & computing running balances...
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>⚠️ {error}</span>
            </div>
          ) : statement ? (
            <>
              {/* Ageing Breakdown Summary */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-2">
                  FIFO Outstanding Receivables Ageing Analysis
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-semibold block">0 - 30 Days (Current)</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{statement.customer.ageing.current}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-semibold block">31 - 60 Days</span>
                    <span className="font-mono font-bold text-amber-700">
                      ₹{statement.customer.ageing.days31To60}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-semibold block">61 - 90 Days</span>
                    <span className="font-mono font-bold text-amber-800">
                      ₹{statement.customer.ageing.days61To90}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-semibold block">90+ Days (Overdue)</span>
                    <span className="font-mono font-bold text-rose-700">
                      ₹{statement.customer.ageing.over90Days}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statement Period Filters */}
              <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 text-xs">
                <span className="font-semibold text-slate-600 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  Period:
                </span>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  data-testid="statement-from-date"
                  className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  data-testid="statement-to-date"
                  className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs"
                />
                <Button
                  size="sm"
                  onClick={onFilter}
                  data-testid="statement-filter-btn"
                  className="h-7 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold text-xs cursor-pointer"
                >
                  Apply Filter
                </Button>
              </div>

              {/* Period Balance Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <span className="text-[10px] text-slate-500 font-semibold block">Opening Balance</span>
                  <span className="font-mono font-bold text-slate-800">
                    ₹{statement.statement.openingBalance}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <span className="text-[10px] text-slate-500 font-semibold block">Total Invoiced (Debits)</span>
                  <span className="font-mono font-bold text-blue-700">
                    +₹{statement.statement.totalDebits}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <span className="text-[10px] text-slate-500 font-semibold block">Total Repayments (Credits)</span>
                  <span className="font-mono font-bold text-emerald-700">
                    -₹{statement.statement.totalCredits}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <span className="text-[10px] text-slate-500 font-semibold block">Closing / Current Balance</span>
                  <span className="font-mono font-bold text-rose-600">
                    ₹{statement.statement.closingBalance}
                  </span>
                </div>
              </div>

              {/* Statement Entries Timeline Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs" data-testid="statement-table">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-2.5">Date & Time</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Reference</th>
                      <th className="p-2.5">Tender</th>
                      <th className="p-2.5 text-right">Debit (+)</th>
                      <th className="p-2.5 text-right">Credit (-)</th>
                      <th className="p-2.5 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Opening Balance Row */}
                    <tr className="bg-slate-50/50 font-medium">
                      <td className="p-2.5 font-mono text-slate-500">
                        {statement.statement.from || 'Start of Record'}
                      </td>
                      <td className="p-2.5 uppercase font-bold text-[10px] text-slate-600">Opening Balance</td>
                      <td className="p-2.5 text-slate-400">—</td>
                      <td className="p-2.5 text-slate-400">—</td>
                      <td className="p-2.5 text-right font-mono text-slate-400">—</td>
                      <td className="p-2.5 text-right font-mono text-slate-400">—</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                        ₹{statement.statement.openingBalance}
                      </td>
                    </tr>

                    {statement.statement.entries.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400">
                          No ledger entries in this statement window.
                        </td>
                      </tr>
                    ) : (
                      statement.statement.entries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-mono text-slate-600">
                            {new Date(entry.occurredAt).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                entry.entryType === 'invoice_debit'
                                  ? 'bg-blue-100 text-blue-800'
                                  : entry.entryType === 'payment_credit'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {entry.entryType.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono text-slate-600 truncate max-w-[120px]" title={entry.notes || ''}>
                            {entry.notes || entry.sourceId || entry.idempotencyKey || '—'}
                          </td>
                          <td className="p-2.5 uppercase font-mono text-slate-500">
                            {entry.paymentMethod || '—'}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-blue-700">
                            {parseFloat(entry.debit) > 0 ? `₹${entry.debit}` : '—'}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                            {parseFloat(entry.credit) > 0 ? `₹${entry.credit}` : '—'}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                            ₹{entry.runningBalance}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrint}
              data-testid="print-statement-btn"
              className="h-8 px-3 bg-white border-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Statement</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExportCsv}
              data-testid="export-statement-csv-btn"
              className="h-8 px-3 bg-white border-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={() => onOpenRepayment(customer)}
              disabled={!hasBalance}
              data-testid="statement-footer-repay-btn"
              className="h-8 px-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1.5 transition"
            >
              <Coins className="h-3.5 w-3.5" />
              <span>Record Repayment</span>
            </Button>
            <Button
              size="sm"
              onClick={onClose}
              className="h-8 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
