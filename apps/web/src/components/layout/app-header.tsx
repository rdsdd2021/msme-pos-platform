'use client';

import * as React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import {
  Search,
  ShoppingCart,
  Building,
  CheckCircle2,
  Sparkles,
  Command as CommandIcon,
} from 'lucide-react';

interface AppHeaderProps {
  viewMode: 'pos' | 'admin' | 'restaurant' | 'kds';
  setViewMode: (mode: 'pos' | 'admin' | 'restaurant' | 'kds') => void;
  activeAdminTab?: string;
  onOpenCommand: () => void;
}

export function AppHeader({
  viewMode,
  setViewMode,
  activeAdminTab = 'inventory',
  onOpenCommand,
}: AppHeaderProps) {
  const { activeTenant, activeBranch, isOwner, isBranchManager, isCashier } = useAuthStore();

  const getAdminTabName = (tab: string) => {
    switch (tab) {
      case 'inventory':
        return 'Products & Inventory';
      case 'invoices':
        return 'Bills & Invoices Register';
      case 'analytics':
        return 'Executive Analytics';
      case 'gst':
        return 'GST Reports & Returns';
      case 'khata':
        return 'Customer Khata & Statements';
      case 'shifts':
        return 'Cashier Shifts';
      case 'branches':
        return 'Branches & GSTIN';
      case 'devices':
        return 'POS Hardware Devices';
      case 'subscription':
        return 'Subscription & Billing';
      default:
        return 'Management';
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
      {/* Left: Dynamic Breadcrumbs */}
      <div className="flex items-center gap-3">
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                onClick={() => {
                  if (isOwner() || isBranchManager()) {
                    setViewMode('admin');
                  }
                }}
                className={isOwner() || isBranchManager() ? "text-slate-500 hover:text-slate-900 font-medium cursor-pointer" : "text-slate-500 font-medium cursor-default"}
              >
                {activeTenant?.tenantName || 'Kirana Supermart'}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {viewMode === 'pos' ? (
                <BreadcrumbPage className="font-semibold text-slate-800">
                  Cashier POS Terminal
                </BreadcrumbPage>
              ) : viewMode === 'restaurant' ? (
                <BreadcrumbPage className="font-semibold text-slate-800">
                  Dining Floor & Tables
                </BreadcrumbPage>
              ) : viewMode === 'kds' ? (
                <BreadcrumbPage className="font-semibold text-slate-800">
                  Kitchen Display Screen (KDS)
                </BreadcrumbPage>
              ) : (
                <BreadcrumbPage className="font-semibold text-slate-800">
                  {getAdminTabName(activeAdminTab)}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Active Branch Pill */}
        {activeBranch && (
          <div
            data-testid="header-branch-pill"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium"
            title={`${activeBranch.name} (${activeBranch.code})`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="truncate max-w-[160px] font-semibold">{activeBranch.code}</span>
          </div>
        )}
      </div>

      {/* Right: Quick Launch & System Status */}
      <div className="flex items-center gap-2.5">
        {/* Search trigger */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenCommand}
          className="h-8 text-xs text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50 font-normal px-2.5 hidden md:flex items-center gap-2 cursor-pointer"
        >
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <span>Quick Find...</span>
          <kbd className="text-[10px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded border border-slate-200 font-mono">
            ⌘K
          </kbd>
        </Button>

        {/* View Switcher button in header */}
        {viewMode === 'admin' ? (
          (isOwner() || isBranchManager() || isCashier()) && (
            <Button
              size="sm"
              onClick={() => setViewMode('pos')}
              className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm cursor-pointer"
            >
              <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
              <span>Launch POS Terminal</span>
            </Button>
          )
        ) : (
          (isOwner() || isBranchManager()) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('admin')}
              className="h-8 border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
            >
              <Building className="h-3.5 w-3.5 mr-1.5" />
              <span>Store Backoffice</span>
            </Button>
          )
        )}

        {/* Live Postgres Status Badge */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-500 font-medium pl-2 border-l border-slate-200">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span>PostgreSQL Active</span>
        </div>
      </div>
    </header>
  );
}
