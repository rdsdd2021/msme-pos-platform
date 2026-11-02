'use client';

import React, { useState } from 'react';
import { Supplier } from '@/lib/api-client';
import {
  Building2,
  Search,
  Plus,
  Phone,
  Mail,
  User,
  Pencil,
  Trash2,
  FileCheck2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SupplierDirectoryProps {
  suppliers: Supplier[];
  onAddSupplier: () => void;
  onEditSupplier: (supplier: Supplier) => void;
  onArchiveSupplier: (supplier: Supplier) => void;
}

export function SupplierDirectory({
  suppliers,
  onAddSupplier,
  onEditSupplier,
  onArchiveSupplier,
}: SupplierDirectoryProps) {
  const [search, setSearch] = useState('');

  const filteredSuppliers = suppliers.filter(
    (s) =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone && s.phone.includes(search)) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(search.toLowerCase())) ||
      (s.gstin && s.gstin.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4" data-testid="suppliers-view">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Vendors & Wholesale Distributors</h3>
            <Badge variant="outline" className="font-mono text-xs">
              {suppliers.length}
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            Manage suppliers, GSTIN credentials, and contact details for procurement & ITC compliance
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search suppliers by name / phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs h-9 bg-white"
            />
          </div>

          <Button
            onClick={onAddSupplier}
            data-testid="add-supplier-btn"
            size="sm"
            className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Supplier</span>
          </Button>
        </div>
      </div>

      {/* Suppliers Table Card */}
      <Card className="shadow-xs border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-700">Vendor / Company</TableHead>
              <TableHead className="font-semibold text-slate-700">Contact Person</TableHead>
              <TableHead className="font-semibold text-slate-700">Phone</TableHead>
              <TableHead className="font-semibold text-slate-700">Email</TableHead>
              <TableHead className="font-semibold text-slate-700">GSTIN</TableHead>
              <TableHead className="font-semibold text-slate-700">Status</TableHead>
              <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-slate-400">
                  {suppliers.length === 0 ? (
                    <div className="flex flex-col items-center gap-2">
                      <Building2 className="h-8 w-8 text-slate-300" />
                      <p className="text-xs">
                        No suppliers registered yet. Click <strong>"Add Supplier"</strong> to register distributors.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs">No suppliers matching "{search}"</p>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((s) => (
                <TableRow
                  key={s.id}
                  className="hover:bg-slate-50/80 transition-colors"
                  data-testid={`supplier-row-${s.id}`}
                >
                  <TableCell className="font-bold text-slate-900 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-200">
                        <Building2 className="h-3.5 w-3.5" />
                      </div>
                      <span>{s.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-700 text-xs">
                    {s.contactPerson ? (
                      <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3 text-slate-400" />
                        <span>{s.contactPerson}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-700">
                    {s.phone ? (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span>{s.phone}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-600 text-xs">
                    {s.email ? (
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3 text-slate-400" />
                        <span>{s.email}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {s.gstin ? (
                      <Badge
                        variant="secondary"
                        className="font-mono text-[11px] bg-slate-100 text-slate-800 border-slate-200 font-semibold"
                      >
                        <FileCheck2 className="h-3 w-3 mr-1 text-emerald-600" />
                        {s.gstin}
                      </Badge>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Unregistered</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold"
                    >
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditSupplier(s)}
                      data-testid={`edit-supplier-${s.id}`}
                      className="h-7 px-2 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onArchiveSupplier(s)}
                      data-testid={`archive-supplier-${s.id}`}
                      className="h-7 px-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Archive
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

