'use client';

import React, { useState } from 'react';
import PosCheckoutScreen from '@/components/pos-checkout';
import AdminDashboard from '@/components/admin-dashboard';

export default function HomePage() {
  const [viewMode, setViewMode] = useState<'pos' | 'admin'>('pos');

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Universal Mode Switcher Bar */}
      <header className="bg-slate-950 text-white px-4 py-2 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center space-x-3">
          <span className="font-black text-sm tracking-wide text-emerald-400">⚡ KIRANA POS PLATFORM</span>
          <span className="text-xs text-slate-500 font-mono">v1.0.0-prod</span>
        </div>

        <div className="flex items-center space-x-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setViewMode('pos')}
            data-testid="mode-pos-btn"
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
              viewMode === 'pos'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🛒 Cashier POS
          </button>
          <button
            onClick={() => setViewMode('admin')}
            data-testid="mode-admin-btn"
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
              viewMode === 'admin'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🏢 Store Owner & Admin
          </button>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Online (DB Synced)
          </span>
          <span className="text-slate-400 font-mono">Tenant: Kirana Supermart</span>
        </div>
      </header>

      {/* Main Active View */}
      <main className="flex-1 overflow-hidden">
        {viewMode === 'pos' ? <PosCheckoutScreen /> : <AdminDashboard />}
      </main>
    </div>
  );
}
