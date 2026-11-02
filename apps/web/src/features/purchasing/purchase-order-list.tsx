'use client';

import React, { useState } from 'react';
import { PurchaseOrder } from '@/lib/api-client';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  IndianRupee,
  Plus,
  ArrowDownToLine,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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

interface PurchaseOrderListProps {
  purchaseOrders: PurchaseOrder[];
  onCreatePo: () => void;
  onReceivePo: (po: PurchaseOrder) => void;
}

export function PurchaseOrderList({
  purchaseOrders,
  onCreatePo,
  onReceivePo,
}: PurchaseOrderListProps) {
  const [statusFilter, setStatusFilter] = useState('');

  const filteredOrders = purchaseOrders.filter(
    (po) => !statusFilter || po.status === statusFilter
  );

  const pendingCount = purchaseOrders.filter(
    (po) => po.status === 'draft' || po.status === 'ordered'
  ).length;

  const receivedCount = purchaseOrders.filter((po) => po.status === 'received').length;

  const totalProcurement = purchaseOrders.reduce(
    (sum, po) => sum + parseFloat(po.totalAmount || '0'),
    0
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'received':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] uppercase font-bold tracking-wider">
            Received
          </Badge>
        );
      case 'ordered':
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] uppercase font-bold tracking-wider">
            Ordered
          </Badge>
        );
      case 'draft':
        return (
          <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-[10px] uppercase font-bold tracking-wider">
            Draft
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] uppercase">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4" data-testid="purchases-view">
      {/* 4 Pipeline KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <Card className="shadow-xs border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Total Purchase Orders
              </p>
              <p className="text-2xl font-black text-slate-900 mt-1">{purchaseOrders.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <ClipboardList className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Pending Delivery */}
        <Card className="shadow-xs border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Pending Delivery
              </p>
              <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Fully Received */}
        <Card className="shadow-xs border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Fully Received (GRN)
              </p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{receivedCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Procurement Total */}
        <Card className="shadow-xs border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Procurement Total
              </p>
              <p className="text-2xl font-black text-slate-900 mt-1 font-mono">
                ₹{totalProcurement.toFixed(2)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <IndianRupee className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Procurement Orders & Goods Received Notes
          </h3>
          <p className="text-xs text-slate-500">
            Inward receipts atomically post to immutable stock ledger and update branch on-hand
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-700 text-xs focus:outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="ordered">Ordered (Awaiting Delivery)</option>
              <option value="received">Received (GRN Inward)</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <Button
            onClick={onCreatePo}
            data-testid="add-po-btn"
            size="sm"
            className="h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Purchase Order</span>
          </Button>
        </div>
      </div>

      {/* Orders Table */}
      <Card className="shadow-xs border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-700">PO Number & Date</TableHead>
              <TableHead className="font-semibold text-slate-700">Vendor / Supplier</TableHead>
              <TableHead className="font-semibold text-slate-700">Items Summary</TableHead>
              <TableHead className="font-semibold text-slate-700 text-right">Subtotal</TableHead>
              <TableHead className="font-semibold text-slate-700 text-right">Tax (GST)</TableHead>
              <TableHead className="font-semibold text-slate-700 text-right">Total Amount</TableHead>
              <TableHead className="font-semibold text-slate-700 text-center">Status</TableHead>
              <TableHead className="font-semibold text-slate-700 text-right">Inward Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-slate-400 text-xs">
                  {purchaseOrders.length === 0 ? (
                    <div className="flex flex-col items-center gap-2">
                      <ClipboardList className="h-8 w-8 text-slate-300" />
                      <p>No purchase orders yet. Click "Create Purchase Order" to start procurement.</p>
                    </div>
                  ) : (
                    <p>No orders found with status "{statusFilter}"</p>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((po) => (
                <TableRow
                  key={po.id}
                  className="hover:bg-slate-50/80 transition-colors"
                  data-testid={`po-row-${po.id}`}
                >
                  {/* PO Number & Date */}
                  <TableCell className="py-3">
                    <div className="font-bold font-mono text-slate-900 text-xs">{po.orderNumber}</div>
                    <div className="text-[11px] text-slate-400">
                      {new Date(po.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>

                  {/* Vendor / Supplier */}
                  <TableCell>
                    <div className="font-medium text-slate-900 text-xs">{po.supplier?.name || '—'}</div>
                    {po.supplier?.phone && (
                      <div className="text-[11px] text-slate-400 font-mono">{po.supplier.phone}</div>
                    )}
                  </TableCell>

                  {/* Items Summary */}
                  <TableCell>
                    <span className="font-semibold text-slate-800 text-xs block">
                      {po.lines?.length || 0} line items
                    </span>
                    <div className="text-[11px] text-slate-500 truncate max-w-xs">
                      {po.lines
                        ?.map(
                          (l) =>
                            `${l.product?.name || 'Product'} (${l.quantityReceived || '0'}/${l.quantityOrdered})`
                        )
                        .join(', ')}
                    </div>
                  </TableCell>

                  {/* Subtotal */}
                  <TableCell className="text-right font-mono text-xs text-slate-600">
                    ₹{po.subtotal}
                  </TableCell>

                  {/* Tax */}
                  <TableCell className="text-right font-mono text-xs text-slate-600">
                    ₹{po.taxAmount}
                  </TableCell>

                  {/* Total */}
                  <TableCell className="text-right font-mono font-bold text-xs text-slate-900">
                    ₹{po.totalAmount}
                  </TableCell>

                  {/* Status */}
                  <TableCell className="text-center">{getStatusBadge(po.status)}</TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    {po.status !== 'received' && po.status !== 'cancelled' && (
                      <Button
                        size="sm"
                        onClick={() => onReceivePo(po)}
                        data-testid={`receive-po-${po.id}`}
                        className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-2.5 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5 ml-auto"
                      >
                        <ArrowDownToLine className="h-3.5 w-3.5" />
                        <span>Receive Goods (GRN)</span>
                      </Button>
                    )}
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

