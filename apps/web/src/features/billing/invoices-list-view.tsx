'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Invoice, Branch, Customer } from '@/lib/api-client';
import { InvoiceDetailsModal } from './invoice-details-modal';
import {
  Receipt,
  Search,
  Printer,
  Calendar,
  Filter,
  RefreshCw,
  Eye,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface InvoicesListViewProps {
  invoices: Invoice[];
  branches: Branch[];
  customers?: Customer[];
  activeBranchId?: string;
  tenantName?: string;
  tenantId?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function InvoicesListView({
  invoices,
  branches,
  customers = [],
  activeBranchId,
  tenantName = 'Kirana Supermart',
  tenantId = '',
  onRefresh,
  isLoading = false,
}: InvoicesListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Map customers for quick name resolution
  const customerMap = useMemo(() => {
    const map = new Map<string, Customer>();
    customers.forEach((c) => map.set(c.id, c));
    return map;
  }, [customers]);

  // Branch map for quick resolution
  const branchMap = useMemo(() => {
    const map = new Map<string, Branch>();
    branches.forEach((b) => map.set(b.id, b));
    return map;
  }, [branches]);

  // KPI Calculations
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    let totalAmount = 0;
    let todayCount = 0;
    let todayAmount = 0;

    invoices.forEach((inv) => {
      const amt = parseFloat(inv.grandTotal || '0');
      totalAmount += amt;
      if (inv.postedAt && inv.postedAt.startsWith(todayStr)) {
        todayCount++;
        todayAmount += amt;
      }
    });

    const avgTicket = invoices.length > 0 ? (totalAmount / invoices.length).toFixed(2) : '0.00';

    return {
      totalCount: invoices.length,
      totalAmount: totalAmount.toFixed(2),
      todayCount,
      todayAmount: todayAmount.toFixed(2),
      avgTicket,
    };
  }, [invoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter !== 'all' && inv.paymentStatus !== statusFilter) {
        return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const numMatch = inv.invoiceNumber.toLowerCase().includes(q);
        const cust = inv.customerId ? customerMap.get(inv.customerId) : null;
        const custMatch = cust && (cust.name.toLowerCase().includes(q) || (cust.phone && cust.phone.includes(q)));
        const itemMatch = inv.lines?.some(
          (l) => l.productNameSnapshot.toLowerCase().includes(q) || l.skuSnapshot.toLowerCase().includes(q)
        );
        return numMatch || custMatch || itemMatch;
      }

      return true;
    });
  }, [invoices, statusFilter, searchTerm, customerMap]);

  return (
    <div className="space-y-4" data-testid="invoices-list-view">
      {/* KPI Cards Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3.5 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Invoices
            </CardTitle>
            <Receipt className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent className="px-4 pb-3.5 pt-0">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.totalCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Posted sales receipts</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3.5 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Today&apos;s Bills
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="px-4 pb-3.5 pt-0">
            <div className="text-2xl font-black text-blue-700 tracking-tight">
              {stats.todayCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">₹{stats.todayAmount} collected today</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3.5 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Sales Volume
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="px-4 pb-3.5 pt-0">
            <div className="text-2xl font-black text-emerald-700 tracking-tight font-mono">
              ₹{stats.totalAmount}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Cumulative gross sales</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3.5 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Average Ticket
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent className="px-4 pb-3.5 pt-0">
            <div className="text-2xl font-black text-indigo-700 tracking-tight font-mono">
              ₹{stats.avgTicket}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Per-transaction value</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Status Filters */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by Bill #, Customer Name, Phone, or Item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs h-9"
            data-testid="invoices-search-input"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('paid')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                statusFilter === 'paid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Paid
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                statusFilter === 'pending' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Khata / Pending
            </button>
          </div>

          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-9 px-3 text-xs gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          )}
        </div>
      </div>

      {/* Invoices Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" data-testid="invoices-table">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3.5">Invoice # & Time</th>
                <th className="p-3.5">Branch</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Items</th>
                <th className="p-3.5">Payment Method</th>
                <th className="p-3.5 font-mono">Grand Total</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400">
                    <Receipt className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No bills found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {searchTerm ? 'No bills match your search criteria.' : 'No invoices have been recorded yet.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const cust = inv.customerId ? customerMap.get(inv.customerId) : null;
                  const br = branchMap.get(inv.branchId);

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/70 transition-colors"
                      data-testid={`invoice-row-${inv.invoiceNumber}`}
                    >
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 font-mono flex items-center gap-1.5">
                          <span>{inv.invoiceNumber}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(inv.postedAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="text-slate-700 font-medium">{br?.name || 'Main Branch'}</span>
                        <div className="text-[10px] text-slate-400 font-mono">{br?.code || 'MAIN'}</div>
                      </td>
                      <td className="p-3.5">
                        {cust ? (
                          <div>
                            <span className="font-semibold text-slate-900">{cust.name}</span>
                            {cust.phone && (
                              <div className="text-[10px] text-slate-400 font-mono">{cust.phone}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 font-medium italic">Walk-in Customer</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                          {inv.lines?.length || 0} item{(inv.lines?.length || 0) !== 1 ? 's' : ''}
                        </Badge>
                      </td>
                      <td className="p-3.5">
                        {inv.payments && inv.payments.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {inv.payments.map((p, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded text-[10px] font-medium capitalize"
                              >
                                {p.paymentMethod}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 font-mono text-sm">
                          ₹{inv.grandTotal}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Tax: ₹{(parseFloat(inv.cgstTotal || '0') + parseFloat(inv.sgstTotal || '0') + parseFloat(inv.igstTotal || '0')).toFixed(2)}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant="outline"
                          className={
                            inv.paymentStatus === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-2 py-0.5 font-bold uppercase'
                              : 'bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-2 py-0.5 font-bold uppercase'
                          }
                        >
                          {inv.paymentStatus}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedInvoice(inv)}
                          title="View Bill Details & Thermal Receipt"
                          data-testid={`view-invoice-${inv.invoiceNumber}`}
                          className="h-7 px-2 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" />
                          <span>View</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details & Reprint Modal */}
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
          onReturnSuccess={onRefresh}
        />
      )}
    </div>
  );
}

