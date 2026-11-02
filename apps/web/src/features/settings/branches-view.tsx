'use client';

import React from 'react';
import { Branch } from '@/lib/api-client';
import { Building2, RotateCcw, Edit2, ShieldCheck, AlertCircle } from 'lucide-react';
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

interface BranchesViewProps {
  branches: Branch[];
  onRefresh: () => void;
  onEditBranch: (branch: Branch) => void;
}

export function BranchesView({
  branches,
  onRefresh,
  onEditBranch,
}: BranchesViewProps) {
  return (
    <div className="space-y-4" data-testid="branches-content">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Building2 className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Branch Management &amp; GSTIN Registrations
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure store branches, registered 15-character GSTINs, state codes and legal addresses.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="h-9 bg-white text-slate-700 font-medium text-xs px-3 rounded-xl shadow-xs hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <Table data-testid="branches-table">
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-700">Branch Code &amp; Name</TableHead>
              <TableHead className="font-semibold text-slate-700">GSTIN Registration</TableHead>
              <TableHead className="font-semibold text-slate-700">State Code</TableHead>
              <TableHead className="font-semibold text-slate-700">Address &amp; City</TableHead>
              <TableHead className="font-semibold text-slate-700">Status</TableHead>
              <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                  No branches found for this tenant.
                </TableCell>
              </TableRow>
            ) : (
              branches.map((b) => (
                <TableRow key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <TableCell className="p-3.5">
                    <div className="font-bold text-xs text-slate-900">{b.name}</div>
                    <span className="font-mono text-[10px] text-slate-500">Code: {b.code}</span>
                  </TableCell>
                  <TableCell className="p-3.5">
                    {b.gstin ? (
                      <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 font-mono font-bold text-xs">
                        <ShieldCheck className="h-3 w-3 mr-1 inline" />
                        {b.gstin}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 font-mono text-[11px] font-semibold">
                        <AlertCircle className="h-3 w-3 mr-1 inline" />
                        Unregistered
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="p-3.5 font-mono text-xs text-slate-700 font-semibold">
                    {b.stateCode || '—'}
                  </TableCell>
                  <TableCell className="p-3.5 text-xs text-slate-600">
                    <div>{b.addressLine1 || 'No address set'}</div>
                    <div className="text-[11px] text-slate-400">
                      {b.city ? `${b.city}, ` : ''}{b.postalCode || ''}
                    </div>
                  </TableCell>
                  <TableCell className="p-3.5">
                    <Badge
                      variant="outline"
                      className={`font-bold uppercase text-[10px] ${
                        b.isActive
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {b.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="p-3.5 text-right">
                    <Button
                      size="sm"
                      onClick={() => onEditBranch(b)}
                      data-testid={`edit-branch-btn-${b.id}`}
                      className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs flex items-center gap-1.5 ml-auto"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Configure GSTIN</span>
                    </Button>
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

