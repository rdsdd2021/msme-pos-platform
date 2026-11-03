'use client';

import React, { useState } from 'react';
import { Device } from '@/lib/api-client';
import { Smartphone, RotateCcw, Printer, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ReceiptDesignerModal } from './receipt-designer-modal';

interface DevicesViewProps {
  devices: Device[];
  onRefresh: () => void;
  tenantId?: string;
  branchId?: string;
  tenantName?: string;
  branchName?: string;
}

export function DevicesView({
  devices,
  onRefresh,
  tenantId,
  branchId,
  tenantName,
  branchName,
}: DevicesViewProps) {
  const [designerOpen, setDesignerOpen] = useState(false);

  return (
    <div className="space-y-4" data-testid="devices-content">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Smartphone className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Registered POS Devices & Hardware</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Android billing machines, Bluetooth thermal printers &amp; Web workstations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDesignerOpen(true)}
            data-testid="open-receipt-designer-btn"
            className="h-9 bg-white text-slate-700 font-semibold text-xs px-3 rounded-xl shadow-xs hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 border-slate-200"
          >
            <Printer className="h-3.5 w-3.5 text-blue-600" />
            <span>Customize Printed Bill</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="h-9 bg-white text-slate-700 font-medium text-xs px-3 rounded-xl shadow-xs hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Refresh Devices</span>
          </Button>
        </div>
      </div>

      {/* Bill & Thermal Printer Customization Banner */}
      <div className="p-4 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white border border-blue-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Printer className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Thermal Printer &amp; Receipt Template Customizer</h3>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Configure 58mm / 80mm roll width, store branding, FSSAI / GSTIN headers, UPI QR payment codes, and exchange policy for thermal bill prints.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setDesignerOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl cursor-pointer shadow-xs shrink-0 flex items-center gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
          <span>Open Bill Designer</span>
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-700">Device Name</TableHead>
              <TableHead className="font-semibold text-slate-700">Platform</TableHead>
              <TableHead className="font-semibold text-slate-700">Branch</TableHead>
              <TableHead className="font-semibold text-slate-700">App Version</TableHead>
              <TableHead className="font-semibold text-slate-700">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                  No devices registered yet. Devices register on first sync push.
                </TableCell>
              </TableRow>
            ) : (
              devices.map((d) => (
                <TableRow key={d.id} className="hover:bg-slate-50/80 transition-colors">
                  <TableCell className="p-3.5 font-bold text-xs text-slate-900">
                    {d.deviceName}
                  </TableCell>
                  <TableCell className="p-3.5 uppercase font-mono text-xs text-slate-700">
                    {d.platform}
                  </TableCell>
                  <TableCell className="p-3.5 text-xs text-slate-600">
                    {d.branchId}
                  </TableCell>
                  <TableCell className="p-3.5 font-mono text-xs text-slate-500">
                    {d.appVersion}
                  </TableCell>
                  <TableCell className="p-3.5">
                    <Badge
                      variant="outline"
                      className={
                        d.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[10px]'
                          : 'bg-rose-50 text-rose-700 border-rose-200 font-bold text-[10px]'
                      }
                    >
                      {d.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Bill & Receipt Designer Modal */}
      <ReceiptDesignerModal
        open={designerOpen}
        onClose={() => setDesignerOpen(false)}
        tenantId={tenantId}
        branchId={branchId}
        tenantName={tenantName}
        branchName={branchName}
      />
    </div>
  );
}
