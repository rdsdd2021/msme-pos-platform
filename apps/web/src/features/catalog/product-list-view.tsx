'use client';

import React, { useMemo } from 'react';
import { Product, Category, Unit } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import {
  Package,
  Barcode,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Boxes,
  Layers,
  ArrowUpDown,
  Filter,
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

function formatKiranaStock(stock: number, unitSymbol?: string): string {
  const unit = unitSymbol ? ` ${unitSymbol}` : '';
  if (stock <= 0) return '0 on hand';
  if (Number.isInteger(stock) || Math.abs(stock - Math.round(stock)) < 0.0001) {
    return `${Math.round(stock)}${unit}`;
  }
  return `${stock.toFixed(3).replace(/\.?0+$/, '')}${unit}`;
}

interface ProductListViewProps {
  products: Product[];
  stockMap: Map<string, string>;
  categories: Category[];
  units: Unit[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onArchiveProduct: (product: Product) => void;
}

export function ProductListView({
  products,
  stockMap,
  categories,
  units,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onAddProduct,
  onEditProduct,
  onArchiveProduct,
}: ProductListViewProps) {
  // Compute inventory KPIs
  const stats = useMemo(() => {
    let totalValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach((p) => {
      const stock = parseFloat(stockMap.get(p.id) || '0');
      const cost = parseFloat(p.purchaseCost || '0');
      totalValuation += stock * cost;

      if (stock <= 0) {
        outOfStockCount++;
      } else if (stock <= 5) {
        lowStockCount++;
      }
    });

    return {
      totalCount: products.length,
      totalValuation: totalValuation.toFixed(2),
      lowStockCount,
      outOfStockCount,
    };
  }, [products, stockMap]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcodePrimary && p.barcodePrimary.includes(q)) ||
        (p.hsnCode && p.hsnCode.includes(q));

      const matchesCat = !selectedCategory || p.categoryId === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <div className="space-y-4">
      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="shadow-2xs border-slate-200/90 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3.5 px-4">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total SKUs
            </CardTitle>
            <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3.5 pt-0">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.totalCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Active catalog items</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-slate-200/90 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3.5 px-4">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Stock Valuation
            </CardTitle>
            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3.5 pt-0">
            <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              ₹{parseFloat(stats.totalValuation).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Asset value at purchase cost</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-slate-200/90 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3.5 px-4">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Low Stock Items
            </CardTitle>
            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3.5 pt-0">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.lowStockCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Under threshold (≤5 units)</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-slate-200/90 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3.5 px-4">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Out of Stock
            </CardTitle>
            <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600">
              <Boxes className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3.5 pt-0">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.outOfStockCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Zero on-hand balance</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by name, SKU, barcode, or HSN..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            data-testid="product-search-input"
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            data-testid="product-category-filter"
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer min-w-[160px] font-medium"
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>

          <Button
            onClick={onAddProduct}
            data-testid="add-product-btn"
            className="h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 rounded-lg shadow-xs cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Product</span>
          </Button>
        </div>
      </div>

      {/* Shadcn Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" data-testid="products-table">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="p-3.5">Product & Variant</th>
                <th className="p-3.5">SKU / Barcode</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">HSN & Tax</th>
                <th className="p-3.5">Cost / Sell / MRP</th>
                <th className="p-3.5">Stock on Hand</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <Package className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No products found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Adjust your search filters or click &quot;Add New Product&quot; to create one.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const stock = stockMap.get(p.id) || '0.000';
                  const stockNum = parseFloat(stock);
                  const isLow = stockNum <= 5;
                  const isOut = stockNum <= 0;
                  const cat = categories.find((c) => c.id === p.categoryId);
                  const unit = units.find((u) => u.id === p.baseUnitId);

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/80 transition-colors"
                      data-testid={`product-row-${p.sku}`}
                    >
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900 leading-snug">{p.name}</div>
                        {p.packageSize && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium border border-slate-200/60">
                            {p.packageSize}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="font-mono text-slate-800 font-semibold text-xs">{p.sku}</div>
                        <div className="text-[11px] font-mono mt-0.5">
                          {p.barcodePrimary ? (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Barcode className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60 text-slate-600 text-[10px] font-mono">
                                {p.barcodePrimary}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">No barcode</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="text-slate-800 font-medium">{cat?.name || 'General'}</span>
                        {unit && (
                          <span className="text-[10px] text-slate-500 font-medium ml-1.5 px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200/60">
                            {unit.symbol}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="text-slate-700 font-mono text-xs">{p.hsnCode || '—'}</div>
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0 mt-0.5 font-bold"
                        >
                          {p.gstRatePercent ? `${parseFloat(p.gstRatePercent)}% GST` : '0% GST'}
                        </Badge>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 font-mono text-xs">
                          ₹{parseFloat(p.sellingPrice).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                          <span>MRP: ₹{parseFloat(p.mrp).toFixed(2)}</span>
                          <span className="text-slate-300">•</span>
                          <span>Cost: ₹{parseFloat(p.purchaseCost).toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            'font-mono font-semibold text-xs px-2.5 py-0.5 shadow-2xs',
                            !isOut && !isLow && 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
                            isLow && !isOut && 'bg-amber-50 text-amber-700 border-amber-200/80',
                            isOut && 'bg-rose-50 text-rose-700 border-rose-200/80'
                          )}
                          title={`Precise stock: ${stockNum.toFixed(3)} ${unit?.name || ''}`}
                        >
                          {formatKiranaStock(stockNum, unit?.symbol)}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditProduct(p)}
                          data-testid={`edit-product-btn-${p.sku}`}
                          className="h-7 px-2.5 text-xs text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-100 rounded-md cursor-pointer shadow-2xs"
                        >
                          <Edit2 className="h-3 w-3 mr-1 text-slate-500" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onArchiveProduct(p)}
                          data-testid={`archive-product-btn-${p.sku}`}
                          className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer"
                          title="Archive Product"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
    </div>
  );
}

