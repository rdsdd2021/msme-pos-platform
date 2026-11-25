'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Receipt,
  Package,
  Layers,
  UtensilsCrossed,
  CreditCard,
  Clock,
  IndianRupee,
  ShoppingBag,
  BarChart3,
} from 'lucide-react';
import { apiClient, BusinessAnalyticsResponse } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ExecutiveAnalyticsViewProps {
  tenantId?: string;
  branchId?: string;
}

const CHART_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#64748b', // slate
];

export function ExecutiveAnalyticsView({ tenantId, branchId }: ExecutiveAnalyticsViewProps) {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [data, setData] = useState<BusinessAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'products' | 'categories' | 'tables'>('products');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getBusinessAnalytics(tenantId, period, branchId);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [tenantId, period, branchId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const summary = data?.summary;
  const trend = data?.salesTrend || [];
  const byProduct = data?.byProduct || [];
  const byCategory = data?.byCategory || [];
  const byTable = data?.byTable || [];
  const byPayment = data?.byPaymentMethod || [];
  const peakHours = data?.peakHours || [];

  const maxTrendRev = Math.max(...trend.map((t) => t.revenue), 1);
  const maxPeakOrders = Math.max(...peakHours.map((h) => h.orders), 1);

  const formatInr = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) || 0 : val;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Build SVG Area + Line coordinates for Sales Trend
  const svgW = 720;
  const svgH = 220;
  const padX = 28;
  const padY = 24;
  const chartW = svgW - padX * 2;
  const chartH = svgH - padY * 2;

  const points = trend.map((pt, idx) => {
    const x = trend.length <= 1 ? padX + chartW / 2 : padX + (idx / (trend.length - 1)) * chartW;
    const y = padY + chartH - (pt.revenue / maxTrendRev) * chartH;
    return { x, y, ...pt };
  });

  const linePath =
    points.length > 0
      ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
      : '';
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padY + chartH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padY + chartH).toFixed(1)} Z`
      : '';

  // Donut Chart helper
  const renderDonut = (
    items: Array<{ label: string; value: number; share: number }>,
    emptyText: string,
  ) => {
    if (items.length === 0 || items.every((i) => i.value <= 0)) {
      return (
        <div className="h-44 flex items-center justify-center text-xs text-slate-400">
          {emptyText}
        </div>
      );
    }

    const total = items.reduce((s, i) => s + i.value, 0) || 1;
    let cumulative = 0;
    const radius = 54;
    const circumference = 2 * Math.PI * radius;

    return (
      <div className="flex flex-col sm:flex-row items-center gap-5">
        <div className="relative w-36 h-36 shrink-0">
          <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="18" />
            {items.slice(0, 6).map((item, idx) => {
              const frac = item.value / total;
              const dashLen = frac * circumference;
              const dashOffset = -cumulative * circumference;
              cumulative += frac;
              return (
                <circle
                  key={item.label}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                  strokeWidth="18"
                  strokeDasharray={`${dashLen} ${circumference}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="butt"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total</span>
            <span className="text-xs font-black text-slate-900">
              ₹{total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toFixed(0)}
            </span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-2">
          {items.slice(0, 6).map((item, idx) => (
            <div key={item.label} className="flex items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                />
                <span className="font-semibold text-slate-700 truncate capitalize">{item.label}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 font-mono">
                <span className="font-bold text-slate-900">{formatInr(item.value)}</span>
                <span className="text-[10px] text-slate-400 w-10 text-right">{item.share.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5" data-testid="analytics-content">
      {/* Header & Period Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">Sales &amp; Performance Analytics</h2>
            <p className="text-xs text-slate-500">
              Revenue trends, top dishes/products, categories, tables &amp; peak hours
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            {([
              { id: 'day', label: 'Today (Day)' },
              { id: 'week', label: 'Last 7 Days (Week)' },
              { id: 'month', label: 'Last 30 Days (Month)' },
            ] as const).map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  period === p.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            disabled={loading}
            className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Revenue</p>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono" data-testid="stat-turnover">
            {formatInr(summary?.totalSales || '0.00')}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            {(summary?.growthPercent ?? 0) >= 0 ? (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold gap-0.5">
                <TrendingUp className="w-3 h-3" /> +{summary?.growthPercent ?? 0}%
              </Badge>
            ) : (
              <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold gap-0.5">
                <TrendingDown className="w-3 h-3" /> {summary?.growthPercent ?? 0}%
              </Badge>
            )}
            <span className="text-[11px] text-slate-400">
              vs prev {period} ({formatInr(summary?.previousPeriodSales || '0.00')})
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bills &amp; Avg Ticket</p>
            <Receipt className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono" data-testid="stat-invoices">
            {summary?.invoiceCount || 0} <span className="text-sm font-semibold text-slate-400">bills</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
            Avg Order Value: <strong className="text-slate-800">{formatInr(summary?.averageOrderValue || '0.00')}</strong>
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Items Sold</p>
            <ShoppingBag className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {summary?.totalItemsSold || 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
            Across {byCategory.length} categories &amp; {byProduct.length} items
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tax &amp; Discounts</p>
            <CreditCard className="w-4 h-4 text-violet-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono" data-testid="stat-tax">
            {formatInr(summary?.totalTax || '0.00')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
            Discounts given: <strong className="text-slate-800">{formatInr(summary?.totalDiscount || '0.00')}</strong>
          </p>
        </div>
      </div>

      {/* Interactive Revenue Trend Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900">
              Revenue Trend ({period === 'day' ? 'Hourly Today' : period === 'week' ? 'Last 7 Days' : 'Last 30 Days'})
            </h3>
            <p className="text-xs text-slate-500">Hover or tap any point to inspect exact revenue &amp; order volume</p>
          </div>
          {hoveredIdx !== null && points[hoveredIdx] && (
            <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-3 shadow-sm">
              <span className="font-bold text-emerald-400">{points[hoveredIdx].label}</span>
              <span>{formatInr(points[hoveredIdx].revenue)}</span>
              <span className="text-slate-300">{points[hoveredIdx].orders} orders</span>
            </div>
          )}
        </div>

        {points.length === 0 ? (
          <div className="h-52 flex items-center justify-center text-xs text-slate-400">
            No sales recorded in this period yet.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full min-w-[520px] h-56 select-none">
              <defs>
                <linearGradient id="revAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                const y = padY + chartH - frac * chartH;
                return (
                  <g key={frac}>
                    <line x1={padX} y1={y} x2={svgW - padX} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                    <text x={4} y={y + 3} fontSize="9" fill="#94a3b8" fontFamily="monospace">
                      {Math.round(frac * maxTrendRev)}
                    </text>
                  </g>
                );
              })}

              {/* Area & Line */}
              <path d={areaPath} fill="url(#revAreaGrad)" />
              <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

              {/* Points & Hover Hitboxes */}
              {points.map((pt, idx) => {
                const showLabel =
                  points.length <= 10 || idx === 0 || idx === points.length - 1 || idx % Math.ceil(points.length / 8) === 0;
                const isHovered = hoveredIdx === idx;
                return (
                  <g
                    key={pt.dateKey}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={pt.x - chartW / Math.max(points.length, 1) / 2}
                      y={padY}
                      width={chartW / Math.max(points.length, 1)}
                      height={chartH}
                      fill="transparent"
                    />
                    {isHovered && (
                      <line x1={pt.x} y1={padY} x2={pt.x} y2={padY + chartH} stroke="#10b981" strokeDasharray="2 2" />
                    )}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 5.5 : 3.2}
                      fill={isHovered ? '#059669' : '#ffffff'}
                      stroke="#10b981"
                      strokeWidth="2"
                    />
                    {showLabel && (
                      <text
                        x={pt.x}
                        y={svgH - 4}
                        textAnchor="middle"
                        fontSize="9.5"
                        fill="#64748b"
                        fontWeight={isHovered ? 'bold' : 'normal'}
                      >
                        {pt.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {/* Middle Row: Donut Charts + Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            Category Revenue Split
          </h3>
          {renderDonut(
            byCategory.map((c) => ({ label: c.categoryName, value: c.revenue, share: c.sharePercent })),
            'No category sales yet',
          )}
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-600" />
            Payment Methods Split
          </h3>
          {renderDonut(
            byPayment.map((p) => ({ label: p.method.toUpperCase(), value: p.amount, share: p.sharePercent })),
            'No payments recorded yet',
          )}
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            Peak Business Hours
          </h3>
          {peakHours.every((h) => h.orders === 0) ? (
            <div className="h-44 flex items-center justify-center text-xs text-slate-400">
              No hourly traffic data yet
            </div>
          ) : (
            <div className="h-44 flex items-end gap-1.5 pt-4">
              {peakHours.map((h) => {
                const heightPct = Math.max((h.orders / maxPeakOrders) * 100, h.orders > 0 ? 8 : 2);
                const isPeak = h.orders > 0 && h.orders === maxPeakOrders;
                return (
                  <div key={h.hour} className="flex-1 flex flex-col items-center justify-end h-full group" title={`${h.label}: ${h.orders} bills (${formatInr(h.revenue)})`}>
                    <span className="text-[9px] font-bold text-slate-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {h.orders}
                    </span>
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        isPeak ? 'bg-amber-500' : h.orders > 0 ? 'bg-blue-500/80 hover:bg-blue-600' : 'bg-slate-100'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[9px] text-slate-400 mt-1.5 font-mono">
                      {h.hour % 3 === 0 ? h.label.replace('AM', 'a').replace('PM', 'p') : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detailed Breakdown Section: Products / Categories / Tables */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {([
              { id: 'products', label: `Top Products (${byProduct.length})`, icon: Package },
              { id: 'categories', label: `Categories (${byCategory.length})`, icon: Layers },
              { id: 'tables', label: `Tables & Dining (${byTable.length})`, icon: UtensilsCrossed },
            ] as const).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setDetailTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    detailTab === tab.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5">
          {detailTab === 'products' && (
            byProduct.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No product sales in this period.</p>
            ) : (
              <div className="space-y-3">
                {byProduct.map((prod, idx) => (
                  <div key={prod.productId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-800 truncate">{prod.name}</span>
                        <Badge variant="outline" className="text-[10px] font-medium text-slate-500">
                          {prod.categoryName}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 font-mono">
                        <span className="text-slate-500">{prod.quantitySold} sold</span>
                        <span className="font-black text-slate-900 w-24 text-right">{formatInr(prod.revenue)}</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(Math.max(prod.sharePercent, 2), 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {detailTab === 'categories' && (
            byCategory.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No category sales in this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] uppercase text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="py-2 pr-4">Category</th>
                      <th className="py-2 px-4 text-right">Unique Items</th>
                      <th className="py-2 px-4 text-right">Qty Sold</th>
                      <th className="py-2 px-4 text-right">Share</th>
                      <th className="py-2 pl-4 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {byCategory.map((cat, idx) => (
                      <tr key={cat.categoryName} className="hover:bg-slate-50/70">
                        <td className="py-2.5 pr-4 font-bold text-slate-800 flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                          />
                          {cat.categoryName}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-600">{cat.itemCount}</td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-600">{cat.quantitySold}</td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-500">{cat.sharePercent}%</td>
                        <td className="py-2.5 pl-4 text-right font-mono font-black text-slate-900">
                          {formatInr(cat.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {detailTab === 'tables' && (
            byTable.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                No completed dine-in table orders in this period.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {byTable.map((tbl) => (
                  <div
                    key={`${tbl.section}-${tbl.tableNumber}`}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-black text-slate-900">{tbl.tableNumber}</p>
                      <p className="text-[11px] text-slate-500">{tbl.section}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {tbl.orderCount} orders • {tbl.guestCount} guests
                      </p>
                    </div>
                    <div className="text-right font-mono">
                      <p className="text-sm font-black text-emerald-700">{formatInr(tbl.revenue)}</p>
                      <p className="text-[10px] text-slate-500">Avg {formatInr(tbl.avgBill)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
