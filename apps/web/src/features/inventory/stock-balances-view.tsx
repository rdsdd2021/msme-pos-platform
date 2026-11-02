'use client';

import React, { useState, useMemo } from 'react';
import { Product } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import {
  Boxes,
  Scale,
  Search,
  AlertTriangle,
  TrendingUp,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StockBalancesViewProps {
  products: Product[];
  stockMap: Map<string, string>;
  branchName: string;
  onOpenAdjust: (product: Product) => void;
  onOpenTransfers?: () => void;
}

export function StockBalancesView({
  products,
  stockMap,
  branchName,
  onOpenAdjust,
  onOpenTransfers,
}: StockBalancesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Stock KPIs
  const stats = useMemo(() => {
    let totalStockUnits = 0;
    let totalValuation = 0;
    let lowStockCount = 0;

    products.forEach((p) => {
      const stock = parseFloat(stockMap.get(p.id) || '0');
      const cost = parseFloat(p.purchaseCost || '0');
      totalStockUnits += stock;
      totalValuation += stock * cost;
      if (stock <= 5) lowStockCount++;
    });

    return {
      totalUnits: totalStockUnits.toFixed(1),
      totalValuation: totalValuation.toFixed(2),
      lowStockCount,
      skuCount: products.length,
    };
  }, [products, stockMap]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcodePrimary && p.barcodePrimary.includes(q))
    );
  }, [products, searchQuery]);

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3.5 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Units On Hand
            </CardTitle>
            <Boxes className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent className="px-4 pb-3.5 pt-0">
            <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              {stats.totalUnits}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Across {stats.skuCount} active SKUs</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3.5 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Branch Valuation
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="px-4 pb-3.5 pt-0">
            <div className="text-2xl font-black text-emerald-700 tracking-tight font-mono">
              ₹{stats.totalValuation}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Asset value at purchase cost</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3.5 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Low Stock Alerts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="px-4 pb-3.5 pt-0">
            <div className="text-2xl font-black text-amber-600 tracking-tight">
              {stats.lowStockCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Items needing re-order (≤5 units)</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3.5 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Counter
            </CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="px-4 pb-3.5 pt-0">
            <div className="text-base font-bold text-slate-900 truncate mt-1">
              {branchName || 'Main Store'}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Perpetual Stock Ledger</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search on-hand stock by product name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <p className="text-xs text-slate-400 font-medium hidden sm:block">
            Every adjustment writes an immutable audit record to <code className="font-mono text-slate-600">stock_ledger</code>.
          </p>
          {onOpenTransfers && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenTransfers}
              className="text-xs h-8 gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50 font-bold"
              data-testid="goto-transfers-btn"
            >
              <Boxes className="h-3.5 w-3.5" /> Branch Transfers
            </Button>
          )}
        </div>
      </div>

      {/* Stock Balances Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3.5">Product Name</th>
                <th className="p-3.5">SKU / Barcode</th>
                <th className="p-3.5">Selling Price</th>
                <th className="p-3.5">Purchase Cost</th>
                <th className="p-3.5">Stock on Hand</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const stock = stockMap.get(p.id) || '0.000';
                const stockNum = parseFloat(stock);
                const isLow = stockNum <= 5;
                const isOut = stockNum <= 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{p.name}</td>
                    <td className="p-3.5 font-mono text-slate-500">{p.sku}</td>
                    <td className="p-3.5 font-bold font-mono">₹{p.sellingPrice}</td>
                    <td className="p-3.5 text-slate-500 font-mono">₹{p.purchaseCost}</td>
                    <td className="p-3.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          'font-mono font-semibold text-xs px-2.5 py-0.5 shadow-2xs',
                          !isOut && !isLow && 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
                          isLow && !isOut && 'bg-amber-50 text-amber-700 border-amber-200/80',
                          isOut && 'bg-rose-50 text-rose-700 border-rose-200/80'
                        )}
                        title={`Precise stock: ${stockNum.toFixed(3)} units`}
                      >
                        {Number.isInteger(stockNum) || Math.abs(stockNum - Math.round(stockNum)) < 0.0001
                          ? `${Math.round(stockNum)} units`
                          : `${stockNum.toFixed(3).replace(/\.?0+$/, '')} units`}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenAdjust(p)}
                        data-testid={`adjust-stock-btn-${p.sku}`}
                        className="h-7 px-2.5 text-xs text-blue-700 bg-blue-50/60 border-blue-200 hover:bg-blue-100 cursor-pointer font-bold"
                      >
                        <Scale className="h-3 w-3 mr-1" />
                        <span>Adjust</span>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
