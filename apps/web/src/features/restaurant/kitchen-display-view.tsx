'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  KitchenStation,
  KotStatus,
} from '@pos/shared-types';
import {
  RestaurantKot,
  apiClient,
} from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import { useRealtimeEvents } from '@/hooks/use-realtime-events';
import {
  ChefHat,
  Clock,
  RefreshCw,
  Flame,
  CheckCircle2,
  Utensils,
  Bell,
  AlertTriangle,
  Volume2,
  VolumeX,
} from 'lucide-react';

export function KitchenDisplayView() {
  const { activeTenant, activeBranch } = useAuthStore();
  const [kots, setKots] = useState<RestaurantKot[]>([]);
  const [loading, setLoading] = useState(false);
  const [stationFilter, setStationFilter] = useState<KitchenStation | 'ALL'>('ALL');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Update live clock every 10 seconds for ticket timers
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const fetchKdsQueue = useCallback(async () => {
    if (!activeTenant?.tenantId || !activeBranch?.id) return;
    try {
      const station = stationFilter === 'ALL' ? undefined : stationFilter;
      const data = await apiClient.getRestaurantKdsQueue(
        activeTenant.tenantId,
        activeBranch.id,
        station,
      );
      setKots(data || []);
    } catch (err) {
      console.error('Failed to load KDS tickets', err);
    }
  }, [activeTenant?.tenantId, activeBranch?.id, stationFilter]);

  // Initial load and periodic poll
  useEffect(() => {
    fetchKdsQueue();
    if (!autoRefresh) return;
    const interval = setInterval(fetchKdsQueue, 12000);
    return () => clearInterval(interval);
  }, [fetchKdsQueue, autoRefresh]);

  // Real-time live KDS updates on order placement / table changes
  useRealtimeEvents({
    tenantId: activeTenant?.tenantId,
    enabled: autoRefresh,
    onRestaurantTableChanged: () => {
      fetchKdsQueue();
    },
    onOrderCreated: () => {
      fetchKdsQueue();
    },
    onPoll: () => {
      fetchKdsQueue();
    },
    pollIntervalMs: 15000,
  });

  // Handle Status Update (Start Cooking, Ready, Served)
  const handleUpdateStatus = async (kotId: string, newStatus: KotStatus) => {
    if (!activeTenant?.tenantId || !activeBranch?.id) return;
    try {
      await apiClient.updateRestaurantKotStatus(
        activeTenant.tenantId,
        activeBranch.id,
        kotId,
        newStatus,
      );
      // Immediately refresh queue
      fetchKdsQueue();
    } catch (err) {
      console.error('Failed to update KOT status', err);
    }
  };

  // Compute elapsed minutes
  const getElapsedMinutes = (dispatchedAt: string) => {
    const diffMs = now - new Date(dispatchedAt).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const stations: Array<{ label: string; value: KitchenStation | 'ALL' }> = [
    { label: 'All Stations', value: 'ALL' },
    { label: 'Main Kitchen', value: KitchenStation.MAIN_KITCHEN },
    { label: 'Bar & Beverages', value: KitchenStation.BEVERAGE_BAR },
    { label: 'Tandoor & Grill', value: KitchenStation.TANDOOR },
    { label: 'Dessert & Bakery', value: KitchenStation.BAKERY_DESSERT },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden select-none">
      {/* Top KDS Control Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-wide text-white uppercase">
                Kitchen Display Screen
              </h1>
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">
                {kots.length} Active Tickets
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Branch: <strong className="text-slate-200">{activeBranch?.name || 'Main Branch'}</strong>
            </p>
          </div>
        </div>

        {/* Station Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
          {stations.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => setStationFilter(value)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                stationFilter === value
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs h-8 gap-1.5"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            {soundEnabled ? 'Chime On' : 'Muted'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`border-slate-700 text-xs h-8 gap-1.5 ${
              autoRefresh ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto (12s)' : 'Manual'}
          </Button>

          <Button
            size="sm"
            onClick={fetchKdsQueue}
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-8 px-3"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Ticket Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {kots.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
            <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-300">All Kitchen Orders Cleared!</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              No orders are currently waiting to be prepared. New KOT tickets fired by captains will appear here instantly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {kots.map((kot) => {
              const elapsedMins = getElapsedMinutes(kot.dispatchedAt);
              const isUrgent = elapsedMins >= 20;
              const isWarning = elapsedMins >= 10 && elapsedMins < 20;

              return (
                <div
                  key={kot.id}
                  className={`flex flex-col rounded-2xl border transition-all overflow-hidden ${
                    isUrgent
                      ? 'bg-rose-950/40 border-rose-600/60 shadow-lg shadow-rose-950/50'
                      : isWarning
                      ? 'bg-amber-950/30 border-amber-600/50'
                      : 'bg-slate-900/90 border-slate-800'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-white tracking-tight">
                          {kot.tableNumber}
                        </span>
                        <Badge
                          variant="outline"
                          className="bg-slate-800 text-slate-300 border-slate-700 text-[10px] font-mono"
                        >
                          {kot.kotNumber}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Captain: <span className="text-slate-200">{kot.captainName || 'Staff'}</span>
                      </p>
                    </div>

                    {/* Elapsed Timer Badge */}
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono font-bold text-xs border ${
                        isUrgent
                          ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{elapsedMins}m ago</span>
                    </div>
                  </div>

                  {/* Station Tag */}
                  <div className="px-4 py-1.5 bg-slate-950/60 border-b border-slate-800/40 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>Station: <strong className="text-slate-200">{kot.kitchenStation}</strong></span>
                    <Badge
                      className={`text-[10px] uppercase font-black ${
                        kot.status === KotStatus.READY
                          ? 'bg-emerald-500 text-slate-950'
                          : kot.status === KotStatus.PREPARING
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {kot.status}
                    </Badge>
                  </div>

                  {/* Ticket Items List */}
                  <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-72">
                    {kot.lines?.map((line) => (
                      <div
                        key={line.id}
                        className="border-b border-slate-800/50 pb-2.5 last:border-b-0 last:pb-0"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black text-sm flex-shrink-0">
                            {parseFloat(line.quantity).toFixed(0)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-slate-100 leading-snug">
                              {line.productNameSnapshot}
                            </p>
                            {line.specialInstructions && (
                              <div className="mt-1 flex items-start gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 px-2 py-1 rounded text-xs">
                                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                <span>Note: {line.specialInstructions}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bump / Transition Action Footer */}
                  <div className="p-3 bg-slate-950/80 border-t border-slate-800/80">
                    {kot.status === KotStatus.PENDING && (
                      <Button
                        onClick={() => handleUpdateStatus(kot.id, KotStatus.PREPARING)}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs h-10 gap-2 shadow-sm"
                      >
                        <Flame className="w-4 h-4 fill-slate-950" />
                        Start Cooking
                      </Button>
                    )}

                    {kot.status === KotStatus.PREPARING && (
                      <Button
                        onClick={() => handleUpdateStatus(kot.id, KotStatus.READY)}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs h-10 gap-2 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark Ready for Pickup
                      </Button>
                    )}

                    {kot.status === KotStatus.READY && (
                      <Button
                        onClick={() => handleUpdateStatus(kot.id, KotStatus.SERVED)}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs h-10 gap-2 border border-slate-700"
                      >
                        <Utensils className="w-4 h-4 text-emerald-400" />
                        Served (Clear Ticket)
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
