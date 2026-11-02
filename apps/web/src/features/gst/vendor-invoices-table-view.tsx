'use client';

import React from 'react';
import { SupplierInvoice } from '@/lib/api-client';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface VendorInvoicesTableViewProps {
  invoices: SupplierInvoice[];
  onAddInvoice: () => void;
}

export function VendorInvoicesTableView({
  invoices,
  onAddInvoice,
}: VendorInvoicesTableViewProps) {
  return (
    <div className="space-y-4" data-testid="supplier-invoices-view">
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Vendor Tax Invoices (Input Tax Credit Proof)
          </h3>
          <p className="text-xs text-slate-500">
            Recorded vendor purchase tax bills supporting GSTR-3B Table 4 Input Tax Credit (ITC) statutory claims
          </p>
        </div>
        <Button
          onClick={onAddInvoice}
          data-testid="add-vendor-invoice-btn"
          size="sm"
          className="h-8 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Record Vendor Bill</span>
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-2.5">Supplier Bill #</th>
              <th className="p-2.5">Vendor Name</th>
              <th className="p-2.5">Date</th>
              <th className="p-2.5 text-right">Taxable (₹)</th>
              <th className="p-2.5 text-right">CGST (₹)</th>
              <th className="p-2.5 text-right">SGST (₹)</th>
              <th className="p-2.5 text-right">IGST (₹)</th>
              <th className="p-2.5 text-right">Total Invoice (₹)</th>
              <th className="p-2.5 text-center">ITC Eligibility</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50/80 font-mono text-[11px] transition-colors">
                <td className="p-2.5 font-bold text-slate-900">{inv.supplierInvoiceNumber}</td>
                <td className="p-2.5 font-sans font-medium text-slate-900">
                  {inv.supplier?.name || 'Unknown Supplier'}
                </td>
                <td className="p-2.5 text-slate-600">
                  {new Date(inv.supplierInvoiceDate).toLocaleDateString('en-IN')}
                </td>
                <td className="p-2.5 text-right font-semibold">₹{inv.subtotal}</td>
                <td className="p-2.5 text-right text-emerald-700">₹{inv.cgstAmount}</td>
                <td className="p-2.5 text-right text-emerald-700">₹{inv.sgstAmount}</td>
                <td className="p-2.5 text-right text-blue-700">₹{inv.igstAmount}</td>
                <td className="p-2.5 text-right font-bold text-slate-900">₹{inv.totalAmount}</td>
                <td className="p-2.5 text-center font-sans">
                  {inv.isItcEligible ? (
                    <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                      ✓ Eligible
                    </Badge>
                  ) : (
                    <Badge className="bg-rose-50 text-rose-800 border-rose-200 text-[10px] font-bold">
                      ✗ Ineligible
                    </Badge>
                  )}
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-400">
                  No vendor tax invoices recorded. Click &quot;Record Vendor Bill&quot; to capture inward purchase bills.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

