'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Store,
  Printer,
  Building2,
  Smartphone,
  CreditCard,
  Save,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  FileText,
  Percent,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BranchesView } from './branches-view';
import { DevicesView } from './devices-view';
import { SubscriptionView } from './subscription-view';
import {
  ReceiptDesignConfig,
  DEFAULT_RECEIPT_CONFIG,
  getReceiptConfig,
  saveReceiptConfig,
} from '@/lib/receipt-template';
import { cn } from '@/lib/utils';
import type { Branch, Device, Subscription } from '@/lib/api-client';

export type SettingsSubTab = 'profile' | 'receipt' | 'billing' | 'branches' | 'devices' | 'subscription';

export interface SettingsViewProps {
  initialTab?: SettingsSubTab;
  tenantId?: string;
  branchId?: string;
  tenantName?: string;
  branchName?: string;
  branches: Branch[];
  devices: Device[];
  subscription: Subscription | null;
  onRefresh: () => void;
  onEditBranch?: (branch: Branch) => void;
}

export interface StoreProfileConfig {
  storeName: string;
  tagline: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  fssaiNumber: string;
  businessType: string;
}

export interface BillingRulesConfig {
  invoicePrefix: string;
  nextInvoiceSequence: number;
  cashRoundingPolicy: 'nearest_rupee' | 'exact';
  defaultGstRate: string;
  enableStockWarningOnBilling: boolean;
  autoPrintReceiptOnCheckout: boolean;
}

const DEFAULT_STORE_PROFILE: StoreProfileConfig = {
  storeName: 'Kirana Supermart',
  tagline: 'Your Trusted Neighborhood Store',
  phone: '+91 98765 43210',
  email: 'store@kirana.dev',
  addressLine: 'Shop 4, Andheri West Commercial Complex',
  city: 'Mumbai',
  state: 'Maharashtra (27)',
  pincode: '400058',
  gstin: '27AABCU9603R1ZM',
  fssaiNumber: '11521018000452',
  businessType: 'Grocery & FMCG Retail',
};

const DEFAULT_BILLING_RULES: BillingRulesConfig = {
  invoicePrefix: 'INV-',
  nextInvoiceSequence: 1042,
  cashRoundingPolicy: 'nearest_rupee',
  defaultGstRate: '5.00',
  enableStockWarningOnBilling: true,
  autoPrintReceiptOnCheckout: false,
};

