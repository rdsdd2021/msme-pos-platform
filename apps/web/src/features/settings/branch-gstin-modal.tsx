'use client';

import React from 'react';
import { Branch } from '@/lib/api-client';
import { Building2, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export interface BranchGstinFormData {
  open: boolean;
  branch: Branch | null;
  name: string;
  gstin: string;
  stateCode: string;
  addressLine1: string;
  city: string;
  postalCode: string;
  isSubmitting?: boolean;
  error?: string;
  successMessage?: string;
}

export interface BranchGstinModalProps<T extends BranchGstinFormData = BranchGstinFormData> {
  open: boolean;
  onClose: () => void;
  data: T;
  setData: React.Dispatch<React.SetStateAction<T>>;
  onSave: () => Promise<void>;
}

export function BranchGstinModal<T extends BranchGstinFormData = BranchGstinFormData>({
  open,
  onClose,
  data,
  setData,
  onSave,
}: BranchGstinModalProps<T>) {
  if (!data.branch) return null;

  const updateField = (field: keyof BranchGstinFormData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGstinChange = (val: string) => {
    const uppercaseVal = val.toUpperCase();
    const derivedState =
      uppercaseVal.length >= 2 && /^[0-9]{2}$/.test(uppercaseVal.slice(0, 2))
        ? uppercaseVal.slice(0, 2)
        : data.stateCode;
    setData((prev) => ({ ...prev, gstin: uppercaseVal, stateCode: derivedState }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden" data-testid="branch-gstin-modal">
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Header */}
          <DialogHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                    Configure Branch GSTIN &amp; Address
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Branch: <span className="font-mono font-semibold text-slate-700">{data.branch.code}</span> — Required for statutory GST reports and tax invoices
                  </DialogDescription>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </DialogHeader>

          <div className="p-5 space-y-3.5 text-xs">
            {data.successMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{data.successMessage}</span>
              </div>
            )}

            {data.error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{data.error}</span>
              </div>
            )}

            <div>
              <Label className="block text-xs font-semibold text-slate-700 mb-1">Branch Name *</Label>
              <Input
                type="text"
                value={data.name}
                onChange={(e) => updateField('name', e.target.value)}
                data-testid="branch-name-input"
                className="text-xs h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered GSTIN (15 characters)
                </Label>
                <Input
                  type="text"
                  placeholder="27AABCK1234F1Z5"
                  value={data.gstin}
                  onChange={(e) => handleGstinChange(e.target.value)}
                  data-testid="branch-gstin-input"
                  className="text-xs h-9 font-mono uppercase"
                />
              </div>
              <div>
                <Label className="block text-xs font-semibold text-slate-700 mb-1">
                  State Code (2 digits)
                </Label>
                <Input
                  type="text"
                  placeholder="27"
                  value={data.stateCode}
                  onChange={(e) => updateField('stateCode', e.target.value)}
                  data-testid="branch-state-input"
                  className="text-xs h-9 font-mono"
                />
              </div>
            </div>

            <div>
              <Label className="block text-xs font-semibold text-slate-700 mb-1">Address Line 1</Label>
              <Input
                type="text"
                placeholder="Plot 42, Market Road"
                value={data.addressLine1}
                onChange={(e) => updateField('addressLine1', e.target.value)}
                data-testid="branch-address-input"
                className="text-xs h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="block text-xs font-semibold text-slate-700 mb-1">City</Label>
                <Input
                  type="text"
                  placeholder="Mumbai"
                  value={data.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  data-testid="branch-city-input"
                  className="text-xs h-9"
                />
              </div>
              <div>
                <Label className="block text-xs font-semibold text-slate-700 mb-1">PIN / Postal Code</Label>
                <Input
                  type="text"
                  placeholder="400001"
                  value={data.postalCode}
                  onChange={(e) => updateField('postalCode', e.target.value)}
                  data-testid="branch-pincode-input"
                  className="text-xs h-9 font-mono"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-9 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={data.isSubmitting}
              data-testid="save-branch-gstin-btn"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-4 cursor-pointer shadow-xs"
            >
              {data.isSubmitting ? 'Saving Configuration...' : 'Save GSTIN Details'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
