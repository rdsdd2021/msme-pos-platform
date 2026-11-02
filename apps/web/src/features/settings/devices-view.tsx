'use client';

import React from 'react';
import { Device } from '@/lib/api-client';
import { Smartphone, RotateCcw } from 'lucide-react';
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

interface DevicesViewProps {
  devices: Device[];
  onRefresh: () => void;
}

export function DevicesView({ devices, onRefresh }: DevicesViewProps) {
  return (
    <div className="space-y-4" data-testid="devices-content">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Smartphone className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Registered POS Devices</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Android terminals &amp; Web workstations connected to store
          </p>
        </div>
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
                      className={`font-bold uppercase text-[10px] ${
                        d.status === 'active'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
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
    </div>
  );
}

