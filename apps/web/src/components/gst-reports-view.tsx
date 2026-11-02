'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  apiClient,
  Gstr1Response,
  Gstr3bResponse,
  SalesRegisterResponse,
  SupplierInvoice,
  Supplier,
  Branch,
  Product,
} from '@/lib/api-client';
import {
  BarChart3,
  FileSpreadsheet,
  FileJson,
  Printer,
  Receipt,
  AlertTriangle,
  Scale,
  Calendar,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gstr1TableView } from '@/features/gst/gstr1-table-view';
import { Gstr3bTableView } from '@/features/gst/gstr3b-table-view';
import { SalesRegisterTableView } from '@/features/gst/sales-register-table-view';
import { VendorInvoicesTableView } from '@/features/gst/vendor-invoices-table-view';
import {
  RecordVendorBillDialog,
  VendorBillFormData,
} from '@/features/gst/record-vendor-bill-dialog';

interface GstReportsViewProps {
  tenantId: string;
  branches: Branch[];
  suppliers: Supplier[];
  products: Product[];
  activeBranchId?: string;
}

export function GstReportsView({
  tenantId,
  branches,
  suppliers,
  products,
  activeBranchId,
}: GstReportsViewProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedBranchId, setSelectedBranchId] = useState<string>(activeBranchId || '');

  const [activeSubTab, setActiveSubTab] = useState<'gstr1' | 'gstr3b' | 'salesRegister' | 'supplierInvoices'>('gstr1');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [gstr1Data, setGstr1Data] = useState<Gstr1Response | null>(null);
  const [gstr3bData, setGstr3bData] = useState<Gstr3bResponse | null>(null);
  const [salesRegisterData, setSalesRegisterData] = useState<SalesRegisterResponse | null>(null);
  const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoice[]>([]);

  // Vendor Invoice Modal State
  const [vendorModal, setVendorModal] = useState<VendorBillFormData>({
    open: false,
    branchId: activeBranchId || (branches[0]?.id ?? ''),
    supplierId: suppliers[0]?.id ?? '',
    purchaseOrderId: '',
    supplierInvoiceNumber: '',
    supplierInvoiceDate: new Date().toISOString().slice(0, 10),
    isItcEligible: true,
    ineligibilityReason: '',
    isReverseCharge: false,
    placeOfSupply: '27',
    notes: '',
    lines: [
      {
        productId: '',
        description: '',
        hsnCode: '',
        quantity: '1.000',
        unitCost: '0.00',
        gstRatePercent: '5.00',
      },
    ],
  });

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);

    const query = {
      month: selectedMonth,
      year: selectedYear,
      branchId: selectedBranchId || undefined,
    };

    try {
      const [gstr1, gstr3b, salesReg, supInvoices] = await Promise.all([
        apiClient.getGstr1Report(tenantId, query),
        apiClient.getGstr3bReport(tenantId, query),
        apiClient.getSalesRegister(tenantId, query),
        apiClient.getSupplierInvoices(tenantId, selectedBranchId || undefined),
      ]);

      setGstr1Data(gstr1);
      setGstr3bData(gstr3b);
      setSalesRegisterData(salesReg);
      setSupplierInvoices(supInvoices);
    } catch (err: any) {
      setError(err.message || 'Failed to load GST reports');
    } finally {
      setLoading(false);
    }
  }, [tenantId, selectedMonth, selectedYear, selectedBranchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Export Handlers
  const handleDownloadGstr1Json = () => {
    if (!gstr1Data) return;
    const blob = new Blob([JSON.stringify(gstr1Data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR-1_${gstr1Data.gstin}_${selectedMonth}_${selectedYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportGstr1Csv = () => {
    if (!gstr1Data) return;
    const lines: string[] = [];

    // Header
    lines.push(`"GSTR-1 PREPARATION REPORT - ${gstr1Data.legalName}"`);
    lines.push(`"GSTIN","${gstr1Data.gstin}","Tax Period","${gstr1Data.taxPeriod}","Branch","${gstr1Data.branchName}"`);
    lines.push(`"DISCLAIMER","${gstr1Data.statutoryDisclaimer}"`);
    lines.push('');

    // Summary
    lines.push('"SUMMARY"');
    lines.push('"Total Invoices","Total Taxable Value","Total CGST","Total SGST","Total IGST","Total Tax","Total Invoice Value"');
    lines.push(
      `"${gstr1Data.summary.totalInvoices}","${gstr1Data.summary.totalTaxableValue}","${gstr1Data.summary.totalCgst}","${gstr1Data.summary.totalSgst}","${gstr1Data.summary.totalIgst}","${gstr1Data.summary.totalTax}","${gstr1Data.summary.totalInvoiceValue}"`,
    );
    lines.push('');

    // Table 4: B2B
    lines.push('"TABLE 4 - B2B INVOICES"');
    lines.push('"Recipient GSTIN","Customer Name","Invoice Number","Invoice Date","Invoice Value","POS","Reverse Charge","Rate %","Taxable Value","CGST","SGST","IGST"');
    for (const b of gstr1Data.b2b) {
      lines.push(
        `"${b.customerGstin}","${b.customerName}","${b.invoiceNumber}","${b.invoiceDate}","${b.invoiceValue}","${b.placeOfSupply}","${b.reverseCharge}","${b.rate}","${b.taxableValue}","${b.cgstAmount}","${b.sgstAmount}","${b.igstAmount}"`,
      );
    }
    lines.push('');

    // Table 7: B2C Small
    lines.push('"TABLE 7 - B2C SMALL"');
    lines.push('"Place of Supply","Supply Type","Rate %","Taxable Value","CGST","SGST","IGST","Total Tax"');
    for (const s of gstr1Data.b2cs) {
      lines.push(
        `"${s.placeOfSupply}","${s.supplyType}","${s.rate}","${s.taxableValue}","${s.cgstAmount}","${s.sgstAmount}","${s.igstAmount}","${s.totalTax}"`,
      );
    }
    lines.push('');

    // Table 12: HSN Summary
    lines.push('"TABLE 12 - HSN SUMMARY"');
    lines.push('"HSN Code","Description","UQC","Total Quantity","Total Value","Taxable Value","CGST","SGST","IGST"');
    for (const h of gstr1Data.hsnSummary) {
      lines.push(
        `"${h.hsnCode}","${h.description}","${h.uqc}","${h.totalQuantity}","${h.totalValue}","${h.taxableValue}","${h.cgstAmount}","${h.sgstAmount}","${h.igstAmount}"`,
      );
    }

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR-1_${gstr1Data.gstin}_${selectedMonth}_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportGstr3bCsv = () => {
    if (!gstr3bData) return;
    const lines: string[] = [];

    lines.push(`"GSTR-3B SUMMARY RETURN - ${gstr3bData.legalName}"`);
    lines.push(`"GSTIN","${gstr3bData.gstin}","Tax Period","${gstr3bData.taxPeriod}","Branch","${gstr3bData.branchName}"`);
    lines.push(`"DISCLAIMER","${gstr3bData.statutoryDisclaimer}"`);
    lines.push('');

    lines.push('"TABLE 3.1 - DETAILS OF OUTWARD SUPPLIES"');
    lines.push('"Nature of Supply","Total Taxable Value","IGST","CGST","SGST","Cess"');
    const t31 = gstr3bData.table31;
    lines.push(`"Outward Taxable Supplies (other than zero/nil/exempt)","${t31.outwardTaxableSupplies.taxableValue}","${t31.outwardTaxableSupplies.igst}","${t31.outwardTaxableSupplies.cgst}","${t31.outwardTaxableSupplies.sgst}","${t31.outwardTaxableSupplies.cess}"`);
    lines.push(`"Outward Taxable Supplies (Zero Rated)","${t31.outwardZeroRated.taxableValue}","${t31.outwardZeroRated.igst}","${t31.outwardZeroRated.cgst}","${t31.outwardZeroRated.sgst}","${t31.outwardZeroRated.cess}"`);
    lines.push(`"Other Outward Supplies (Nil rated, Exempted)","${t31.otherOutwardNilExempt.taxableValue}","${t31.otherOutwardNilExempt.igst}","${t31.otherOutwardNilExempt.cgst}","${t31.otherOutwardNilExempt.sgst}","${t31.otherOutwardNilExempt.cess}"`);
    lines.push(`"Inward Supplies Liable to Reverse Charge","${t31.inwardLiableToReverseCharge.taxableValue}","${t31.inwardLiableToReverseCharge.igst}","${t31.inwardLiableToReverseCharge.cgst}","${t31.inwardLiableToReverseCharge.sgst}","${t31.inwardLiableToReverseCharge.cess}"`);
    lines.push('');

    lines.push('"TABLE 4 - ELIGIBLE & INELIGIBLE INPUT TAX CREDIT (ITC)"');
    lines.push('"ITC Component","IGST","CGST","SGST"');
    const t4 = gstr3bData.table4;
    lines.push(`"4(A)(5) All Other ITC (Verified Vendor Invoices)","${t4.itcAvailable.allOtherItc.igst}","${t4.itcAvailable.allOtherItc.cgst}","${t4.itcAvailable.allOtherItc.sgst}"`);
    lines.push(`"4(C) Net ITC Available","${t4.netItcAvailable.igst}","${t4.netItcAvailable.cgst}","${t4.netItcAvailable.sgst}"`);
    lines.push(`"4(D)(1) Ineligible ITC under Section 17(5)","${t4.ineligibleItc.section17_5.igst}","${t4.ineligibleItc.section17_5.cgst}","${t4.ineligibleItc.section17_5.sgst}"`);
    lines.push('');

    lines.push('"TAX SETTLEMENT & NET CASH PAYABLE"');
    lines.push('"Category","IGST","CGST","SGST","Total"');
    const ts = gstr3bData.taxSettlement;
    lines.push(`"Total Output Tax Liability","${ts.outputTaxLiability.igst}","${ts.outputTaxLiability.cgst}","${ts.outputTaxLiability.sgst}","${ts.outputTaxLiability.total}"`);
    lines.push(`"Net Eligible ITC Available","${ts.netEligibleItc.igst}","${ts.netEligibleItc.cgst}","${ts.netEligibleItc.sgst}","${ts.netEligibleItc.total}"`);
    lines.push(`"ITC Set-Off Applied","${ts.itcSetOff.igst}","${ts.itcSetOff.cgst}","${ts.itcSetOff.sgst}","${ts.itcSetOff.total}"`);
    lines.push(`"Net Tax Payable in Cash","${ts.netCashPayable.igst}","${ts.netCashPayable.cgst}","${ts.netCashPayable.sgst}","${ts.netCashPayable.total}"`);

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR-3B_${gstr3bData.gstin}_${selectedMonth}_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  // Vendor Bill Modal Handlers
  const handleOpenVendorModal = () => {
    setVendorModal({
      open: true,
      branchId: selectedBranchId || (branches[0]?.id ?? ''),
      supplierId: suppliers[0]?.id ?? '',
      purchaseOrderId: '',
      supplierInvoiceNumber: '',
      supplierInvoiceDate: new Date().toISOString().slice(0, 10),
      isItcEligible: true,
      ineligibilityReason: '',
      isReverseCharge: false,
      placeOfSupply: '27',
      notes: '',
      lines: [
        {
          productId: '',
          description: '',
          hsnCode: '',
          quantity: '1.000',
          unitCost: '0.00',
          gstRatePercent: '5.00',
        },
      ],
      error: undefined,
    });
  };

  const handleSubmitVendorInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorModal.supplierInvoiceNumber.trim()) {
      setVendorModal((prev) => ({ ...prev, error: 'Supplier Invoice Number is required' }));
      return;
    }
    if (!vendorModal.supplierId) {
      setVendorModal((prev) => ({ ...prev, error: 'Please select a supplier' }));
      return;
    }

    setVendorModal((prev) => ({ ...prev, isSubmitting: true, error: undefined }));

    try {
      await apiClient.recordSupplierInvoice(tenantId, {
        branchId: vendorModal.branchId,
        supplierId: vendorModal.supplierId,
        purchaseOrderId: vendorModal.purchaseOrderId || undefined,
        supplierInvoiceNumber: vendorModal.supplierInvoiceNumber.trim(),
        supplierInvoiceDate: new Date(vendorModal.supplierInvoiceDate).toISOString(),
        isItcEligible: vendorModal.isItcEligible,
        ineligibilityReason: vendorModal.ineligibilityReason.trim() || undefined,
        isReverseCharge: vendorModal.isReverseCharge,
        placeOfSupply: vendorModal.placeOfSupply.trim() || undefined,
        notes: vendorModal.notes.trim() || undefined,
        items: vendorModal.lines.map((l) => ({
          productId: l.productId || undefined,
          description: l.description.trim() || 'Vendor Item',
          hsnCode: l.hsnCode.trim() || undefined,
          quantity: l.quantity,
          unitCost: l.unitCost,
          gstRatePercent: l.gstRatePercent,
        })),
      });

      setVendorModal((prev) => ({ ...prev, open: false, isSubmitting: false }));
      await fetchData();
    } catch (err: any) {
      setVendorModal((prev) => ({
        ...prev,
        isSubmitting: false,
        error: err.message || 'Failed to record supplier invoice',
      }));
    }
  };

  const months = [
    { num: 1, name: 'January' },
    { num: 2, name: 'February' },
    { num: 3, name: 'March' },
    { num: 4, name: 'April' },
    { num: 5, name: 'May' },
    { num: 6, name: 'June' },
    { num: 7, name: 'July' },
    { num: 8, name: 'August' },
    { num: 9, name: 'September' },
    { num: 10, name: 'October' },
    { num: 11, name: 'November' },
    { num: 12, name: 'December' },
  ];

  return (
    <div className="space-y-6" data-testid="gst-reports-view">
      {/* 1. Top Bar: Filters & Action Buttons */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <BarChart3 className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              GST Statutory Reporting &amp; Returns Preparation
            </h2>
            <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-bold">
              Section 16(2) Verified
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Server-authoritative tax calculations from immutable invoice snapshots for GSTR-1, GSTR-3B &amp; Input Tax Credit (ITC).
          </p>
        </div>

        {/* Period & Branch Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Calendar className="h-3 w-3 text-slate-400" />
              Return Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              data-testid="gst-month-select"
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9"
            >
              {months.map((m) => (
                <option key={m.num} value={m.num}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              data-testid="gst-year-select"
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9"
            >
              {[2024, 2025, 2026, 2027].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Branch Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Building2 className="h-3 w-3 text-slate-400" />
              Branch Scope
            </label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              data-testid="gst-branch-select"
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9"
            >
              <option value="">🏢 Consolidated (All Branches)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-end gap-2 pt-4 lg:pt-0">
            <Button
              size="sm"
              onClick={handleDownloadGstr1Json}
              data-testid="export-gstr1-json-btn"
              className="h-9 px-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition shadow-xs cursor-pointer flex items-center gap-1.5"
              title="Download GSTR-1 JSON"
            >
              <FileJson className="h-3.5 w-3.5" />
              <span>GSTR-1 JSON</span>
            </Button>
            <Button
              size="sm"
              onClick={handleExportGstr1Csv}
              data-testid="export-gstr1-csv-btn"
              className="h-9 px-3 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-xs cursor-pointer flex items-center gap-1.5"
              title="Export GSTR-1 CSV"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>GSTR-1 CSV</span>
            </Button>
            <Button
              size="sm"
              onClick={handleExportGstr3bCsv}
              data-testid="export-gstr3b-csv-btn"
              className="h-9 px-3 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-xs cursor-pointer flex items-center gap-1.5"
              title="Export GSTR-3B CSV"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>GSTR-3B CSV</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              data-testid="print-gst-btn"
              className="h-9 px-3 bg-slate-100 text-slate-700 border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer flex items-center gap-1.5"
              title="Print Summary"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </Button>
            <Button
              size="sm"
              onClick={handleOpenVendorModal}
              data-testid="add-vendor-invoice-btn"
              className="h-9 px-3.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition shadow-xs cursor-pointer flex items-center gap-1.5"
              title="Record Vendor Tax Invoice for ITC"
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>Record Vendor Bill</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Statutory Disclaimer Banner */}
      <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl text-xs flex items-start gap-2.5 shadow-xs">
        <Scale className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Statutory GST Filing Notice</p>
          <p className="text-[11px] text-amber-800 mt-0.5">
            {gstr1Data?.statutoryDisclaimer ||
              'This report is generated from immutable transaction snapshots for GST return preparation. Final filing must be verified and uploaded to the GST Common Portal.'}
          </p>
        </div>
      </div>

      {/* Accountant Audit Warnings Banner (if any) */}
      {gstr3bData?.auditWarnings && gstr3bData.auditWarnings.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 px-4 py-3 rounded-2xl text-xs space-y-1 shadow-xs">
          <div className="flex items-center gap-1.5 font-bold text-rose-800">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <span>Accountant Audit Warnings &amp; Exceptions ({gstr3bData.auditWarnings.length})</span>
          </div>
          <ul className="list-disc pl-6 space-y-0.5 text-[11px] text-rose-700">
            {gstr3bData.auditWarnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-12 text-slate-500 gap-2">
          <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Computing GST return tables from immutable transaction ledger...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>⚠️ {error}</span>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Navigation Sub-tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/60 overflow-x-auto w-fit">
            <button
              onClick={() => setActiveSubTab('gstr1')}
              data-testid="tab-gstr1"
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeSubTab === 'gstr1'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <span>GSTR-1 Outward Supplies</span>
              <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">
                {gstr1Data?.summary.totalInvoices || 0}
              </Badge>
            </button>
            <button
              onClick={() => setActiveSubTab('gstr3b')}
              data-testid="tab-gstr3b"
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeSubTab === 'gstr3b'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <span>GSTR-3B Summary &amp; ITC</span>
            </button>
            <button
              onClick={() => setActiveSubTab('salesRegister')}
              data-testid="tab-sales-register"
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeSubTab === 'salesRegister'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <span>Sales Tax Register</span>
              <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">
                {salesRegisterData?.totalCount || 0}
              </Badge>
            </button>
            <button
              onClick={() => setActiveSubTab('supplierInvoices')}
              data-testid="tab-supplier-invoices"
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeSubTab === 'supplierInvoices'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <span>Vendor Tax Invoices / ITC</span>
              <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">
                {supplierInvoices.length}
              </Badge>
            </button>
          </div>

          {/* Sub-view Content */}
          {activeSubTab === 'gstr1' && gstr1Data && <Gstr1TableView data={gstr1Data} />}
          {activeSubTab === 'gstr3b' && gstr3bData && <Gstr3bTableView data={gstr3bData} />}
          {activeSubTab === 'salesRegister' && salesRegisterData && (
            <SalesRegisterTableView data={salesRegisterData} />
          )}
          {activeSubTab === 'supplierInvoices' && (
            <VendorInvoicesTableView
              invoices={supplierInvoices}
              onAddInvoice={handleOpenVendorModal}
            />
          )}
        </>
      )}

      {/* Record Inward Vendor Bill Dialog */}
      <RecordVendorBillDialog
        open={vendorModal.open}
        onClose={() => setVendorModal((prev) => ({ ...prev, open: false }))}
        data={vendorModal}
        setData={setVendorModal}
        branches={branches}
        suppliers={suppliers}
        products={products}
        onSubmit={handleSubmitVendorInvoice}
      />
    </div>
  );
}
