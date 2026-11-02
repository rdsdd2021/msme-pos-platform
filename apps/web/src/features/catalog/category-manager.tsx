'use client';

import React from 'react';
import { Category, Unit } from '@/lib/api-client';
import { Layers, Ruler, Plus, FolderTree } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CategoryManagerProps {
  categories: Category[];
  units: Unit[];
  onAddCategory: () => void;
  onAddUnit: () => void;
}

export function CategoryManager({
  categories,
  units,
  onAddCategory,
  onAddUnit,
}: CategoryManagerProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Categories Card */}
      <Card className="shadow-xs border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between pb-3 px-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-emerald-600" />
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Product Categories</span>
              <Badge variant="outline" className="text-[11px] font-mono font-bold text-slate-600">
                {categories.length}
              </Badge>
            </CardTitle>
          </div>
          <Button
            size="sm"
            onClick={onAddCategory}
            data-testid="add-category-btn"
            className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-2.5 rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Category</span>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3">Category Name</th>
                  <th className="p-3">Code</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-slate-400">
                      No categories configured yet.
                    </td>
                  </tr>
                ) : (
                  categories.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-semibold text-slate-900">{c.name}</td>
                      <td className="p-3 font-mono text-slate-500">{c.code}</td>
                      <td className="p-3 text-right">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0">
                          Active
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Units of Measure Card */}
      <Card className="shadow-xs border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between pb-3 px-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-indigo-600" />
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Units of Measurement (UOM)</span>
              <Badge variant="outline" className="text-[11px] font-mono font-bold text-slate-600">
                {units.length}
              </Badge>
            </CardTitle>
          </div>
          <Button
            size="sm"
            onClick={onAddUnit}
            data-testid="add-unit-btn"
            className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-2.5 rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Unit</span>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3">Unit Name</th>
                  <th className="p-3">Symbol</th>
                  <th className="p-3 text-right">Precision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {units.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-slate-400">
                      No units configured yet.
                    </td>
                  </tr>
                ) : (
                  units.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-semibold text-slate-900">{u.name}</td>
                      <td className="p-3 font-mono font-bold text-slate-700">{u.symbol}</td>
                      <td className="p-3 text-right font-mono text-slate-500 text-[11px]">
                        {u.decimalPlaces} decimals
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
