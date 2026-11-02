'use client';

import React, { useState } from 'react';
import { Gstr1Response } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export type Gstr1SubTable = 'b2b' | 'b2cl' | 'b2cs' | 'hsn' | 'docs';

interface Gstr1TableViewProps {
  data: Gstr1Response;
}

export function Gstr1TableView({ data }: Gstr1TableViewProps) {
  const [subTable, setSubTable] = useState<Gstr1SubTable>('b2b');

  return (
    <div className="space-y-6" data-testid="gstr1-view">
      {/* 6 Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Invoices</p>
          <p className="text-xl font-black text-slate-900 mt-1">{data.summary.totalInvoices}</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Taxable Value</p>
          <p className="text-xl font-black text-slate-900 mt-1">₹{data.summary.totalTaxableValue}</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">CGST Total</p>
          <p className="text-xl font-black text-emerald-700 mt-1">₹{data.summary.totalCgst}</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">SGST Total</p>
          <p className="text-xl font-black text-emerald-700 mt-1">₹{data.summary.totalSgst}</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">IGST Total</p>
          <p className="text-xl font-black text-blue-700 mt-1">₹{data.summary.totalIgst}</p>
        </div>
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gross Invoice Value</p>
          <p className="text-xl font-black text-slate-900 mt-1">₹{data.summary.totalInvoiceValue}</p>
        </div>
      </div>

      {/* Table Switcher Pills */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/60 overflow-x-auto w-fit text-xs">
        <button
          onClick={() => setSubTable('b2b')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer text-xs ${
            subTable === 'b2b' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          Table 4: B2B Invoices ({data.b2b.length})
        </button>
        <button
          onClick={() => setSubTable('b2cl')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer text-xs ${
            subTable === 'b2cl' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          Table 5: B2C Large ({data.b2cl.length})
        </button>
        <button
          onClick={() => setSubTable('b2cs')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer text-xs ${
            subTable === 'b2cs' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          Table 7: B2C Small ({data.b2cs.length})
        </button>
        <button
          onClick={() => setSubTable('hsn')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer text-xs ${
            subTable === 'hsn' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          Table 12: HSN Summary ({data.hsnSummary.length})
        </button>
        <button
          onClick={() => setSubTable('docs')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer text-xs ${
            subTable === 'docs' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          Table 13: Documents Summary
        </button>
      </div>

      {/* Table 4: B2B Invoices */}
      {subTable === 'b2b' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs" data-testid="table-b2b">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <span className="font-bold text-slate-800 text-xs">Table 4: Taxable outward supplies to registered persons (B2B)</span>
            <span className="text-[11px] text-slate-500 font-mono">Count: {data.b2b.length}</span>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-2.5">Recipient GSTIN</th>
                <th className="p-2.5">Customer Name</th>
                <th className="p-2.5">Invoice #</th>
                <th className="p-2.5">Date</th>
                <th className="p-2.5">POS</th>
                <th className="p-2.5 text-right">Taxable Val (₹)</th>
                <th className="p-2.5 text-center">Rate %</th>
                <th className="p-2.5 text-right">CGST (₹)</th>
                <th className="p-2.5 text-right">SGST (₹)</th>
                <th className="p-2.5 text-right">IGST (₹)</th>
                <th className="p-2.5 text-right">Invoice Val (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.b2b.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/80 font-mono text-[11px] transition-colors">
                  <td className="p-2.5 font-bold text-slate-900">{row.customerGstin}</td>
                  <td className="p-2.5 font-sans font-medium text-slate-800">{row.customerName}</td>
                  <td className="p-2.5 text-emerald-700 font-semibold">{row.invoiceNumber}</td>
                  <td className="p-2.5 text-slate-600">{row.invoiceDate}</td>
                  <td className="p-2.5 text-slate-700">{row.placeOfSupply}</td>
                  <td className="p-2.5 text-right font-semibold">₹{row.taxableValue}</td>
                  <td className="p-2.5 text-center">{row.rate}%</td>
                  <td className="p-2.5 text-right text-emerald-700">₹{row.cgstAmount}</td>
                  <td className="p-2.5 text-right text-emerald-700">₹{row.sgstAmount}</td>
                  <td className="p-2.5 text-right text-blue-700">₹{row.igstAmount}</td>
                  <td className="p-2.5 text-right font-bold text-slate-900">₹{row.invoiceValue}</td>
                </tr>
              ))}
              {data.b2b.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400">
                    No B2B invoices recorded in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Table 5: B2C Large */}
      {subTable === 'b2cl' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs" data-testid="table-b2cl">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200">
            <span className="font-bold text-slate-800 text-xs">Table 5: Taxable outward inter-state supplies to unregistered persons where invoice value &gt; ₹2,50,000</span>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-2.5">Invoice #</th>
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Place of Supply</th>
                <th className="p-2.5 text-center">Rate %</th>
                <th className="p-2.5 text-right">Taxable Val (₹)</th>
                <th className="p-2.5 text-right">IGST (₹)</th>
                <th className="p-2.5 text-right">Invoice Val (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.b2cl.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/80 font-mono text-[11px] transition-colors">
                  <td className="p-2.5 text-emerald-700 font-semibold">{row.invoiceNumber}</td>
                  <td className="p-2.5 text-slate-600">{row.invoiceDate}</td>
                  <td className="p-2.5 text-slate-700">{row.placeOfSupply}</td>
                  <td className="p-2.5 text-center">{row.rate}%</td>
                  <td className="p-2.5 text-right font-semibold">₹{row.taxableValue}</td>
                  <td className="p-2.5 text-right text-blue-700 font-semibold">₹{row.igstAmount}</td>
                  <td className="p-2.5 text-right font-bold text-slate-900">₹{row.invoiceValue}</td>
                </tr>
              ))}
              {data.b2cl.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No B2C Large invoices (&gt; ₹2.5L inter-state) in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Table 7: B2C Small */}
      {subTable === 'b2cs' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs" data-testid="table-b2cs">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200">
            <span className="font-bold text-slate-800 text-xs">Table 7: Taxable outward supplies to unregistered persons (B2C Small aggregated by POS &amp; Rate)</span>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-2.5">Place of Supply</th>
                <th className="p-2.5">Supply Type</th>
                <th className="p-2.5 text-center">Rate %</th>
                <th className="p-2.5 text-right">Taxable Val (₹)</th>
                <th className="p-2.5 text-right">CGST (₹)</th>
                <th className="p-2.5 text-right">SGST (₹)</th>
                <th className="p-2.5 text-right">IGST (₹)</th>
                <th className="p-2.5 text-right">Total Tax (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.b2cs.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/80 font-mono text-[11px] transition-colors">
                  <td className="p-2.5 font-bold text-slate-900">{row.placeOfSupply}</td>
                  <td className="p-2.5 font-sans">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.supplyType === 'Intra-State' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {row.supplyType}
                    </span>
                  </td>
                  <td className="p-2.5 text-center">{row.rate}%</td>
                  <td className="p-2.5 text-right font-semibold">₹{row.taxableValue}</td>
                  <td className="p-2.5 text-right text-emerald-700">₹{row.cgstAmount}</td>
                  <td className="p-2.5 text-right text-emerald-700">₹{row.sgstAmount}</td>
                  <td className="p-2.5 text-right text-blue-700">₹{row.igstAmount}</td>
                  <td className="p-2.5 text-right font-bold text-slate-900">₹{row.totalTax}</td>
                </tr>
              ))}
              {data.b2cs.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No B2C Small supplies in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Table 12: HSN Summary */}
      {subTable === 'hsn' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs" data-testid="table-hsn">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200">
            <span className="font-bold text-slate-800 text-xs">Table 12: HSN-wise summary of outward supplies</span>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-2.5">HSN Code</th>
                <th className="p-2.5">Description</th>
                <th className="p-2.5 text-center">UQC</th>
                <th className="p-2.5 text-right">Total Qty</th>
                <th className="p-2.5 text-right">Taxable Val (₹)</th>
                <th className="p-2.5 text-right">CGST (₹)</th>
                <th className="p-2.5 text-right">SGST (₹)</th>
                <th className="p-2.5 text-right">IGST (₹)</th>
                <th className="p-2.5 text-right">Total Val (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.hsnSummary.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/80 font-mono text-[11px] transition-colors">
                  <td className="p-2.5 font-bold text-emerald-800">{row.hsnCode}</td>
                  <td className="p-2.5 font-sans font-medium text-slate-900">{row.description}</td>
                  <td className="p-2.5 text-center">{row.uqc}</td>
                  <td className="p-2.5 text-right">{row.totalQuantity}</td>
                  <td className="p-2.5 text-right font-semibold">₹{row.taxableValue}</td>
                  <td className="p-2.5 text-right text-emerald-700">₹{row.cgstAmount}</td>
                  <td className="p-2.5 text-right text-emerald-700">₹{row.sgstAmount}</td>
                  <td className="p-2.5 text-right text-blue-700">₹{row.igstAmount}</td>
                  <td className="p-2.5 text-right font-bold text-slate-900">₹{row.totalValue}</td>
                </tr>
              ))}
              {data.hsnSummary.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No HSN records in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Table 13: Document Summary */}
      {subTable === 'docs' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs" data-testid="table-docs">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200">
            <span className="font-bold text-slate-800 text-xs">Table 13: Documents issued during the tax period</span>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-2.5">Nature of Document</th>
                <th className="p-2.5">From Serial</th>
                <th className="p-2.5">To Serial</th>
                <th className="p-2.5 text-right">Total Issued</th>
                <th className="p-2.5 text-right">Cancelled</th>
                <th className="p-2.5 text-right font-bold">Net Issued</th>
              </tr>
            </thead>
            <tbody>
              <tr className="font-mono text-[11px]">
                <td className="p-2.5 font-sans font-medium">{data.docSummary.documentType}</td>
                <td className="p-2.5 text-slate-700">{data.docSummary.fromSerial}</td>
                <td className="p-2.5 text-slate-700">{data.docSummary.toSerial}</td>
                <td className="p-2.5 text-right">{data.docSummary.totalIssued}</td>
                <td className="p-2.5 text-right text-rose-600">{data.docSummary.cancelled}</td>
                <td className="p-2.5 text-right font-bold text-emerald-700">{data.docSummary.netIssued}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
