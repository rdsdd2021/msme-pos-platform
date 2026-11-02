'use client';

import React from 'react';
import { Building2, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export interface SupplierFormData {
  open: boolean;
  mode: 'create' | 'edit';
  supplierId?: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin: string;
  isSubmitting?: boolean;
  error?: string;
}

export interface SupplierModalProps<T extends SupplierFormData = SupplierFormData> {
  open: boolean;
  onClose: () => void;
  data: T;
  setData: React.Dispatch<React.SetStateAction<T>>;
  onSave: () => Promise<void>;
}

export function SupplierModal<T extends SupplierFormData = SupplierFormData>({
  open,
  onClose,
  data,
  setData,
  onSave,
}: SupplierModalProps<T>) {
  const updateField = (field: keyof SupplierFormData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden" data-testid="supplier-modal">
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Header */}
          <DialogHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                  <Building2 className="h-4.5 w-4.5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold text-slate-900">
                    {data.mode === 'create' ? 'Register New Supplier' : 'Edit Supplier Details'}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Enter distributor or wholesale vendor credentials for automated purchase and tax tracking
                  </DialogDescription>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </DialogHeader>

          <div className="p-5 space-y-3.5 text-xs">
            {data.error && (
              <div
                className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2 font-medium"
                data-testid="supplier-modal-error"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{data.error}</span>
              </div>
            )}

            {/* Name */}
            <div>
              <Label className="text-xs font-bold text-slate-700">Company / Distributor Name *</Label>
              <input
                type="text"
                placeholder="e.g. Hindustan Unilever Ltd or Amul Milk Agency"
                value={data.name}
                onChange={(e) => updateField('name', e.target.value)}
                data-testid="supplier-name-input"
                className="w-full text-xs mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-medium"
                required
              />
            </div>

            {/* Contact Person & Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-slate-700">Contact Person Name</Label>
                <input
                  type="text"
                  placeholder="e.g. Sanjay Gupta (Sales Rep)"
                  value={data.contactPerson}
                  onChange={(e) => updateField('contactPerson', e.target.value)}
                  data-testid="supplier-contact-input"
                  className="w-full text-xs mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">Phone / Mobile Number</Label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={data.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  data-testid="supplier-phone-input"
                  className="w-full text-xs mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Email & GSTIN */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-slate-700">Email Address</Label>
                <input
                  type="email"
                  placeholder="e.g. sales@hul.com"
                  value={data.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  data-testid="supplier-email-input"
                  className="w-full text-xs mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">GSTIN (GST Identification Number)</Label>
                <input
                  type="text"
                  placeholder="e.g. 27AAACH1234F1Z1"
                  value={data.gstin}
                  onChange={(e) => updateField('gstin', e.target.value.toUpperCase())}
                  data-testid="supplier-gstin-input"
                  className="w-full text-xs mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono uppercase focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 bg-slate-50 border-t border-slate-200 flex sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="px-4 py-2 text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={data.isSubmitting}
              data-testid="save-supplier-btn"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-sm disabled:opacity-50"
            >
              {data.isSubmitting
                ? 'Saving...'
                : data.mode === 'create'
                  ? 'Register Supplier'
                  : 'Update Supplier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

