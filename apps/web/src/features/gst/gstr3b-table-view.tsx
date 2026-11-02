'use client';

import React from 'react';
import { Gstr3bResponse } from '@/lib/api-client';

interface Gstr3bTableViewProps {
  data: Gstr3bResponse;
}

export function Gstr3bTableView({ data }: Gstr3bTableViewProps) {
  return (
    <div className="space-y-6" data-testid="gstr3b-view">
      {/* Net Cash Payable Banner */}
      <div className="bg-white p-5 rounded-2xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-slate-200">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Net Tax Payable in Cash</p>
          <p className="text-3xl font-black mt-1 text-emerald-600 font-mono">
            ₹{data.taxSettlement.netCashPayable.total}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Output Liability ₹{data.taxSettlement.outputTaxLiability.total} minus Net Set-Off ITC ₹{data.taxSettlement.itcSetOff.total}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
            <p className="text-[10px] text-slate-500 uppercase font-semibold">CGST Cash</p>
            <p className="font-bold text-emerald-700 text-sm mt-0.5">₹{data.taxSettlement.netCashPayable.cgst}</p>
          </div>
          <div className="bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
            <p className="text-[10px] text-slate-500 uppercase font-semibold">SGST Cash</p>
            <p className="font-bold text-emerald-700 text-sm mt-0.5">₹{data.taxSettlement.netCashPayable.sgst}</p>
          </div>
          <div className="bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
            <p className="text-[10px] text-slate-500 uppercase font-semibold">IGST Cash</p>
            <p className="font-bold text-blue-700 text-sm mt-0.5">₹{data.taxSettlement.netCashPayable.igst}</p>
          </div>
        </div>
      </div>

      {/* Table 3.1 Outward Supplies */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 text-xs">
          3.1 Details of Outward Supplies and inward supplies liable to reverse charge
        </div>
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-2.5">Nature of Supplies</th>
              <th className="p-2.5 text-right">Total Taxable Value (₹)</th>
              <th className="p-2.5 text-right">IGST (₹)</th>
              <th className="p-2.5 text-right">CGST (₹)</th>
              <th className="p-2.5 text-right">SGST (₹)</th>
              <th className="p-2.5 text-right">Cess (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[11px] font-mono">
            <tr>
              <td className="p-2.5 font-sans font-medium text-slate-900">
                (a) Outward taxable supplies (other than zero rated, nil rated and exempted)
              </td>
              <td className="p-2.5 text-right font-semibold">₹{data.table31.outwardTaxableSupplies.taxableValue}</td>
              <td className="p-2.5 text-right text-blue-700">₹{data.table31.outwardTaxableSupplies.igst}</td>
              <td className="p-2.5 text-right text-emerald-700">₹{data.table31.outwardTaxableSupplies.cgst}</td>
              <td className="p-2.5 text-right text-emerald-700">₹{data.table31.outwardTaxableSupplies.sgst}</td>
              <td className="p-2.5 text-right text-slate-400">₹{data.table31.outwardTaxableSupplies.cess}</td>
            </tr>
            <tr>
              <td className="p-2.5 font-sans font-medium text-slate-900">(b) Outward taxable supplies (zero rated)</td>
              <td className="p-2.5 text-right">₹{data.table31.outwardZeroRated.taxableValue}</td>
              <td className="p-2.5 text-right">₹{data.table31.outwardZeroRated.igst}</td>
              <td className="p-2.5 text-right">₹{data.table31.outwardZeroRated.cgst}</td>
              <td className="p-2.5 text-right">₹{data.table31.outwardZeroRated.sgst}</td>
              <td className="p-2.5 text-right text-slate-400">₹{data.table31.outwardZeroRated.cess}</td>
            </tr>
            <tr>
              <td className="p-2.5 font-sans font-medium text-slate-900">(c) Other outward supplies (nil rated, exempted)</td>
              <td className="p-2.5 text-right">₹{data.table31.otherOutwardNilExempt.taxableValue}</td>
              <td className="p-2.5 text-right">₹{data.table31.otherOutwardNilExempt.igst}</td>
              <td className="p-2.5 text-right">₹{data.table31.otherOutwardNilExempt.cgst}</td>
              <td className="p-2.5 text-right">₹{data.table31.otherOutwardNilExempt.sgst}</td>
              <td className="p-2.5 text-right text-slate-400">₹{data.table31.otherOutwardNilExempt.cess}</td>
            </tr>
            <tr>
              <td className="p-2.5 font-sans font-medium text-slate-900">(d) Inward supplies (liable to reverse charge)</td>
              <td className="p-2.5 text-right">₹{data.table31.inwardLiableToReverseCharge.taxableValue}</td>
              <td className="p-2.5 text-right text-blue-700">₹{data.table31.inwardLiableToReverseCharge.igst}</td>
              <td className="p-2.5 text-right text-emerald-700">₹{data.table31.inwardLiableToReverseCharge.cgst}</td>
              <td className="p-2.5 text-right text-emerald-700">₹{data.table31.inwardLiableToReverseCharge.sgst}</td>
              <td className="p-2.5 text-right text-slate-400">₹{data.table31.inwardLiableToReverseCharge.cess}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Table 4 Eligible & Ineligible Input Tax Credit (ITC) */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 text-xs">
          4. Eligible and Ineligible Input Tax Credit (ITC)
        </div>
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-2.5">Details</th>
              <th className="p-2.5 text-right">IGST (₹)</th>
              <th className="p-2.5 text-right">CGST (₹)</th>
              <th className="p-2.5 text-right">SGST (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[11px] font-mono">
            <tr className="bg-slate-50/50">
              <td colSpan={4} className="p-2 font-sans font-bold text-slate-800">(A) ITC Available (whether in full or part)</td>
            </tr>
            <tr>
              <td className="p-2.5 pl-6 font-sans text-slate-700">(5) All other ITC (From verified registered vendor tax invoices)</td>
              <td className="p-2.5 text-right text-blue-700 font-semibold">₹{data.table4.itcAvailable.allOtherItc.igst}</td>
              <td className="p-2.5 text-right text-emerald-700 font-semibold">₹{data.table4.itcAvailable.allOtherItc.cgst}</td>
              <td className="p-2.5 text-right text-emerald-700 font-semibold">₹{data.table4.itcAvailable.allOtherItc.sgst}</td>
            </tr>
            <tr className="bg-emerald-50/40 font-bold">
              <td className="p-2.5 pl-6 font-sans text-emerald-950">(C) Net ITC Available (A) - (B)</td>
              <td className="p-2.5 text-right text-blue-800">₹{data.table4.netItcAvailable.igst}</td>
              <td className="p-2.5 text-right text-emerald-800">₹{data.table4.netItcAvailable.cgst}</td>
              <td className="p-2.5 text-right text-emerald-800">₹{data.table4.netItcAvailable.sgst}</td>
            </tr>
            <tr className="bg-slate-50/50">
              <td colSpan={4} className="p-2 font-sans font-bold text-slate-800">(D) Ineligible ITC</td>
            </tr>
            <tr>
              <td className="p-2.5 pl-6 font-sans text-rose-700">(1) As per Section 17(5) blocked credits</td>
              <td className="p-2.5 text-right text-rose-700">₹{data.table4.ineligibleItc.section17_5.igst}</td>
              <td className="p-2.5 text-right text-rose-700">₹{data.table4.ineligibleItc.section17_5.cgst}</td>
              <td className="p-2.5 text-right text-rose-700">₹{data.table4.ineligibleItc.section17_5.sgst}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tax Settlement & Set-off Summary Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 text-xs">
          Tax Liability Settlement &amp; Statutory Set-Off (Section 49 CGST Act)
        </div>
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-2.5">Component</th>
              <th className="p-2.5 text-right">IGST (₹)</th>
              <th className="p-2.5 text-right">CGST (₹)</th>
              <th className="p-2.5 text-right">SGST (₹)</th>
              <th className="p-2.5 text-right font-bold">Total (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[11px] font-mono">
            <tr>
              <td className="p-2.5 font-sans font-semibold text-slate-800">1. Output Tax Liability</td>
              <td className="p-2.5 text-right text-blue-700">₹{data.taxSettlement.outputTaxLiability.igst}</td>
              <td className="p-2.5 text-right text-emerald-700">₹{data.taxSettlement.outputTaxLiability.cgst}</td>
              <td className="p-2.5 text-right text-emerald-700">₹{data.taxSettlement.outputTaxLiability.sgst}</td>
              <td className="p-2.5 text-right font-bold text-slate-900">₹{data.taxSettlement.outputTaxLiability.total}</td>
            </tr>
            <tr>
              <td className="p-2.5 font-sans font-semibold text-slate-800">2. Net Eligible ITC Available</td>
              <td className="p-2.5 text-right text-blue-700">₹{data.taxSettlement.netEligibleItc.igst}</td>
              <td className="p-2.5 text-right text-emerald-700">₹{data.taxSettlement.netEligibleItc.cgst}</td>
              <td className="p-2.5 text-right text-emerald-700">₹{data.taxSettlement.netEligibleItc.sgst}</td>
              <td className="p-2.5 text-right font-bold text-emerald-700">₹{data.taxSettlement.netEligibleItc.total}</td>
            </tr>
            <tr>
              <td className="p-2.5 font-sans font-semibold text-slate-800">3. ITC Set-Off Applied</td>
              <td className="p-2.5 text-right text-blue-700">₹{data.taxSettlement.itcSetOff.igst}</td>
              <td className="p-2.5 text-right text-emerald-700">₹{data.taxSettlement.itcSetOff.cgst}</td>
              <td className="p-2.5 text-right text-emerald-700">₹{data.taxSettlement.itcSetOff.sgst}</td>
              <td className="p-2.5 text-right font-bold text-slate-900">₹{data.taxSettlement.itcSetOff.total}</td>
            </tr>
            <tr className="bg-slate-900 text-white font-bold">
              <td className="p-2.5 font-sans">4. Net Tax Payable in Cash</td>
              <td className="p-2.5 text-right text-blue-400">₹{data.taxSettlement.netCashPayable.igst}</td>
              <td className="p-2.5 text-right text-emerald-400">₹{data.taxSettlement.netCashPayable.cgst}</td>
              <td className="p-2.5 text-right text-emerald-400">₹{data.taxSettlement.netCashPayable.sgst}</td>
              <td className="p-2.5 text-right font-black text-emerald-300">₹{data.taxSettlement.netCashPayable.total}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

