'use client';

import React, { useState } from 'react';
import { SalesRegisterResponse } from '@/lib/api-client';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface SalesRegisterTableViewProps {
  data: SalesRegisterResponse;
}

export function SalesRegisterTableView({ data }: SalesRegisterTableViewProps) {
  const [search, setSearch] = useState('');

  const filteredRecords = data.records.filter(
    (r) =>
      !search ||
      r.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (r.customerName && r.customerName.toLowerCase().includes(search.toLowerCase())) ||
      (r.customerGstin && r.customerGstin.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4" data-testid="sales-register-view">
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Complete Invoice-wise Sales and Tax Register
          </h3>
          <p className="text-xs text-slate-500">
            Chronological audit register of all posted customer invoices and outward GST line item summaries
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search invoice or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs h-9 pl-8 bg-white"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-2.5">Invoice #</th>
              <th className="p-2.5">Date</th>
              <th className="p-2.5">Branch</th>
              <th className="p-2.5">Customer &amp; GSTIN</th>
              <th className="p-2.5">POS</th>
              <th className="p-2.5 text-right">Taxable (₹)</th>
              <th className="p-2.5 text-right">CGST (₹)</th>
              <th className="p-2.5 text-right">SGST (₹)</th>
              <th className="p-2.5 text-right">IGST (₹)</th>
              <th className="p-2.5 text-right">Grand Total (₹)</th>
              <th className="p-2.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/80 font-mono text-[11px] transition-colors">
                <td className="p-2.5 text-emerald-700 font-bold">{r.invoiceNumber}</td>
                <td className="p-2.5 text-slate-600">{r.date}</td>
                <td className="p-2.5 font-sans text-slate-800">{r.branchName}</td>
                <td className="p-2.5 font-sans">
                  <div className="font-semibold text-slate-900">{r.customerName || 'Walk-in Customer'}</div>
                  {r.customerGstin && (
                    <div className="text-[10px] text-slate-500 font-mono">GSTIN: {r.customerGstin}</div>
                  )}
                </td>
                <td className="p-2.5 text-slate-700">{r.placeOfSupply}</td>
                <td className="p-2.5 text-right font-semibold">₹{r.taxableTotal}</td>
                <td className="p-2.5 text-right text-emerald-700">₹{r.cgstTotal}</td>
                <td className="p-2.5 text-right text-emerald-700">₹{r.sgstTotal}</td>
                <td className="p-2.5 text-right text-blue-700">₹{r.igstTotal}</td>
                <td className="p-2.5 text-right font-bold text-slate-900">₹{r.grandTotal}</td>
                <td className="p-2.5 text-center font-sans">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold uppercase ${
                      r.paymentStatus === 'PAID'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : r.paymentStatus === 'PARTIAL'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {r.paymentStatus}
                  </Badge>
                </td>
              </tr>
            ))}
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={11} className="p-8 text-center text-slate-400">
                  {search ? 'No invoices matching search.' : 'No invoices in this period.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

