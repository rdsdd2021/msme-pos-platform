'use client';

import React from 'react';
import { useAuthStore } from '@/store/auth.store';

interface HeaderProps {
  viewMode: 'pos' | 'admin';
  setViewMode: (mode: 'pos' | 'admin') => void;
}

export default function TenantBranchSelector({ viewMode, setViewMode }: HeaderProps) {
  const {
    user,
    activeTenant,
    branches,
    activeBranch,
    selectTenant,
    selectBranch,
    logout,
    isOwner,
    isCashier,
    isBranchManager,
    isAccountant,
  } = useAuthStore();

  const isBranchScoped = !!activeTenant?.branchId;
  const canAccessAdmin = isOwner() || isBranchManager() || isAccountant();
  const canAccessPos = isOwner() || isBranchManager() || isCashier();

  const getRoleBadge = () => {
    if (isOwner()) return <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg text-[11px] font-bold">Store Owner</span>;
    if (isBranchManager()) return <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-lg text-[11px] font-bold">Branch Manager</span>;
    if (isCashier()) return <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-lg text-[11px] font-bold">Cashier</span>;
    if (isAccountant()) return <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-lg text-[11px] font-bold">Accountant</span>;
    return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-[11px] font-bold">{activeTenant?.role}</span>;
  };

  return (
    <header className="bg-white text-slate-900 px-4 py-2.5 flex flex-wrap items-center justify-between border-b border-slate-200 shrink-0 gap-3">
      {/* Brand & Active Business Selection */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <span className="font-black text-sm tracking-wide text-emerald-600">KIRANA POS</span>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">v1.0.0-live</span>
        </div>

        {/* Tenant selector if multi-tenant */}
        {user && user.memberships.length > 1 ? (
          <select
            value={activeTenant?.tenantId}
            onChange={(e) => selectTenant(e.target.value)}
            data-testid="tenant-selector"
            className="bg-white border border-slate-200 text-xs text-slate-800 rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          >
            {user.memberships.map((m) => (
              <option key={m.tenantId} value={m.tenantId}>
                {m.tenantName || 'Kirana Supermart'}
              </option>
            ))}
          </select>
        ) : (
          <div className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-2.5 py-1 flex items-center gap-1.5 font-medium">
            <span>{activeTenant?.tenantName || 'Kirana Supermart'}</span>
          </div>
        )}

        {/* Branch selector */}
        {branches.length > 0 && (
          <div className="flex items-center gap-1">
            {isBranchScoped ? (
              <div
                title="Branch locked by membership scope"
                data-testid="locked-branch-badge"
                className="bg-slate-50 border border-slate-200 text-xs text-slate-600 rounded-lg px-2.5 py-1 flex items-center gap-1"
              >
                <span className="text-slate-800 font-medium">{activeBranch?.name || 'Assigned Branch'}</span>
              </div>
            ) : (
              <select
                value={activeBranch?.id || ''}
                onChange={(e) => selectBranch(e.target.value)}
                data-testid="branch-selector"
                className="bg-white border border-slate-200 text-xs text-slate-800 rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* Universal Mode Switcher Bar */}
      <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
        {canAccessPos && (
          <button
            onClick={() => setViewMode('pos')}
            data-testid="mode-pos-btn"
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'pos'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cashier POS
          </button>
        )}

        {canAccessAdmin && (
          <button
            onClick={() => setViewMode('admin')}
            data-testid="mode-admin-btn"
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'admin'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Store Owner &amp; Admin
          </button>
        )}
      </div>

      {/* User Info & Actions */}
      <div className="flex items-center space-x-3 text-xs">
        <div className="flex items-center space-x-2">
          {getRoleBadge()}
          <span className="text-slate-700 font-medium hidden md:inline" data-testid="user-fullname">
            {user?.fullName}
          </span>
        </div>

        <button
          onClick={() => logout()}
          data-testid="logout-btn"
          className="bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-700 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1"
        >
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

