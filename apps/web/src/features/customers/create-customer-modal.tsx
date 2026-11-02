'use client';

import React from 'react';
import { UserPlus, AlertTriangle, X } from 'lucide-react';
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

export interface CreateCustomerFormData {
  open: boolean;
  name: string;
  phone: string;
  email: string;
  gstin: string;
  creditLimit: string;
  isSubmitting?: boolean;
  error?: string;
}

export interface CreateCustomerModalProps<T extends CreateCustomerFormData = CreateCustomerFormData> {
  open: boolean;
  onClose: () => void;
  data: T;
  setData: React.Dispatch<React.SetStateAction<T>>;
  onSave: () => Promise<void>;
}

export function CreateCustomerModal<T extends CreateCustomerFormData = CreateCustomerFormData>({
  open,
  onClose,
  data,
  setData,
  onSave,
}: CreateCustomerModalProps<T>) {
  const updateField = (field: keyof CreateCustomerFormData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden" data-testid="create-customer-modal">
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Header */}
          <DialogHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                  <UserPlus className="h-4.5 w-4.5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold text-slate-900">
                    Register New Khata Customer
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Create a store customer profile with contact information and credit facility
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
                data-testid="customer-modal-error"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{data.error}</span>
              </div>
            )}

            {/* Name */}
            <div>
              <Label className="text-xs font-bold text-slate-700">Full Name *</Label>
              <input
                type="text"
                placeholder="e.g. Ramesh Patel"
                value={data.name}
                onChange={(e) => updateField('name', e.target.value)}
                data-testid="customer-name-input"
                className="w-full text-xs mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-medium"
                required
              />
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-slate-700">Phone Number *</Label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={data.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  data-testid="customer-phone-input"
                  className="w-full text-xs mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">Email (Optional)</Label>
                <input
                  type="email"
                  placeholder="customer@email.com"
                  value={data.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full text-xs mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Credit Limit & GSTIN */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-slate-700">Credit Limit (₹)</Label>
                <input
                  type="text"
                  placeholder="5000.00"
                  value={data.creditLimit}
                  onChange={(e) => updateField('creditLimit', e.target.value)}
                  data-testid="customer-limit-input"
                  className="w-full text-xs mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">GSTIN (B2B Only)</Label>
                <input
                  type="text"
                  placeholder="27AABCK1234F1Z5"
                  value={data.gstin}
                  onChange={(e) => updateField('gstin', e.target.value.toUpperCase())}
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
              data-testid="save-customer-btn"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-sm disabled:opacity-50"
            >
              {data.isSubmitting ? 'Creating...' : 'Register Customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

