'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Utensils,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Printer,
  Percent,
  Sparkles,
  Layers,
  ChefHat,
  Loader2,
} from 'lucide-react';
import { apiClient, RestaurantSettings, FloorSectionConfig } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

const DEFAULT_SECTIONS: FloorSectionConfig[] = [
  { id: 'ac', name: 'AC Dining Hall', defaultCapacity: 4, tableCount: 6 },
  { id: 'non-ac', name: 'Open Non-AC', defaultCapacity: 4, tableCount: 6 },
  { id: 'rooftop', name: 'Rooftop Lounge', defaultCapacity: 6, tableCount: 4 },
  { id: 'takeaway', name: 'Takeaway Counter', defaultCapacity: 1, tableCount: 2 },
];

export function RestaurantSettingsView() {
  const { activeTenant, activeBranch } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Settings State
  const [floorSections, setFloorSections] = useState<FloorSectionConfig[]>(DEFAULT_SECTIONS);
  const [defaultGstPercent, setDefaultGstPercent] = useState('5.00');
  const [serviceChargePercent, setServiceChargePercent] = useState('0.00');
  const [packagingCharge, setPackagingCharge] = useState('0.00');
  const [autoPrintKotOnFire, setAutoPrintKotOnFire] = useState(false);
  const [autoPrintBillOnSettle, setAutoPrintBillOnSettle] = useState(true);
  const [defaultKitchenStation, setDefaultKitchenStation] = useState('main_kitchen');

  const tenantId = activeTenant?.tenantId;
  const branchId = activeBranch?.id;

  const loadSettings = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await apiClient.getRestaurantSettings(tenantId, branchId);
      if (data) {
        if (data.floorSections && data.floorSections.length > 0) {
          setFloorSections(data.floorSections);
        }
        if (data.defaultGstPercent) setDefaultGstPercent(data.defaultGstPercent);
        if (data.serviceChargePercent) setServiceChargePercent(data.serviceChargePercent);
        if (data.packagingCharge) setPackagingCharge(data.packagingCharge);
        if (data.autoPrintKotOnFire !== undefined) setAutoPrintKotOnFire(data.autoPrintKotOnFire);
        if (data.autoPrintBillOnSettle !== undefined) setAutoPrintBillOnSettle(data.autoPrintBillOnSettle);
        if (data.defaultKitchenStation) setDefaultKitchenStation(data.defaultKitchenStation);
      }
    } catch (err: any) {
      console.error('Failed to load restaurant settings', err);
      setErrorMessage(err?.message || 'Failed to load restaurant settings.');
    } finally {
      setLoading(false);
    }
  }, [tenantId, branchId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleAddSection = () => {
    const id = `sec-${Date.now().toString().slice(-4)}`;
    setFloorSections((prev) => [
      ...prev,
      { id, name: 'New Section', defaultCapacity: 4, tableCount: 4 },
    ]);
  };

  const handleUpdateSection = (index: number, field: keyof FloorSectionConfig, value: any) => {
    setFloorSections((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveSection = (index: number) => {
    setFloorSections((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = async () => {
    if (!tenantId) return;
    try {
      setSaving(true);
      setErrorMessage(null);
      setSuccessBanner(null);

      await apiClient.updateRestaurantSettings(
        tenantId,
        {
          floorSections,
          defaultGstPercent,
          serviceChargePercent,
          packagingCharge,
          autoPrintKotOnFire,
          autoPrintBillOnSettle,
          defaultKitchenStation,
        },
        branchId,
      );

      setSuccessBanner('Restaurant dining & KOT settings updated successfully.');
      setTimeout(() => setSuccessBanner(null), 4000);
    } catch (err: any) {
      console.error('Save failed', err);
      setErrorMessage(err?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-xs">Loading restaurant dining settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="restaurant-settings-view">
      {/* Notifications */}
      {successBanner && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* SECTION 1: FLOOR SECTIONS & SEATING */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Floor &amp; Dining Sections</h3>
              <p className="text-xs text-slate-500">
                Define seating zones (AC Dining, Rooftop, Takeaway) and default seating capacities.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddSection}
            className="h-8 text-xs font-semibold gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Section
          </Button>
        </div>

        <div className="space-y-3">
          {floorSections.map((sec, idx) => (
            <div
              key={sec.id || idx}
              className="flex flex-wrap items-center gap-3 p-3 bg-slate-50/70 border border-slate-200 rounded-xl"
            >
              <div className="flex-1 min-w-[180px]">
                <Label className="text-[11px] text-slate-500 font-semibold mb-1 block">
                  Section Name
                </Label>
                <Input
                  value={sec.name}
                  onChange={(e) => handleUpdateSection(idx, 'name', e.target.value)}
                  className="h-8 text-xs font-bold text-slate-800 bg-white"
                  placeholder="e.g. AC Dining Hall"
                />
              </div>

              <div className="w-32">
                <Label className="text-[11px] text-slate-500 font-semibold mb-1 block">
                  Default Seats
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={sec.defaultCapacity}
                  onChange={(e) =>
                    handleUpdateSection(idx, 'defaultCapacity', parseInt(e.target.value) || 2)
                  }
                  className="h-8 text-xs font-semibold text-slate-800 bg-white"
                />
              </div>

              <div className="w-32">
                <Label className="text-[11px] text-slate-500 font-semibold mb-1 block">
                  Table Count
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={sec.tableCount}
                  onChange={(e) =>
                    handleUpdateSection(idx, 'tableCount', parseInt(e.target.value) || 1)
                  }
                  className="h-8 text-xs font-semibold text-slate-800 bg-white"
                />
              </div>

              <div className="pt-5">
                <button
                  type="button"
                  onClick={() => handleRemoveSection(idx)}
                  disabled={floorSections.length <= 1}
                  className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Delete Section"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: RESTAURANT GST & SERVICE CHARGE */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Restaurant GST &amp; Service Charges</h3>
            <p className="text-xs text-slate-500">
              Indian restaurant tax rules: standalone food service is taxed at 5% GST without ITC.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <Label className="text-xs font-bold text-slate-700 mb-1.5 block">
              Restaurant GST Rate (%)
            </Label>
            <select
              value={defaultGstPercent}
              onChange={(e) => setDefaultGstPercent(e.target.value)}
              className="h-9 w-full text-xs font-semibold rounded-lg border border-slate-300 px-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="5.00">5.00% (Standard standalone restaurant - No ITC)</option>
              <option value="18.00">18.00% (Luxury restaurant or liquor license)</option>
              <option value="0.00">0.00% (Tax exempt / Non-GST merchant)</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Applied automatically to all food &amp; beverage items on KOT settlement.
            </p>
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700 mb-1.5 block">
              Optional Service Charge (%)
            </Label>
            <div className="relative">
              <Input
                type="text"
                value={serviceChargePercent}
                onChange={(e) => setServiceChargePercent(e.target.value)}
                className="h-9 text-xs font-bold text-slate-800 pr-8"
                placeholder="0.00"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Discretionary staff service charge (set to 0.00% if not levied).
            </p>
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700 mb-1.5 block">
              Takeaway Packaging Charge (₹)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">₹</span>
              <Input
                type="text"
                value={packagingCharge}
                onChange={(e) => setPackagingCharge(e.target.value)}
                className="h-9 text-xs font-bold text-slate-800 pl-7"
                placeholder="0.00"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Added automatically for takeaway packaging boxes or paper bags.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: KITCHEN & THERMAL PRINTER AUTOMATION */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-5">
          <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200/60 text-purple-600 flex items-center justify-center">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">KOT &amp; Thermal Printer Automation</h3>
            <p className="text-xs text-slate-500">
              Configure automatic kitchen ticket printing and sequential KOT dispatching.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-start gap-3 p-3 bg-slate-50/70 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
            <input
              type="checkbox"
              checked={autoPrintKotOnFire}
              onChange={(e) => setAutoPrintKotOnFire(e.target.checked)}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Auto-print Kitchen Ticket (KOT) on Dispatch
              </span>
              <span className="text-[11px] text-slate-500">
                Immediately trigger ESC/POS thermal printing to kitchen station printer when a waiter fires items.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 bg-slate-50/70 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
            <input
              type="checkbox"
              checked={autoPrintBillOnSettle}
              onChange={(e) => setAutoPrintBillOnSettle(e.target.checked)}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Auto-print Final Tax Bill on Table Settlement
              </span>
              <span className="text-[11px] text-slate-500">
                Automatically generate and print the GST tax invoice when cashier completes settlement and frees the table.
              </span>
            </div>
          </label>

          <div className="pt-2">
            <Label className="text-xs font-bold text-slate-700 mb-1.5 block">
              Default Kitchen Station for New Dishes
            </Label>
            <select
              value={defaultKitchenStation}
              onChange={(e) => setDefaultKitchenStation(e.target.value)}
              className="h-9 w-full sm:w-72 text-xs font-semibold rounded-lg border border-slate-300 px-3 bg-white text-slate-800"
            >
              <option value="main_kitchen">🍳 Main Kitchen (Curries, Rice &amp; Starters)</option>
              <option value="tandoor">🔥 Tandoor &amp; Clay Oven</option>
              <option value="beverage_bar">🍹 Bar &amp; Beverages Counter</option>
              <option value="bakery_dessert">🍰 Desserts &amp; Bakery</option>
            </select>
          </div>
        </div>
      </div>

      {/* FOOTER SAVE BUTTON */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={loadSettings}
          disabled={saving}
          className="h-9 px-4 text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-50"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
          Reset Changes
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-sm"
        >
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Saving Settings...
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              Save Dining Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
