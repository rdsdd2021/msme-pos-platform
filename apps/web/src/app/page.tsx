'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import PosCheckoutScreen from '@/components/pos-checkout';
import AdminDashboard, { AdminTab, InventorySubTab } from '@/components/admin-dashboard';
import LoginScreen from '@/components/login-screen';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { CommandMenu } from '@/components/layout/command-menu';

export default function HomePage() {
  const { user, status, checkAuth, isOwner, isBranchManager, isCashier } = useAuthStore();
  const [viewMode, setViewMode] = useState<'pos' | 'admin'>('pos');
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('inventory');
  const [activeInventorySubTab, setActiveInventorySubTab] = useState<InventorySubTab>('products');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  // Verify active session on page mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Adjust default view mode based on role
  useEffect(() => {
    if (user) {
      if (isCashier() && !isOwner() && !isBranchManager()) {
        setViewMode('pos');
      }
    }
  }, [user, isCashier, isOwner, isBranchManager]);

  // Loading session state
  if (status === 'loading' && !user) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold tracking-wide text-slate-300">Connecting to POS Platform...</p>
      </div>
    );
  }

  // Unauthenticated: render secure login screen
  if (status === 'unauthenticated' || !user) {
    return <LoginScreen />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100" data-testid="pos-app-root">
      {/* Modern Collapsible Role-Based Sidebar */}
      <AppSidebar
        viewMode={viewMode}
        setViewMode={setViewMode}
        activeAdminTab={activeAdminTab}
        setActiveAdminTab={(tab) => {
          setActiveAdminTab(tab);
          setViewMode('admin');
        }}
        activeInventorySubTab={activeInventorySubTab}
        setActiveInventorySubTab={setActiveInventorySubTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onOpenCommand={() => setCommandOpen(true)}
      />

      {/* Main App Canvas */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Modern App Header with Breadcrumb, Branch status & Command trigger */}
        <AppHeader
          viewMode={viewMode}
          setViewMode={setViewMode}
          activeAdminTab={activeAdminTab}
          onOpenCommand={() => setCommandOpen(true)}
        />

        {/* Dynamic Viewport */}
        <main className="flex-1 overflow-hidden relative">
          {viewMode === 'pos' ? (
            <PosCheckoutScreen />
          ) : (
            <AdminDashboard
              activeTab={activeAdminTab}
              onTabChange={setActiveAdminTab}
              inventorySubTab={activeInventorySubTab}
              onInventorySubTabChange={setActiveInventorySubTab}
            />
          )}
        </main>
      </div>

      {/* Global ⌘K Command Palette */}
      <CommandMenu
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onSelectAction={(target, adminTab, adminSubTab) => {
          setViewMode(target);
          if (adminTab) setActiveAdminTab(adminTab as AdminTab);
          if (adminSubTab) setActiveInventorySubTab(adminSubTab as InventorySubTab);
        }}
      />
    </div>
  );
}
