'use client';

import React, { useState } from 'react';
import { Customer } from '@/lib/api-client';
import {
  Users,
  Search,
  Plus,
  IndianRupee,
  AlertCircle,
  FileText,
  History,
  GitMerge,
  Coins,
  Settings2,
  Brush,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CustomerDirectoryProps {
  customers: Customer[];
  onAddCustomer: () => void;
  onCleanDevCustomers: () => void;
  onRefresh: () => void;
  onOpenStatement: (customer: Customer) => void;
  onOpenHistory: (customer: Customer) => void;
  onOpenMerge: (customer: Customer) => void;
  onOpenRepayment: (customer: Customer) => void;
  onOpenCreditLimit: (customer: Customer) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'C';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function CustomerDirectory({
  customers,
  onAddCustomer,
  onCleanDevCustomers,
  onRefresh,
  onOpenStatement,
  onOpenHistory,
  onOpenMerge,
  onOpenRepayment,
  onOpenCreditLimit,
}: CustomerDirectoryProps) {
  const [search, setSearch] = useState('');

  const filteredCustomers = customers.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search))
  );

  const totalOutstanding = customers.reduce(
    (sum, c) => sum + parseFloat(c.currentBalance || '0'),
    0
  );

  const activeDebtors = customers.filter(
    (c) => parseFloat(c.currentBalance || '0') > 0
  ).length;

  const totalCreditLimit = customers.reduce(
    (sum, c) => sum + parseFloat(c.creditLimit || '0'),
    0
  );

  const overLimitCount = customers.filter((c) => {
    const bal = parseFloat(c.currentBalance || '0');
    const limit = parseFloat(c.creditLimit || '0');
    return limit > 0 && bal > limit;
  }).length;

  return (
    <div className="space-y-4" data-testid="khata-content">
      {/* Header and Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Customer Khata & Receivables Ledger</h2>
            <Badge variant="outline" className="font-mono text-xs">
              {customers.length}
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            Store credit accounts, multi-tender debt repayments, chronological statements & ageing analysis
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={onAddCustomer}
            data-testid="add-customer-btn"
            size="sm"
            className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Customer</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onCleanDevCustomers}
            data-testid="clean-dev-test-customers-btn"
            className="h-9 bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 font-semibold text-xs px-3 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            title="Safely cleans test customers with ZERO financial records. Preserves all accounts with transactions."
          >
            <Brush className="h-3.5 w-3.5" />
            <span>Dev Test Cleanup</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            data-testid="refresh-khata-btn"
            className="h-9 bg-white text-slate-700 font-medium text-xs px-3 rounded-xl shadow-xs hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* 4 Khata KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Receivables */}
        <Card className="shadow-xs border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Total Receivables Owed
              </p>
              <p
                className="text-xl font-black text-rose-600 mt-1 font-mono"
                data-testid="total-receivables"
              >
                ₹{totalOutstanding.toFixed(2)}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Active credit balance across accounts</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <IndianRupee className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Active Debtors */}
        <Card className="shadow-xs border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Active Debtors
              </p>
              <p className="text-xl font-black text-slate-900 mt-1">
                {activeDebtors}{' '}
                <span className="text-xs font-normal text-slate-500">/ {customers.length}</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Customers with open balance &gt; ₹0</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Total Credit Extended */}
        <Card className="shadow-xs border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Total Credit Limit Extended
              </p>
              <p className="text-xl font-black text-slate-900 mt-1 font-mono">
                ₹{totalCreditLimit.toFixed(2)}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Approved store credit facility</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Coins className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Accounts Over Limit */}
        <Card className="shadow-xs border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Accounts Over Limit
              </p>
              <p className="text-xl font-black text-amber-600 mt-1">{overLimitCount}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Current balance exceeds limit</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search customer by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="customer-search-input"
            className="pl-8 text-xs h-9 bg-white"
          />
        </div>
        <span className="text-xs text-slate-500">
          Showing <strong>{filteredCustomers.length}</strong> of {customers.length} customer accounts
        </span>
      </div>

      {/* Customer Accounts Table */}
      <Card className="shadow-xs border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-700">Customer</TableHead>
              <TableHead className="font-semibold text-slate-700">Credit Limit</TableHead>
              <TableHead className="font-semibold text-slate-700">Outstanding Balance</TableHead>
              <TableHead className="font-semibold text-slate-700">Available Credit</TableHead>
              <TableHead className="font-semibold text-slate-700">Status</TableHead>
              <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-slate-400 text-xs">
                  {search ? 'No customer accounts matching search query.' : 'No customer accounts registered yet.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((c) => {
                const bal = parseFloat(c.currentBalance || '0');
                const limit = parseFloat(c.creditLimit || '0');
                const avail = limit > 0 ? Math.max(0, limit - bal) : 0;
                const hasDebt = bal > 0;
                const isExceeded = limit > 0 && bal > limit;
                const isNearLimit = limit > 0 && !isExceeded && bal / limit >= 0.9;

                return (
                  <TableRow key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0 border border-slate-200">
                          {getInitials(c.name)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{c.name}</div>
                          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>📞 {c.phone || 'No phone'}</span>
                            {c.email && <span>✉️ {c.email}</span>}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="font-mono font-medium text-xs text-slate-700">
                      ₹{c.creditLimit}
                    </TableCell>

                    <TableCell className="font-bold text-xs">
                      <Badge
                        variant="secondary"
                        className={`font-mono font-bold text-xs ${
                          hasDebt
                            ? isExceeded
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        ₹{c.currentBalance}
                      </Badge>
                    </TableCell>

                    <TableCell className="font-mono text-xs text-slate-600">
                      {limit > 0 ? `₹${avail.toFixed(2)}` : '—'}
                    </TableCell>

                    <TableCell>
                      {limit === 0 ? (
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-500">
                          No Credit
                        </Badge>
                      ) : isExceeded ? (
                        <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] uppercase font-bold">
                          Exceeded
                        </Badge>
                      ) : isNearLimit ? (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] uppercase font-bold">
                          Near Limit
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] uppercase font-bold">
                          Healthy
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right space-x-1.5 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenStatement(c)}
                        data-testid={`statement-btn-${c.id}`}
                        className="h-7 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                        title="View Chronological Ledger Statement"
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Statement
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenHistory(c)}
                        data-testid={`history-btn-${c.id}`}
                        className="h-7 px-2 text-xs font-semibold text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100/60 border-indigo-200 cursor-pointer"
                        title="View Customer Lifetime History & Invoices"
                      >
                        <History className="h-3 w-3 mr-1" />
                        History
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenMerge(c)}
                        data-testid={`merge-btn-${c.id}`}
                        className="h-7 px-2 text-xs font-semibold text-amber-800 bg-amber-50/50 hover:bg-amber-100/60 border-amber-200 cursor-pointer"
                        title="Merge duplicate customer into primary account"
                      >
                        <GitMerge className="h-3 w-3 mr-1" />
                        Merge
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => onOpenRepayment(c)}
                        disabled={!hasDebt}
                        data-testid={`repay-btn-${c.id}`}
                        className={`h-7 px-2.5 text-xs font-bold cursor-pointer shadow-xs ${
                          hasDebt
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                        title={hasDebt ? 'Record Debt Repayment' : 'No outstanding balance to repay'}
                      >
                        <Coins className="h-3 w-3 mr-1" />
                        Repay
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenCreditLimit(c)}
                        data-testid={`limit-btn-${c.id}`}
                        className="h-7 px-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                        title="Modify Credit Limit"
                      >
                        <Settings2 className="h-3 w-3 mr-1" />
                        Limit
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

