'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Printer,
  Sparkles,
  RotateCcw,
  Save,
  Building2,
  FileText,
  Percent,
  QrCode,
  X,
  Eye,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ReceiptDesignConfig,
  DEFAULT_RECEIPT_CONFIG,
  getReceiptConfig,
  saveReceiptConfig,
} from '@/lib/receipt-template';

export interface ReceiptDesignerModalProps {
  open: boolean;
  onClose: () => void;
  tenantId?: string;
  branchId?: string;
  tenantName?: string;
  branchName?: string;
}

export function ReceiptDesignerModal({
  open,
  onClose,
  tenantId,
  branchId,
  tenantName,
  branchName,
}: ReceiptDesignerModalProps) {
  const [config, setConfig] = useState<ReceiptDesignConfig>(DEFAULT_RECEIPT_CONFIG);
  const [activeTab, setActiveTab] = useState<'header' | 'paper' | 'tax' | 'footer'>('header');

  useEffect(() => {
    if (open) {
      const loaded = getReceiptConfig(tenantId, branchId);
      // Prepopulate with tenant and branch names if defaults
      if (tenantName && loaded.businessName === DEFAULT_RECEIPT_CONFIG.businessName) {
        loaded.businessName = tenantName;
      }
      if (branchName && loaded.branchName === DEFAULT_RECEIPT_CONFIG.branchName) {
        loaded.branchName = branchName;
      }
      setConfig(loaded);
    }
  }, [open, tenantId, branchId, tenantName, branchName]);

  const updateConfig = (field: keyof ReceiptDesignConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    saveReceiptConfig(config, tenantId, branchId);
    toast.success('Receipt design saved successfully! Active for all future prints.');
    onClose();
  };

  const handleReset = () => {
    setConfig({
      ...DEFAULT_RECEIPT_CONFIG,
      businessName: tenantName || DEFAULT_RECEIPT_CONFIG.businessName,
      branchName: branchName || DEFAULT_RECEIPT_CONFIG.branchName,
    });
    toast.info('Reset receipt design to standard Kirana template.');
  };

  const handlePrintSample = () => {
    const printWindow = window.open('', '_blank', 'width=420,height=600');
    if (!printWindow) {
      toast.error('Unable to open print preview. Please check popup permissions.');
      return;
    }

    const receiptHtml = document.getElementById('receipt-preview-paper')?.innerHTML || '';
    const style = `
      <style>
        body { margin: 0; padding: 10px; font-family: ${config.fontFamily}; font-size: 11px; color: #000; }
        .thermal-receipt { width: ${config.paperWidth === 58 ? '48mm' : '72mm'}; margin: 0 auto; }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .divider { border-top: 1px dashed #000; margin: 4px 0; }
        .flex-between { display: flex; justify-content: space-between; }
        @media print {
          @page { margin: 0; size: ${config.paperWidth}mm auto; }
          body { margin: 0; padding: 2mm; }
        }
      </style>
    `;

    printWindow.document.write(`<html><head><title>Print Sample Bill</title>${style}</head><body><div class="thermal-receipt">${receiptHtml}</div></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="max-w-4xl p-0 overflow-hidden max-h-[92vh] flex flex-col"
        data-testid="receipt-designer-modal"
      >
        {/* Header */}
        <DialogHeader className="p-4 bg-slate-900 text-white shrink-0 flex flex-row items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-white leading-tight">
                Bill &amp; Receipt Design Customizer
              </DialogTitle>
              <DialogDescription className="text-[11px] text-slate-400">
                Customize store headers, paper width, tax summaries, UPI QR, and footer messages
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-8 text-xs bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              data-testid="save-receipt-design-btn"
              className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              Save Design
            </Button>
          </div>
        </DialogHeader>

        {/* Two-Column Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 bg-slate-100">
          {/* Left Column: Form Controls (7 cols) */}
          <div className="md:col-span-7 flex flex-col bg-white border-r border-slate-200 overflow-hidden">
            {/* Sub-tab Navigation */}
            <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50/70 p-1 gap-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('header')}
                className={`py-2 px-1 rounded-lg text-center transition cursor-pointer text-[11px] font-bold ${
                  activeTab === 'header'
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                1. Store Header
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('paper')}
                className={`py-2 px-1 rounded-lg text-center transition cursor-pointer text-[11px] font-bold ${
                  activeTab === 'paper'
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                2. Paper &amp; Style
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('tax')}
                className={`py-2 px-1 rounded-lg text-center transition cursor-pointer text-[11px] font-bold ${
                  activeTab === 'tax'
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                3. Tax &amp; Items
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('footer')}
                className={`py-2 px-1 rounded-lg text-center transition cursor-pointer text-[11px] font-bold ${
                  activeTab === 'footer'
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                4. UPI &amp; Footer
              </button>
            </div>

            {/* Tab 1: Store & Header */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3.5">
              {activeTab === 'header' && (
                <>
                  <div>
                    <Label className="text-xs font-bold text-slate-700" htmlFor="businessName">
                      Business / Store Trade Name *
                    </Label>
                    <Input
                      id="businessName"
                      data-testid="business-name-input"
                      value={config.businessName}
                      onChange={(e) => updateConfig('businessName', e.target.value)}
                      placeholder="e.g. Kirana Supermart"
                      className="text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-700">Tagline / Subtitle</Label>
                    <Input
                      value={config.tagline}
                      onChange={(e) => updateConfig('tagline', e.target.value)}
                      placeholder="e.g. Quality Groceries & Daily Needs"
                      className="text-xs mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <Label className="text-xs font-bold text-slate-700">Branch Name</Label>
                      <Input
                        value={config.branchName}
                        onChange={(e) => updateConfig('branchName', e.target.value)}
                        placeholder="e.g. Main Store - Andheri West"
                        className="text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-700">Contact Phone / WhatsApp</Label>
                      <Input
                        value={config.phone}
                        onChange={(e) => updateConfig('phone', e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="text-xs mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-700">Address Line 1</Label>
                    <Input
                      value={config.addressLine1}
                      onChange={(e) => updateConfig('addressLine1', e.target.value)}
                      placeholder="e.g. Shop No. 4, Market Complex"
                      className="text-xs mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs font-bold text-slate-700">City</Label>
                      <Input
                        value={config.city}
                        onChange={(e) => updateConfig('city', e.target.value)}
                        placeholder="Mumbai"
                        className="text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-700">State Code</Label>
                      <Input
                        value={config.stateCode}
                        onChange={(e) => updateConfig('stateCode', e.target.value)}
                        placeholder="27 (MH)"
                        className="text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-700">PIN Code</Label>
                      <Input
                        value={config.postalCode}
                        onChange={(e) => updateConfig('postalCode', e.target.value)}
                        placeholder="400058"
                        className="text-xs mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <Label className="text-xs font-bold text-slate-700">GSTIN (Optional if exempted)</Label>
                      <Input
                        value={config.gstin}
                        onChange={(e) => updateConfig('gstin', e.target.value.toUpperCase())}
                        placeholder="e.g. 27AABCU9603R1ZM"
                        className="text-xs font-mono uppercase mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-700">FSSAI License No.</Label>
                      <Input
                        value={config.fssaiNumber}
                        onChange={(e) => updateConfig('fssaiNumber', e.target.value)}
                        placeholder="e.g. 11521000000000"
                        className="text-xs font-mono mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-700">Header Text Alignment</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => updateConfig('headerAlignment', 'center')}
                        className={`p-2 text-xs font-semibold rounded-lg border transition ${
                          config.headerAlignment === 'center'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Center Aligned (Standard)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateConfig('headerAlignment', 'left')}
                        className={`p-2 text-xs font-semibold rounded-lg border transition ${
                          config.headerAlignment === 'left'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Left Aligned
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Tab 2: Paper & Dimensions */}
              {activeTab === 'paper' && (
                <>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Thermal Printer Paper Width *</Label>
                    <div className="grid grid-cols-2 gap-3 mt-1.5">
                      <div
                        onClick={() => updateConfig('paperWidth', 58)}
                        className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${
                          config.paperWidth === 58
                            ? 'border-emerald-600 bg-emerald-50/50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <span className="font-bold text-xs text-slate-900 block">58 mm (2-inch Roll)</span>
                          <span className="text-[11px] text-slate-500 mt-0.5 block">
                            Standard portable Bluetooth &amp; handheld billing machines (32 chars/line).
                          </span>
                        </div>
                        {config.paperWidth === 58 && (
                          <div className="mt-2 text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Selected
                          </div>
                        )}
                      </div>

                      <div
                        onClick={() => updateConfig('paperWidth', 80)}
                        className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${
                          config.paperWidth === 80
                            ? 'border-emerald-600 bg-emerald-50/50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <span className="font-bold text-xs text-slate-900 block">80 mm (3-inch Roll)</span>
                          <span className="text-[11px] text-slate-500 mt-0.5 block">
                            Full-size desktop POS printers &amp; high-speed thermal printers (48 chars/line).
                          </span>
                        </div>
                        {config.paperWidth === 80 && (
                          <div className="mt-2 text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Selected
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-700">Print Typography</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => updateConfig('fontFamily', 'monospace')}
                        className={`p-2 text-xs font-semibold rounded-lg border transition font-mono ${
                          config.fontFamily === 'monospace'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Monospace (ESC/POS Thermal)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateConfig('fontFamily', 'sans-serif')}
                        className={`p-2 text-xs font-semibold rounded-lg border transition font-sans ${
                          config.fontFamily === 'sans-serif'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Modern Clean Sans
                      </button>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50/50">
                    <Label className="text-xs font-bold text-slate-800">Layout Density</Label>
                    <label className="flex items-center justify-between text-xs cursor-pointer">
                      <span className="text-slate-700">Compact item rows (saves thermal paper)</span>
                      <input
                        type="checkbox"
                        checked={config.compactLines}
                        onChange={(e) => updateConfig('compactLines', e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                    </label>
                  </div>
                </>
              )}

              {/* Tab 3: Tax & Item Details */}
              {activeTab === 'tax' && (
                <div className="space-y-3">
                  <div className="border border-slate-200 rounded-xl p-3 space-y-2.5 bg-white">
                    <span className="text-xs font-bold text-slate-800 block">Item Line Options</span>

                    <label className="flex items-center justify-between text-xs cursor-pointer">
                      <div>
                        <span className="text-slate-700 font-medium block">Show HSN Commodity Code</span>
                        <span className="text-[11px] text-slate-500">Prints HSN code next to product name</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.showHsnCode}
                        onChange={(e) => updateConfig('showHsnCode', e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                    </label>

                    <label className="flex items-center justify-between text-xs cursor-pointer border-t border-slate-100 pt-2">
                      <div>
                        <span className="text-slate-700 font-medium block">Show Package / Variant Size</span>
                        <span className="text-[11px] text-slate-500">e.g. &apos;5 kg&apos;, &apos;500 ml&apos;, &apos;Pack of 3&apos;</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.showPackageSize}
                        onChange={(e) => updateConfig('showPackageSize', e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                    </label>

                    <label className="flex items-center justify-between text-xs cursor-pointer border-t border-slate-100 pt-2">
                      <div>
                        <span className="text-slate-700 font-medium block">Show Item SKU</span>
                        <span className="text-[11px] text-slate-500">Prints internal stock code</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.showItemSku}
                        onChange={(e) => updateConfig('showItemSku', e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                    </label>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-3 space-y-2.5 bg-white">
                    <span className="text-xs font-bold text-slate-800 block">Tax &amp; Customer Information</span>

                    <label className="flex items-center justify-between text-xs cursor-pointer">
                      <div>
                        <span className="text-slate-700 font-medium block">Detailed GST Tax Breakdown</span>
                        <span className="text-[11px] text-slate-500">Prints CGST and SGST tax slab rows</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.showGstSummary}
                        onChange={(e) => updateConfig('showGstSummary', e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                    </label>

                    <label className="flex items-center justify-between text-xs cursor-pointer border-t border-slate-100 pt-2">
                      <div>
                        <span className="text-slate-700 font-medium block">Show Customer Name &amp; Phone</span>
                        <span className="text-[11px] text-slate-500">Prints customer details when linked to bill</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.showCustomerDetails}
                        onChange={(e) => updateConfig('showCustomerDetails', e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                    </label>

                    <label className="flex items-center justify-between text-xs cursor-pointer border-t border-slate-100 pt-2">
                      <div>
                        <span className="text-slate-700 font-medium block">Show Customer Khata Balance</span>
                        <span className="text-[11px] text-slate-500">Prints previous balance &amp; current due on Udhar</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.showCustomerKhataBalance}
                        onChange={(e) => updateConfig('showCustomerKhataBalance', e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                    </label>

                    <label className="flex items-center justify-between text-xs cursor-pointer border-t border-slate-100 pt-2">
                      <div>
                        <span className="text-slate-700 font-medium block">Highlight Savings Banner</span>
                        <span className="text-[11px] text-slate-500">&apos;🎉 You saved ₹XX.XX today!&apos;</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.showSavingsBanner}
                        onChange={(e) => updateConfig('showSavingsBanner', e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Tab 4: UPI & Footer */}
              {activeTab === 'footer' && (
                <div className="space-y-3.5">
                  <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2.5">
                    <label className="flex items-center justify-between text-xs cursor-pointer">
                      <div>
                        <span className="text-slate-800 font-bold block">Print Dynamic UPI QR Code</span>
                        <span className="text-[11px] text-slate-500">Customers can scan bill directly to pay</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.showUpiQr}
                        onChange={(e) => updateConfig('showUpiQr', e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                    </label>

                    {config.showUpiQr && (
                      <div className="pt-2">
                        <Label className="text-xs font-bold text-slate-700">Store UPI VPA Address *</Label>
                        <Input
                          value={config.upiId}
                          onChange={(e) => updateConfig('upiId', e.target.value)}
                          placeholder="e.g. kirana.supermart@okicici"
                          className="text-xs font-mono mt-1"
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          UPI QR string: upi://pay?pa={config.upiId}&amp;pn={config.businessName}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-700">Thank You Message</Label>
                    <Input
                      value={config.thankYouMessage}
                      onChange={(e) => updateConfig('thankYouMessage', e.target.value)}
                      placeholder="Thank you for shopping with us! Please visit again."
                      className="text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-700">Terms &amp; Exchange Policy</Label>
                    <textarea
                      value={config.termsAndConditions}
                      onChange={(e) => updateConfig('termsAndConditions', e.target.value)}
                      placeholder="Goods once sold can be exchanged within 24 hours with original receipt."
                      rows={2}
                      className="w-full text-xs mt-1 bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="border border-slate-200 rounded-xl p-3 bg-white flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Show Powered by MSME POS</span>
                      <span className="text-[11px] text-slate-500">Subtle footnote branding</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.showBranding}
                      onChange={(e) => updateConfig('showBranding', e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Print Sample Button */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">Changes preview in real-time</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrintSample}
                className="h-8 text-xs bg-white text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs font-semibold"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                Test Print Bill
              </Button>
            </div>
          </div>

          {/* Right Column: Live Thermal Paper Bill Preview (5 cols) */}
          <div className="md:col-span-5 p-4 flex flex-col items-center justify-center overflow-y-auto bg-slate-200/80">
            <div className="text-[11px] font-bold text-slate-500 mb-2 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>Live Thermal Bill Preview ({config.paperWidth}mm)</span>
            </div>

            {/* Photorealistic Thermal Receipt Container */}
            <div
              id="receipt-preview-paper"
              data-testid="receipt-live-preview"
              style={{
                fontFamily: config.fontFamily === 'monospace' ? '"Courier New", Courier, monospace' : 'inherit',
                maxWidth: config.paperWidth === 58 ? '300px' : '380px',
                width: '100%',
              }}
              className="bg-white p-5 shadow-xl text-black border-t-4 border-b-4 border-slate-300 relative text-xs leading-tight transition-all duration-200 select-none"
            >
              {/* Header */}
              <div className={config.headerAlignment === 'center' ? 'text-center' : 'text-left'}>
                <h2 className="font-black text-sm uppercase tracking-wide">{config.businessName}</h2>
                {config.tagline && <p className="text-[11px] text-slate-700 mt-0.5">{config.tagline}</p>}
                <p className="text-[10px] mt-1 text-slate-800">{config.branchName}</p>
                {config.addressLine1 && (
                  <p className="text-[10px] text-slate-600">{config.addressLine1}</p>
                )}
                <p className="text-[10px] text-slate-600">
                  {config.city}{config.postalCode ? ` - ${config.postalCode}` : ''}
                </p>
                {config.phone && <p className="text-[10px] font-bold mt-0.5">Ph: {config.phone}</p>}
                {config.gstin && <p className="text-[10px] font-mono mt-0.5">GSTIN: {config.gstin}</p>}
                {config.fssaiNumber && <p className="text-[10px] font-mono">FSSAI: {config.fssaiNumber}</p>}
              </div>

              <div className="border-t border-dashed border-slate-400 my-2.5" />

              {/* Invoice Meta */}
              <div className="flex justify-between text-[11px] text-slate-800">
                <span>Bill: INV-20261103-0042</span>
                <span>Date: 03/11/26 19:45</span>
              </div>
              {config.showCashierName && (
                <div className="text-[10px] text-slate-600 mt-0.5">
                  Cashier: Ramesh (Counter 1)
                </div>
              )}
              {config.showCustomerDetails && (
                <div className="text-[10px] text-slate-700 mt-0.5 pt-1 border-t border-slate-200">
                  Customer: Rajesh Sharma (+91 98200 12345)
                </div>
              )}

              <div className="border-t border-dashed border-slate-400 my-2.5" />

              {/* Items Table */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-[11px] border-b border-slate-200 pb-1">
                  <span>ITEM</span>
                  <span>TOTAL</span>
                </div>

                {/* Sample Item 1 */}
                <div>
                  <div className="flex justify-between font-semibold">
                    <span>Aashirvaad Atta{config.showPackageSize ? ' 5kg' : ''}</span>
                    <span>₹240.00</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>1 PKT x ₹240.00 {config.showHsnCode ? '(HSN:1101)' : ''}</span>
                    {config.showItemDiscount && <span className="text-emerald-700">-₹20.00</span>}
                  </div>
                </div>

                {/* Sample Item 2 */}
                <div>
                  <div className="flex justify-between font-semibold">
                    <span>Amul Butter{config.showPackageSize ? ' 500g' : ''}</span>
                    <span>₹275.00</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>1 PKT x ₹275.00 {config.showHsnCode ? '(HSN:0405)' : ''}</span>
                    {config.showItemDiscount && <span className="text-emerald-700">-₹15.00</span>}
                  </div>
                </div>

                {/* Sample Item 3 */}
                <div>
                  <div className="flex justify-between font-semibold">
                    <span>Fortune Sunflower Oil{config.showPackageSize ? ' 1L' : ''}</span>
                    <span>₹165.00</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>1 LTR x ₹165.00 {config.showHsnCode ? '(HSN:1512)' : ''}</span>
                    {config.showItemDiscount && <span className="text-emerald-700">-₹10.00</span>}
                  </div>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-400 my-2.5" />

              {/* Totals */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹725.00</span>
                </div>
                {config.showItemDiscount && (
                  <div className="flex justify-between font-semibold text-emerald-800">
                    <span>Discount:</span>
                    <span>-₹45.00</span>
                  </div>
                )}
                {config.showGstSummary && (
                  <>
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>CGST (2.5% + 6%):</span>
                      <span>₹22.50</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>SGST (2.5% + 6%):</span>
                      <span>₹22.50</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-black text-sm border-t border-slate-800 pt-1 mt-1">
                  <span>GRAND TOTAL:</span>
                  <span>₹680.00</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-600 pt-0.5">
                  <span>Paid via: UPI (GPay)</span>
                  <span>Ref: UPI-938201</span>
                </div>
              </div>

              {/* Customer Khata Balance Note */}
              {config.showCustomerKhataBalance && (
                <div className="mt-2 p-1.5 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-700">
                  <div className="flex justify-between font-bold">
                    <span>Khata Outstanding:</span>
                    <span>₹0.00 (Cleared)</span>
                  </div>
                </div>
              )}

              {/* Savings Banner */}
              {config.showSavingsBanner && (
                <div className="my-2.5 py-1 px-2 border border-dashed border-emerald-600 bg-emerald-50 text-emerald-900 text-center font-bold text-[10px] rounded">
                  🎉 You saved ₹45.00 on this order!
                </div>
              )}

              {/* Dynamic UPI QR Code */}
              {config.showUpiQr && config.upiId && (
                <div className="my-3 text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-slate-100 border border-slate-300 rounded flex flex-col items-center justify-center p-1">
                    <QrCode className="w-12 h-12 text-slate-900" />
                    <span className="text-[8px] font-bold text-slate-700 mt-0.5">SCAN TO PAY</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-600 mt-1">{config.upiId}</span>
                </div>
              )}

              {/* Footer messages */}
              <div className="text-center text-[10px] text-slate-700 space-y-1 mt-2">
                {config.thankYouMessage && <p className="font-semibold">{config.thankYouMessage}</p>}
                {config.termsAndConditions && (
                  <p className="text-[9px] text-slate-500 leading-tight">{config.termsAndConditions}</p>
                )}
              </div>

              {/* Footnote Branding */}
              {config.showBranding && (
                <div className="text-center text-[8px] text-slate-400 mt-3 pt-2 border-t border-slate-200">
                  Powered by MSME POS Platform • pos.assistt.in
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
