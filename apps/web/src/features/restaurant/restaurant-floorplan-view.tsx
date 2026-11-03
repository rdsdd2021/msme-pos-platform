'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { TableStatus } from '@pos/shared-types';
import {
  RestaurantTable,
  RestaurantOrder,
  apiClient,
} from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import { TableOrderDrawer } from './table-order-drawer';
import { SplitBillModal } from './split-bill-modal';
import {
  UtensilsCrossed,
  Users,
  Clock,
  Plus,
  RefreshCw,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Receipt,
  ChefHat,
  Layers,
} from 'lucide-react';

interface RestaurantFloorplanViewProps {
  onSwitchToKds?: () => void;
}

export function RestaurantFloorplanView({ onSwitchToKds }: RestaurantFloorplanViewProps) {
  const { activeTenant, activeBranch } = useAuthStore();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected table for Drawer
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [orderDrawerOpen, setOrderDrawerOpen] = useState(false);

  // Quick Settle Modal
  const [quickSettleOrder, setQuickSettleOrder] = useState<RestaurantOrder | null>(null);
  const [quickSettleOpen, setQuickSettleOpen] = useState(false);

  // Add Table Modal
  const [addTableOpen, setAddTableOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [newTableSection, setNewTableSection] = useState('Main Dining');
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [isCreatingTable, setIsCreatingTable] = useState(false);

  // Fetch Tables
  const fetchTables = useCallback(async () => {
    if (!activeTenant?.tenantId || !activeBranch?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getRestaurantTables(
        activeTenant.tenantId,
        activeBranch.id,
      );
      setTables(data || []);
      // If a table is currently selected in drawer, update its reference
      if (selectedTable) {
        const updated = data.find((t) => t.id === selectedTable.id);
        if (updated) setSelectedTable(updated);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch restaurant floor tables.');
    } finally {
      setLoading(false);
    }
  }, [activeTenant?.tenantId, activeBranch?.id, selectedTable]);

  useEffect(() => {
    fetchTables();
  }, [activeTenant?.tenantId, activeBranch?.id]);

  // Seed default 12 tables
  const handleSeedDefaults = async () => {
    if (!activeTenant?.tenantId || !activeBranch?.id) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.seedDefaultRestaurantTables(activeTenant.tenantId, activeBranch.id);
      fetchTables();
    } catch (err: any) {
      setError(err?.message || 'Failed to seed default restaurant tables.');
    } finally {
      setLoading(false);
    }
  };

  // Create single table
  const handleCreateTable = async () => {
    if (!activeTenant?.tenantId || !activeBranch?.id || !newTableNumber.trim()) return;
    setIsCreatingTable(true);
    try {
      await apiClient.createRestaurantTable(activeTenant.tenantId, activeBranch.id, {
        tableNumber: newTableNumber.trim(),
        tableName: newTableName.trim() || undefined,
        section: newTableSection.trim() || 'Main Dining',
        seatingCapacity: newTableCapacity,
      });
      setAddTableOpen(false);
      setNewTableNumber('');
      setNewTableName('');
      fetchTables();
    } catch (err: any) {
      setError(err?.message || 'Failed to create table.');
    } finally {
      setIsCreatingTable(false);
    }
  };

  // Change table status directly (e.g. clean dirty table)
  const handleUpdateStatus = async (tableId: string, status: TableStatus) => {
    if (!activeTenant?.tenantId || !activeBranch?.id) return;
    try {
      await apiClient.updateRestaurantTable(
        activeTenant.tenantId,
        activeBranch.id,
        tableId,
        { status },
      );
      fetchTables();
    } catch (err: any) {
      setError(err?.message || 'Failed to update table status.');
    }
  };

  // Open table drawer
  const handleOpenTable = (table: RestaurantTable) => {
    setSelectedTable(table);
    setOrderDrawerOpen(true);
  };

  // Quick settle
  const handleQuickSettle = (table: RestaurantTable, e: React.MouseEvent) => {
    e.stopPropagation();
    if (table.activeOrder) {
      setQuickSettleOrder(table.activeOrder);
      setQuickSettleOpen(true);
    }
  };

  // Sections extraction
  const sections = React.useMemo(() => {
    const s = new Set<string>();
    tables.forEach((t) => {
      if (t.section) s.add(t.section);
    });
    return Array.from(s);
  }, [tables]);

  // Filtered tables
  const filteredTables = React.useMemo(() => {
    return tables.filter((t) => {
      const matchSection = selectedSection === 'all' || t.section === selectedSection;
      const matchSearch =
        t.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.tableName && t.tableName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchSection && matchSearch;
    });
  }, [tables, selectedSection, searchQuery]);

  // Summary Metrics
  const metrics = React.useMemo(() => {
    const total = tables.length;
    const vacant = tables.filter((t) => t.status === TableStatus.VACANT).length;
    const seated = tables.filter((t) => t.status === TableStatus.SEATED).length;
    const ordered = tables.filter((t) => t.status === TableStatus.ORDERED).length;
    const billed = tables.filter((t) => t.status === TableStatus.BILLED).length;
    const dirty = tables.filter((t) => t.status === TableStatus.DIRTY).length;

    const activeDiners = tables.reduce((acc, t) => acc + (t.currentGuestCount || 0), 0);
    const liveRevenue = tables.reduce((acc, t) => {
      if (t.activeOrder) {
        return acc + (parseFloat(t.activeOrder.grandTotal) || 0);
      }
      return acc;
    }, 0);

    return { total, vacant, seated, ordered, billed, dirty, activeDiners, liveRevenue };
  }, [tables]);

  const vacantTables = tables.filter((t) => t.status === TableStatus.VACANT);

  return (
    <div className="flex flex-col h-full bg-slate-100 overflow-hidden select-none">
      {/* Top Banner / Floorplan Controls */}
      <div className="bg-white border-b px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Restaurant & Dining Floor</h1>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                  Kirana & Food Engine
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Floor management, table orders, KOT kitchen tickets & split bills
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onSwitchToKds && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSwitchToKds}
              className="gap-1.5 text-xs font-bold text-slate-800"
            >
              <ChefHat className="w-4 h-4 text-amber-500" /> Kitchen Screen (KDS)
            </Button>
          )}

          {tables.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedDefaults}
              disabled={loading}
              className="gap-1.5 text-xs font-bold border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
            >
              <Sparkles className="w-4 h-4" /> Seed Standard 12 Tables
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => setAddTableOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Table
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={fetchTables}
            disabled={loading}
            className="h-9 w-9 p-0 text-slate-600 hover:text-slate-900"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="bg-white/80 border-b px-6 py-2.5 flex items-center justify-between text-xs overflow-x-auto gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Total:</span>
            <strong className="text-slate-900 font-bold">{metrics.total}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-slate-500">Vacant:</span>
            <strong className="text-emerald-700 font-bold">{metrics.vacant}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-slate-500">Seated:</span>
            <strong className="text-amber-700 font-bold">{metrics.seated}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            <span className="text-slate-500">Ordered:</span>
            <strong className="text-sky-700 font-bold">{metrics.ordered}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span className="text-slate-500">Billed:</span>
            <strong className="text-purple-700 font-bold">{metrics.billed}</strong>
          </div>
          {metrics.dirty > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span className="text-slate-500">Dirty:</span>
              <strong className="text-rose-700 font-bold">{metrics.dirty}</strong>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500">Active Diners:</span>
            <strong className="text-slate-900 font-bold">{metrics.activeDiners} Pax</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Dining Open Sales:</span>
            <strong className="text-emerald-700 font-black text-sm">
              ₹{metrics.liveRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>
      </div>

      {/* Filter and Section Selector */}
      <div className="px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedSection('all')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              selectedSection === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-200 border'
            }`}
          >
            All Sections ({tables.length})
          </button>
          {sections.map((sec) => {
            const count = tables.filter((t) => t.section === sec).length;
            return (
              <button
                key={sec}
                type="button"
                onClick={() => setSelectedSection(sec)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  selectedSection === sec
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border'
                }`}
              >
                {sec} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <Input
            placeholder="Search table # or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-white"
          />
        </div>
      </div>

      {error && (
        <div className="mx-6 mb-3 bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Table Grid */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {filteredTables.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border">
            <UtensilsCrossed className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Dining Tables Configured</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mb-4">
              Get started quickly with default kirana/cafe restaurant tables or create custom tables by section.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSeedDefaults} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                Seed Standard Tables
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAddTableOpen(true)} className="text-xs">
                + Create Table
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredTables.map((table) => {
              const isVacant = table.status === TableStatus.VACANT;
              const isSeated = table.status === TableStatus.SEATED;
              const isOrdered = table.status === TableStatus.ORDERED;
              const isBilled = table.status === TableStatus.BILLED;
              const isDirty = table.status === TableStatus.DIRTY;

              const runningTotal = table.activeOrder ? parseFloat(table.activeOrder.grandTotal) || 0 : 0;
              const kotCount = table.activeOrder?.kots?.length || 0;

              return (
                <div
                  key={table.id}
                  onClick={() => handleOpenTable(table)}
                  className={`flex flex-col justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer relative group hover:shadow-md select-none ${
                    isVacant
                      ? 'bg-white border-slate-200 hover:border-emerald-500'
                      : isSeated
                      ? 'bg-amber-50/50 border-amber-300 hover:border-amber-500'
                      : isOrdered
                      ? 'bg-sky-50/50 border-sky-300 hover:border-sky-500'
                      : isBilled
                      ? 'bg-purple-50/50 border-purple-300 hover:border-purple-500'
                      : 'bg-rose-50/50 border-rose-300 hover:border-rose-500'
                  }`}
                >
                  {/* Top Bar: Table Number & Capacity */}
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-sm">
                        {table.tableNumber}
                      </div>
                      <Badge
                        className={`text-[10px] font-black uppercase px-2 py-0.5 ${
                          isVacant
                            ? 'bg-emerald-100 text-emerald-800'
                            : isSeated
                            ? 'bg-amber-100 text-amber-800'
                            : isOrdered
                            ? 'bg-sky-100 text-sky-800'
                            : isBilled
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {table.status}
                      </Badge>
                    </div>

                    <div className="mt-3">
                      <p className="font-bold text-sm text-slate-900 truncate">
                        {table.tableName || `Table ${table.tableNumber}`}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {table.section} • Cap: {table.seatingCapacity}
                      </p>
                    </div>
                  </div>

                  {/* Middle / Order Snapshot */}
                  <div className="my-3 py-2 border-t border-slate-100 space-y-1">
                    {table.activeOrder ? (
                      <>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Bill Total:</span>
                          <span className="font-black text-slate-900 font-mono">
                            ₹{runningTotal.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-slate-500">
                          <span>{kotCount} KOT{kotCount !== 1 ? 's' : ''} fired</span>
                          <span className="font-medium text-slate-700">
                            {table.currentGuestCount} Diners
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic">
                        {isDirty ? 'Awaiting busing / cleaning' : 'Ready for guests'}
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    {isVacant && (
                      <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Seat Table
                      </span>
                    )}

                    {(isSeated || isOrdered) && (
                      <>
                        <span className="text-[11px] font-bold text-sky-700">Add / View</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleQuickSettle(table, e)}
                          className="h-6 text-[10px] px-1.5 font-bold text-emerald-700 hover:bg-emerald-100"
                        >
                          <Receipt className="w-3 h-3 mr-1" /> Bill
                        </Button>
                      </>
                    )}

                    {isBilled && (
                      <Button
                        size="sm"
                        onClick={(e) => handleQuickSettle(table, e)}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] h-7 gap-1"
                      >
                        <Receipt className="w-3.5 h-3.5" /> Settle ₹{runningTotal.toFixed(2)}
                      </Button>
                    )}

                    {isDirty && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(table.id, TableStatus.VACANT);
                        }}
                        className="w-full text-rose-700 border-rose-200 bg-rose-50 hover:bg-rose-100 text-[11px] h-7 font-bold gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark Clean
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Table Dialog */}
      <Dialog open={addTableOpen} onOpenChange={setAddTableOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Plus className="w-4 h-4 text-emerald-600" /> Add Restaurant Dining Table
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-semibold">Table Number / Code *</Label>
              <Input
                placeholder="e.g. T-13, B-01, BAR-3"
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Table Label / Description (Optional)</Label>
              <Input
                placeholder="e.g. Corner Window Booth"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Section</Label>
                <Input
                  placeholder="Main Dining, AC Hall, Bar..."
                  value={newTableSection}
                  onChange={(e) => setNewTableSection(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Seating Capacity</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(parseInt(e.target.value) || 4)}
                  className="mt-1 text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddTableOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTable}
              disabled={!newTableNumber.trim() || isCreatingTable}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
            >
              {isCreatingTable ? 'Creating...' : 'Save Table'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table Order Drawer */}
      <TableOrderDrawer
        table={selectedTable}
        open={orderDrawerOpen}
        onOpenChange={setOrderDrawerOpen}
        onRefreshTable={fetchTables}
        allVacantTables={vacantTables}
      />

      {/* Quick Settlement Modal */}
      {quickSettleOrder && (
        <SplitBillModal
          order={quickSettleOrder}
          open={quickSettleOpen}
          onOpenChange={setQuickSettleOpen}
          onSettlementSuccess={() => {
            setQuickSettleOpen(false);
            fetchTables();
          }}
        />
      )}
    </div>
  );
}