export function SettingsView({
  initialTab = 'profile',
  tenantId,
  branchId,
  tenantName,
  branchName,
  branches,
  devices,
  subscription,
  onRefresh,
  onEditBranch,
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<SettingsSubTab>(initialTab);

  // Sync activeTab when initialTab prop changes (e.g. via deep-linking)
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // --- Store Profile State ---
  const [profile, setProfile] = useState<StoreProfileConfig>(() => {
    if (typeof window !== 'undefined' && tenantId) {
      try {
        const saved = localStorage.getItem(`pos_store_profile_${tenantId}`);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {
      ...DEFAULT_STORE_PROFILE,
      storeName: tenantName || DEFAULT_STORE_PROFILE.storeName,
    };
  });

  const handleSaveProfile = () => {
    if (typeof window !== 'undefined' && tenantId) {
      try {
        localStorage.setItem(`pos_store_profile_${tenantId}`, JSON.stringify(profile));
      } catch {}
    }
    toast.success('Store profile updated successfully!');
  };

  // --- Billing Rules State ---
  const [billingRules, setBillingRules] = useState<BillingRulesConfig>(() => {
    if (typeof window !== 'undefined' && tenantId) {
      try {
        const saved = localStorage.getItem(`pos_billing_rules_${tenantId}`);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_BILLING_RULES;
  });

  const handleSaveBillingRules = () => {
    if (typeof window !== 'undefined' && tenantId) {
      try {
        localStorage.setItem(`pos_billing_rules_${tenantId}`, JSON.stringify(billingRules));
      } catch {}
    }
    toast.success('Billing and invoicing rules updated successfully!');
  };

  // --- Thermal Receipt Designer State ---
  const [receiptConfig, setReceiptConfig] = useState<ReceiptDesignConfig>(() => {
    const loaded = getReceiptConfig(tenantId, branchId);
    if (tenantName && loaded.businessName === DEFAULT_RECEIPT_CONFIG.businessName) {
      loaded.businessName = tenantName;
    }
    if (branchName && loaded.branchName === DEFAULT_RECEIPT_CONFIG.branchName) {
      loaded.branchName = branchName;
    }
    return loaded;
  });

  const handleSaveReceipt = () => {
    saveReceiptConfig(receiptConfig, tenantId, branchId);
    toast.success('Thermal receipt template saved for this branch!');
  };

  const handleResetReceipt = () => {
    const reset = {
      ...DEFAULT_RECEIPT_CONFIG,
      businessName: tenantName || DEFAULT_RECEIPT_CONFIG.businessName,
      branchName: branchName || DEFAULT_RECEIPT_CONFIG.branchName,
    };
    setReceiptConfig(reset);
    saveReceiptConfig(reset, tenantId, branchId);
    toast.info('Thermal receipt configuration reset to factory standards.');
  };

  return (
    <div className="space-y-6" data-testid="settings-view">
      <h2 className="sr-only">Store Settings &amp; Administration</h2>
      {/* Settings Sub-Tab Navigation Pill Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-2 flex items-center gap-1.5 overflow-x-auto shadow-2xs">
        <button
          onClick={() => setActiveTab('profile')}
          data-testid="settings-tab-profile"
          className={cn(
            'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'profile'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          )}
        >
          <Store className="h-3.5 w-3.5" />
          <span>Store Profile</span>
        </button>

          <button
            onClick={() => setActiveTab('receipt')}
            data-testid="settings-tab-receipt"
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'receipt'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            )}
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Thermal Receipt Designer</span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            data-testid="settings-tab-billing"
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'billing'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            )}
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>Billing &amp; Invoicing</span>
          </button>

          <button
            onClick={() => setActiveTab('branches')}
            data-testid="settings-tab-branches"
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'branches'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            )}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Branches &amp; GSTIN ({branches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            data-testid="settings-tab-devices"
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'devices'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            )}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>POS Hardware ({devices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('subscription')}
            data-testid="settings-tab-subscription"
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'subscription'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            )}
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Plan &amp; Subscription</span>
          </button>
      </div>

      {/* --- SUB-TAB 1: STORE PROFILE --- */}
      {activeTab === 'profile' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Commercial Store Profile &amp; Legal Identity</h3>
              <p className="text-xs text-slate-500">Details printed on tax invoices, credit notes, and customer bills.</p>
            </div>
            <Button
              onClick={handleSaveProfile}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-8 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save Profile
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Store Trading Name *</Label>
              <Input
                value={profile.storeName}
                onChange={(e) => setProfile({ ...profile, storeName: e.target.value })}
                placeholder="e.g. Kirana Supermart"
                className="text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Tagline / Motto</Label>
              <Input
                value={profile.tagline}
                onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                placeholder="e.g. Pure Quality, Best Rates"
                className="text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Business Vertical</Label>
              <Input
                value={profile.businessType}
                onChange={(e) => setProfile({ ...profile, businessType: e.target.value })}
                placeholder="e.g. Grocery, Kirana, Supermarket"
                className="text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Official Phone *</Label>
              <Input
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Support / Billing Email</Label>
              <Input
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="accounts@store.in"
                className="text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700 mb-1.5 block">GSTIN Registration</Label>
              <Input
                value={profile.gstin}
                onChange={(e) => setProfile({ ...profile, gstin: e.target.value })}
                placeholder="27AABCU9603R1ZM"
                className="text-xs font-mono uppercase"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700 mb-1.5 block">FSSAI License Number</Label>
              <Input
                value={profile.fssaiNumber}
                onChange={(e) => setProfile({ ...profile, fssaiNumber: e.target.value })}
                placeholder="11521018000452"
                className="text-xs font-mono"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700 mb-1.5 block">City &amp; State</Label>
              <Input
                value={`${profile.city}, ${profile.state}`}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                placeholder="Mumbai, Maharashtra"
                className="text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Postal Pincode</Label>
              <Input
                value={profile.pincode}
                onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                placeholder="400058"
                className="text-xs font-mono"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Full Store Physical Address</Label>
              <Input
                value={profile.addressLine}
                onChange={(e) => setProfile({ ...profile, addressLine: e.target.value })}
                placeholder="Shop 4, Ground Floor, Central Market Road"
                className="text-xs"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600">
              <p className="font-semibold text-slate-800">GST and FSSAI Statutory Compliance</p>
              <p className="mt-0.5">
                The GSTIN and FSSAI numbers specified here will appear on all printed thermal receipts and exportable GSTR-1 summaries in compliance with Indian Food Safety and Tax regulations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 2: THERMAL RECEIPT DESIGNER --- */}
      {activeTab === 'receipt' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Thermal Printer Width &amp; Receipt Template</h3>
              <p className="text-xs text-slate-500">Configure formatting for standard 58mm (2-inch) and 80mm (3-inch) ESC/POS thermal printers.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetReceipt}
                className="text-xs font-semibold h-8 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                Reset Defaults
              </Button>
              <Button
                size="sm"
                onClick={handleSaveReceipt}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-8 cursor-pointer"
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Save Receipt Config
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Controls: Form (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Paper Width Selector */}
              <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-3">
                <Label className="text-xs font-bold text-slate-800 block">Thermal Paper Roll Width</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReceiptConfig({ ...receiptConfig, paperWidth: 58 })}
                    className={cn(
                      'p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1',
                      receiptConfig.paperWidth === 58
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">58 mm (2-inch roll)</span>
                      {receiptConfig.paperWidth === 58 && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                    </div>
                    <span className="text-[11px] text-slate-500">Compact handheld POS &amp; Kirana counters (32 chars)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReceiptConfig({ ...receiptConfig, paperWidth: 80 })}
                    className={cn(
                      'p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1',
                      receiptConfig.paperWidth === 80
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">80 mm (3-inch roll)</span>
                      {receiptConfig.paperWidth === 80 && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                    </div>
                    <span className="text-[11px] text-slate-500">Standard desktop receipt printer &amp; Supermarkets (48 chars)</span>
                  </button>
                </div>
              </div>

              {/* Header Text & Alignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Header Store Name</Label>
                  <Input
                    value={receiptConfig.businessName}
                    onChange={(e) => setReceiptConfig({ ...receiptConfig, businessName: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Header Tagline</Label>
                  <Input
                    value={receiptConfig.tagline}
                    onChange={(e) => setReceiptConfig({ ...receiptConfig, tagline: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Header Alignment</Label>
                  <select
                    value={receiptConfig.headerAlignment}
                    onChange={(e) => setReceiptConfig({ ...receiptConfig, headerAlignment: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                  >
                    <option value="center">Centered</option>
                    <option value="left">Left Aligned</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Font Style</Label>
                  <select
                    value={receiptConfig.fontFamily}
                    onChange={(e) => setReceiptConfig({ ...receiptConfig, fontFamily: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white font-mono"
                  >
                    <option value="monospace">Thermal Monospace (Clean &amp; Sharp)</option>
                    <option value="sans-serif">Modern Sans-Serif</option>
                  </select>
                </div>
              </div>

              {/* Visibility Toggles */}
              <div className="space-y-2.5 pt-2">
                <Label className="text-xs font-bold text-slate-800 block">Print Elements &amp; Summary Toggles</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={receiptConfig.showUpiQr}
                      onChange={(e) => setReceiptConfig({ ...receiptConfig, showUpiQr: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-slate-700">Dynamic UPI QR Code</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={receiptConfig.showGstSummary}
                      onChange={(e) => setReceiptConfig({ ...receiptConfig, showGstSummary: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-slate-700">GST Slab Summary Table</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={receiptConfig.showHsnCode}
                      onChange={(e) => setReceiptConfig({ ...receiptConfig, showHsnCode: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-slate-700">HSN / SAC Code on Lines</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={receiptConfig.showSavingsBanner}
                      onChange={(e) => setReceiptConfig({ ...receiptConfig, showSavingsBanner: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-slate-700">Total Customer Savings Banner</span>
                  </label>
                </div>
              </div>

              {/* UPI ID & Footer Notes */}
              <div className="space-y-3 pt-2">
                <div>
                  <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Store UPI VPA (for QR code)</Label>
                  <Input
                    value={receiptConfig.upiId}
                    onChange={(e) => setReceiptConfig({ ...receiptConfig, upiId: e.target.value })}
                    placeholder="kirana@okicici"
                    className="text-xs font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Footer Terms &amp; Return Policy</Label>
                  <Input
                    value={receiptConfig.termsAndConditions}
                    onChange={(e) => setReceiptConfig({ ...receiptConfig, termsAndConditions: e.target.value })}
                    placeholder="Items once sold cannot be returned without original receipt."
                    className="text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Right Side: Interactive Thermal Paper Preview (5 cols) */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                  <span>Thermal Preview ({receiptConfig.paperWidth}mm)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Live ESC/POS</span>
              </div>

              {/* Receipt Paper Simulation */}
              <div
                className={cn(
                  'bg-white border border-slate-300 rounded-lg p-4 shadow-md text-slate-900 transition-all font-mono',
                  receiptConfig.paperWidth === 58 ? 'w-[280px] text-[11px]' : 'w-[340px] text-[12px]'
                )}
                style={{
                  fontFamily: receiptConfig.fontFamily === 'monospace' ? '"Courier New", Courier, monospace' : 'sans-serif',
                }}
              >
                {/* Header */}
                <div className={receiptConfig.headerAlignment === 'center' ? 'text-center' : 'text-left'}>
                  <div className="font-bold text-sm uppercase tracking-wide">{receiptConfig.businessName || 'STORE NAME'}</div>
                  {receiptConfig.tagline && <div className="text-[10px] text-slate-600">{receiptConfig.tagline}</div>}
                  <div className="text-[10px] text-slate-500 mt-1">{receiptConfig.addressLine1 || 'Market Road'}</div>
                  <div className="text-[10px] text-slate-500">Ph: {receiptConfig.phone || '9876543210'}</div>
                  <div className="text-[10px] text-slate-600 font-bold mt-0.5">GSTIN: {receiptConfig.gstin || '27AABCU9603R1ZM'}</div>
                  {receiptConfig.fssaiNumber && <div className="text-[10px] text-slate-600">FSSAI: {receiptConfig.fssaiNumber}</div>}
                </div>

                <div className="border-t border-dashed border-slate-400 my-2" />

                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>Inv: INV-20261106-0042</span>
                  <span>06/11/26 14:30</span>
                </div>
                <div className="text-[10px] text-slate-600">Cashier: Counter 1</div>

                <div className="border-t border-dashed border-slate-400 my-2" />

                {/* Sample items */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-bold">Fortune Sun Oil 1L</div>
                      <div className="text-[9px] text-slate-500">1 x ₹140.00 {receiptConfig.showHsnCode && '(HSN:1512)'}</div>
                    </div>
                    <span className="font-bold">₹140.00</span>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <div className="font-bold">Aashirvaad Atta 5kg</div>
                      <div className="text-[9px] text-slate-500">1 x ₹260.00 {receiptConfig.showHsnCode && '(HSN:1101)'}</div>
                    </div>
                    <span className="font-bold">₹260.00</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-400 my-2" />

                {/* Totals */}
                <div className="space-y-0.5">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹400.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (5%):</span>
                    <span>₹20.00</span>
                  </div>
                  <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-300">
                    <span>TOTAL:</span>
                    <span>₹420.00</span>
                  </div>
                </div>

                {/* Savings Banner */}
                {receiptConfig.showSavingsBanner && (
                  <div className="mt-2 text-center p-1 bg-emerald-50 text-emerald-800 font-bold text-[10px] rounded border border-emerald-200">
                    🎉 YOU SAVED ₹45.00 TODAY!
                  </div>
                )}

                {/* QR Code Placeholder */}
                {receiptConfig.showUpiQr && (
                  <div className="mt-3 text-center flex flex-col items-center">
                    <div className="w-20 h-20 border-2 border-slate-900 flex items-center justify-center p-1 bg-white">
                      <QrCode className="h-16 w-16 text-slate-900" />
                    </div>
                    <div className="text-[9px] font-bold text-slate-600 mt-1">Scan to Pay via UPI</div>
                    <div className="text-[8px] text-slate-500 font-mono">{receiptConfig.upiId}</div>
                  </div>
                )}

                {/* Footer Notes */}
                <div className="border-t border-dashed border-slate-400 my-2" />
                <div className="text-center text-[9px] text-slate-600">
                  <div>{receiptConfig.termsAndConditions || 'Thank you for shopping with us!'}</div>
                  <div className="font-bold mt-0.5">*** VISIT AGAIN ***</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 3: BILLING & INVOICING RULES --- */}
      {activeTab === 'billing' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Invoicing Rules &amp; Cash Rounding Policy</h3>
              <p className="text-xs text-slate-500">Configure sequential billing prefixes, cash register rounding, and inventory safeguards.</p>
            </div>
            <Button
              onClick={handleSaveBillingRules}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-8 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save Invoicing Rules
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            <div>
              <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Invoice Number Prefix *</Label>
              <Input
                value={billingRules.invoicePrefix}
                onChange={(e) => setBillingRules({ ...billingRules, invoicePrefix: e.target.value })}
                placeholder="e.g. INV-, POS-"
                className="text-xs font-mono uppercase"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Prepended to invoice numbers (e.g. INV-20261106-0001)</span>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Next Sequence Number</Label>
              <Input
                type="number"
                value={billingRules.nextInvoiceSequence}
                onChange={(e) => setBillingRules({ ...billingRules, nextInvoiceSequence: parseInt(e.target.value) || 1 })}
                className="text-xs font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Current counter for daily bill sequencing</span>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Cash Rounding Policy</Label>
              <select
                value={billingRules.cashRoundingPolicy}
                onChange={(e) => setBillingRules({ ...billingRules, cashRoundingPolicy: e.target.value as any })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white font-semibold"
              >
                <option value="nearest_rupee">Round to Nearest ₹1.00 (Standard Cash Tender)</option>
                <option value="exact">Exact Paise (2 Decimals — e.g. ₹140.25)</option>
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">Applies to final cash tender rounding</span>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Default GST Slab for New Items</Label>
              <select
                value={billingRules.defaultGstRate}
                onChange={(e) => setBillingRules({ ...billingRules, defaultGstRate: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
              >
                <option value="0.00">0.00% (Exempt / Grains / Milk)</option>
                <option value="5.00">5.00% (Essential FMCG / Edible Oils / Packaged Food)</option>
                <option value="12.00">12.00% (Processed Food / Dairy Items)</option>
                <option value="18.00">18.00% (Confectionery / Household Goods)</option>
                <option value="28.00">28.00% (Luxury Goods)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-800">Operational Safeguards</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={billingRules.enableStockWarningOnBilling}
                  onChange={(e) => setBillingRules({ ...billingRules, enableStockWarningOnBilling: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-bold text-xs text-slate-800 block">Strict Stock Guard</span>
                  <span className="text-[11px] text-slate-500">Prevent cashier from billing items with zero or negative stock balances.</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={billingRules.autoPrintReceiptOnCheckout}
                  onChange={(e) => setBillingRules({ ...billingRules, autoPrintReceiptOnCheckout: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-bold text-xs text-slate-800 block">Immediate Receipt Print</span>
                  <span className="text-[11px] text-slate-500">Automatically trigger browser print dialog immediately upon successful sale confirmation.</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 4: BRANCHES & GSTIN --- */}
      {activeTab === 'branches' && (
        <BranchesView
          branches={branches}
          onRefresh={onRefresh}
          onEditBranch={onEditBranch || (() => {})}
        />
      )}

      {/* --- SUB-TAB 5: POS HARDWARE DEVICES --- */}
      {activeTab === 'devices' && (
        <DevicesView
          devices={devices}
          onRefresh={onRefresh}
          tenantId={tenantId}
          branchId={branchId}
          tenantName={tenantName}
          branchName={branchName}
        />
      )}

      {/* --- SUB-TAB 6: SUBSCRIPTION & PLAN --- */}
      {activeTab === 'subscription' && (
        <SubscriptionView subscription={subscription} />
      )}
    </div>
  );
}

