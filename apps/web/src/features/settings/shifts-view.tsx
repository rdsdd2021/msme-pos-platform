'use client';

import React from 'react';
import { CashierShift } from '@/lib/api-client';
import { Clock, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ShiftsViewProps {
  shifts: CashierShift[];
  onRefresh: () => void;
}

export function ShiftsView({ shifts, onRefresh }: ShiftsViewProps) {
  return (
    <div className="space-y-4" data-testid="shifts-content">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Clock className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Cashier Register Shifts</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cash drawer tracking, opening floats, and shift reconciliation
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="h-9 bg-white text-slate-700 font-medium text-xs px-3 rounded-xl shadow-xs hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Refresh Shifts</span>
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-700">Shift ID</TableHead>
              <TableHead className="font-semibold text-slate-700">Cashier</TableHead>
              <TableHead className="font-semibold text-slate-700">Opening Float</TableHead>
              <TableHead className="font-semibold text-slate-700">Cash Sales</TableHead>
              <TableHead className="font-semibold text-slate-700">Expected Cash</TableHead>
              <TableHead className="font-semibold text-slate-700">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                  No active shifts logged for this branch.
                </TableCell>
              </TableRow>
            ) : (
              shifts.map((s) => (
                <TableRow key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <TableCell className="p-3.5 font-mono text-xs text-slate-600">
                    {s.id.substring(0, 8)}
                  </TableCell>
                  <TableCell className="p-3.5 font-bold text-xs text-slate-900">
                    {s.cashierUserId}
                  </TableCell>
                  <TableCell className="p-3.5 font-mono text-xs">
                    ₹{s.openingCash}
                  </TableCell>
                  <TableCell className="p-3.5 font-mono text-xs text-emerald-700 font-bold">
                    ₹{s.closingCash ?? '—'}
                  </TableCell>
                  <TableCell className="p-3.5 font-mono text-xs font-bold text-slate-800">
                    ₹{s.expectedCash ?? '—'}
                  </TableCell>
                  <TableCell className="p-3.5">
                    <Badge
                      variant="outline"
                      className={`font-bold uppercase text-[10px] ${
                        s.status === 'open'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {s.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

