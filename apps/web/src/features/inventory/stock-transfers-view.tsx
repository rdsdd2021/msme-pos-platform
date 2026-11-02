'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StockTransfer,
  Branch,
  Product,
  apiClient,
  CreateStockTransferRequest,
  ReceiveStockTransferRequest,
} from '@/lib/api-client';
import {
  Boxes,
  Send,
  PackageCheck,
  AlertTriangle,
  Plus,
  RefreshCw,
  Search,
  ArrowRight,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CreateTransferModal } from './create-transfer-modal';
import { ReceiveTransferModal } from './receive-transfer-modal';
import { TransferDetailsModal } from './transfer-details-modal';

interface StockTransfersViewProps {
  tenantId: string;
  currentBranchId: string;
  branches: Branch[];
  products: Product[];
  stockMap: Map<string, string>;
  onRefreshStock?: () => void;
}

export function StockTransfersView({
  tenantId,
  currentBranchId,
  branches,
  products,
  stockMap,
  onRefreshStock,
}: StockTransfersViewProps) {
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [receiveModalTransfer, setReceiveModalTransfer] = useState<StockTransfer | null>(null);
  const [detailsModalTransfer, setDetailsModalTransfer] = useState<StockTransfer | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchTransfers = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await apiClient.getStockTransfers(tenantId, { limit: 100 });
      setTransfers(res.data || []);
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err?.message || 'Failed to load stock transfers',
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  // Compute KPIs
  const stats = useMemo(() => {
    let inTransitCount = 0;
    let inTransitUnits = 0;
    let receivedCount = 0;
    let discrepancyCount = 0;

    transfers.forEach((t) => {
      if (t.status === 'in_transit' || t.status === 'dispatched') {
        inTransitCount++;
        inTransitUnits += parseFloat(t.totalItemsDispatched || t.totalItemsRequested || '0');
      }
      if (t.status === 'received') {
        receivedCount++;
      }
      if (t.hasDiscrepancy) {
        discrepancyCount++;
      }
    });

    return {
      inTransitCount,
      inTransitUnits: inTransitUnits.toFixed(1),
      receivedCount,
      discrepancyCount,
      totalTransfers: transfers.length,
    };
  }, [transfers]);

  // Filter transfers
  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.transferNumber.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q)) ||
        (t.sourceBranch?.name && t.sourceBranch.name.toLowerCase().includes(q)) ||
        (t.destinationBranch?.name && t.destinationBranch.name.toLowerCase().includes(q));

      // Status
      let matchesStatus = true;
      if (statusFilter === 'in_transit') {
        matchesStatus = t.status === 'in_transit' || t.status === 'dispatched';
      } else if (statusFilter === 'draft') {
        matchesStatus = t.status === 'draft';
      } else if (statusFilter === 'received') {
        matchesStatus = t.status === 'received';
      } else if (statusFilter === 'cancelled') {
        matchesStatus = t.status === 'cancelled';
      } else if (statusFilter === 'discrepancy') {
        matchesStatus = t.hasDiscrepancy === true;
      }

      // Branch
      let matchesBranch = true;
      if (branchFilter !== 'all') {
        matchesBranch =
          t.sourceBranchId === branchFilter || t.destinationBranchId === branchFilter;
      }

      return matchesSearch && matchesStatus && matchesBranch;
    });
  }, [transfers, searchQuery, statusFilter, branchFilter]);

  // Handle actions
  const handleCreateSubmit = async (dto: CreateStockTransferRequest) => {
    await apiClient.createStockTransfer(tenantId, dto);
    setFeedbackMessage({
      type: 'success',
      text: dto.autoDispatch
        ? 'Stock transfer created and dispatched immediately.'
        : 'Stock transfer order created in DRAFT status.',
    });
    await fetchTransfers();
    if (onRefreshStock) onRefreshStock();
  };

  const handleDispatch = async (transfer: StockTransfer) => {
    setActionLoadingId(transfer.id);
    try {
      await apiClient.dispatchStockTransfer(tenantId, transfer.id);
      setFeedbackMessage({
        type: 'success',
        text: `Transfer ${transfer.transferNumber} dispatched. Stock deducted from origin branch.`,
      });
      await fetchTransfers();
      if (onRefreshStock) onRefreshStock();
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err?.message || 'Failed to dispatch transfer',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReceiveSubmit = async (transferId: string, dto: ReceiveStockTransferRequest) => {
    await apiClient.receiveStockTransfer(tenantId, transferId, dto);
    setFeedbackMessage({
      type: 'success',
      text: 'Transfer received and inward stock posted to destination branch inventory.',
    });
    await fetchTransfers();
    if (onRefreshStock) onRefreshStock();
  };

  const handleCancelTransfer = async (transferId: string) => {
    setActionLoadingId(transferId);
    try {
      await apiClient.cancelStockTransfer(tenantId, transferId);
      setFeedbackMessage({
        type: 'success',
        text: 'Stock transfer cancelled. Any dispatched stock has been reversed back to origin.',
      });
      await fetchTransfers();
      if (onRefreshStock) onRefreshStock();
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err?.message || 'Failed to cancel transfer',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: string, hasDiscrepancy: boolean) => {
    switch (status) {
      case 'draft':
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-300 font-semibold">
            DRAFT
          </Badge>
        );
      case 'in_transit':
      case 'dispatched':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-bold">
            IN TRANSIT
          </Badge>
        );
      case 'received':
        return (
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold">
              RECEIVED
            </Badge>
            {hasDiscrepancy && (
              <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 text-[10px]">
                VARIANCE
              </Badge>
            )}
          </div>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-800 border-rose-300">
            CANCELLED
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4" data-testid="stock-transfers-view">
      {/* Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button
            type="button"
            className="text-xs font-bold underline ml-2"
            onClick={() => setFeedbackMessage(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3.5 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              In Transit Transfers
            </CardTitle>
            <Send className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="px-4 pb-3.5 pt-0">
            <div className="text-2xl font-black text-amber-700 tracking-tight font-mono">
              {stats.inTransitCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {stats.inTransitUnits} units currently on the road
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3.5 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Completed Transfers
            </CardTitle>
            <PackageCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="px-4 pb-3.5 pt-0">
            <div className="text-2xl font-black text-emerald-700 tracking-tight font-mono">
              {stats.receivedCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Verified & inward to destination</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3.5 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Discrepancies Flagged
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent className="px-4 pb-3.5 pt-0">
            <div className="text-2xl font-black text-rose-700 tracking-tight font-mono">
              {stats.discrepancyCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Physical count variances logged</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3.5 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Transfer Orders
            </CardTitle>
            <Boxes className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent className="px-4 pb-3.5 pt-0">
            <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              {stats.totalTransfers}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Across all branch locations</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Container */}
      <Card className="shadow-xs border-slate-200">
        <CardHeader className="px-5 pt-4 pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Boxes className="h-4 w-4 text-blue-600" />
              Inter-Branch Stock Transfers & Perpetual Custody
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Atomic branch dispatch, in-transit custody tracking, and physical receipt reconciliation
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-9 gap-1.5"
              onClick={fetchTransfers}
              disabled={loading}
              data-testid="refresh-transfers-btn"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 gap-1.5 shadow-xs"
              onClick={() => setCreateModalOpen(true)}
              data-testid="create-transfer-btn"
            >
              <Plus className="h-4 w-4" /> Initiate Transfer
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search transfer #, branch, memo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
                data-testid="transfers-search-input"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Filter */}
              <select
                className="h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                data-testid="status-filter-select"
              >
                <option value="all">All Statuses</option>
                <option value="in_transit">In Transit ({stats.inTransitCount})</option>
                <option value="draft">Draft Orders</option>
                <option value="received">Received ({stats.receivedCount})</option>
                <option value="discrepancy">Discrepancies ({stats.discrepancyCount})</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Branch Filter */}
              <select
                className="h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                data-testid="branch-filter-select"
              >
                <option value="all">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Transfers Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs" data-testid="transfers-table">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-left">Transfer #</th>
                  <th className="py-2.5 px-3 text-left">Route</th>
                  <th className="py-2.5 px-3 text-right">Items / Units</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-left">Date</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransfers.length > 0 ? (
                  filteredTransfers.map((t) => {
                    const isDraft = t.status === 'draft';
                    const isInTransit = t.status === 'in_transit' || t.status === 'dispatched';
                    const isReceived = t.status === 'received';
                    const isActing = actionLoadingId === t.id;

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/70 transition">
                        {/* Transfer # */}
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {t.transferNumber}
                          {t.notes && (
                            <span className="block font-sans font-normal text-[11px] text-slate-400 truncate max-w-[180px]">
                              {t.notes}
                            </span>
                          )}
                        </td>

                        {/* Route */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5 font-medium text-slate-800">
                            <span>{t.sourceBranch?.name || t.sourceBranchId}</span>
                            <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="text-emerald-700 font-bold">
                              {t.destinationBranch?.name || t.destinationBranchId}
                            </span>
                          </div>
                        </td>

                        {/* Items / Units */}
                        <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-800">
                          <div>
                            {isInTransit
                              ? `${t.totalItemsDispatched || t.totalItemsRequested} units dispatched`
                              : isReceived
                              ? `${t.totalItemsReceived} units received`
                              : `${t.totalItemsRequested} units requested`}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {t.lines?.length || 0} line items
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3 text-center">
                          {getStatusBadge(t.status, t.hasDiscrepancy)}
                        </td>

                        {/* Date */}
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isDraft && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-[11px] font-bold text-blue-600 border-blue-200 hover:bg-blue-50 gap-1"
                                onClick={() => handleDispatch(t)}
                                disabled={isActing}
                                data-testid="dispatch-transfer-btn"
                              >
                                <Send className="h-3 w-3" /> Dispatch
                              </Button>
                            )}

                            {isInTransit && (
                              <Button
                                type="button"
                                size="sm"
                                className="h-7 px-2 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                onClick={() => setReceiveModalTransfer(t)}
                                disabled={isActing}
                                data-testid="receive-transfer-btn"
                              >
                                <PackageCheck className="h-3 w-3" /> Receive
                              </Button>
                            )}

                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800"
                              onClick={() => setDetailsModalTransfer(t)}
                              data-testid="view-transfer-details-btn"
                              title="Audit Dossier"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>

                            {(isDraft || isInTransit) && (
                              <button
                                type="button"
                                className="text-slate-400 hover:text-rose-600 p-1 transition"
                                title="Cancel Transfer"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Are you sure you want to cancel transfer ${t.transferNumber}? Dispatched stock will be reversed.`,
                                    )
                                  ) {
                                    handleCancelTransfer(t.id);
                                  }
                                }}
                                disabled={isActing}
                                data-testid="cancel-transfer-btn"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                          <span>Loading transfer registers...</span>
                        </div>
                      ) : (
                        <div>No inter-branch stock transfers found matching the criteria.</div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateTransferModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        branches={branches}
        products={products}
        currentBranchId={currentBranchId}
        stockMap={stockMap}
        onSubmit={handleCreateSubmit}
      />

      <ReceiveTransferModal
        open={!!receiveModalTransfer}
        onClose={() => setReceiveModalTransfer(null)}
        transfer={receiveModalTransfer}
        onSubmit={handleReceiveSubmit}
      />

      <TransferDetailsModal
        open={!!detailsModalTransfer}
        onClose={() => setDetailsModalTransfer(null)}
        transfer={detailsModalTransfer}
        onOpenDispatch={(t) => handleDispatch(t)}
        onOpenReceive={(t) => setReceiveModalTransfer(t)}
        onCancel={handleCancelTransfer}
      />
    </div>
  );
}

