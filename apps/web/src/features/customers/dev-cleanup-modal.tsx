'use client';

import React from 'react';
import { Brush, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export interface DevCleanupResult {
  message: string;
  cleanedCount: number;
  skippedWithFinancialRecords: string[];
}

export interface DevCleanupModalProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  result: DevCleanupResult | null;
  error?: string;
}

export function DevCleanupModal({
  open,
  onClose,
  loading,
  result,
  error,
}: DevCleanupModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden" data-testid="clean-dev-modal">
        {/* Header */}
        <DialogHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm">
                <Brush className="h-4.5 w-4.5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-slate-900 flex items-center gap-1.5">
                  <span>Dev Test Customer Cleanup</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Cleans development simulation accounts without deleting posted financial records.
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4 text-xs">
          {loading && (
            <div className="p-6 text-center text-slate-500">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Scanning and cleaning test data...
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>⚠️ {error}</span>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>✅ {result.message}</span>
              </div>

              {result.skippedWithFinancialRecords.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-1">
                    Preserved Accounts (Financial Invariant Rule 9):
                  </span>
                  <div className="max-h-40 overflow-y-auto space-y-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-[11px] text-slate-600 font-mono">
                    {result.skippedWithFinancialRecords.map((msg, i) => (
                      <div key={i} className="text-amber-800">⚠️ {msg}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <Button
            size="sm"
            onClick={onClose}
            className="h-8 px-4 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

