'use client';

import * as React from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
  MapPin,
  Lock,
  Sparkles,
  Command as CommandIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { filterNavForUser, NavItem } from '@/config/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

interface AppSidebarProps {
  viewMode: 'pos' | 'admin';
  setViewMode: (mode: 'pos' | 'admin') => void;
  activeAdminTab?: string;
  setActiveAdminTab?: (tab: any) => void;
  activeInventorySubTab?: string;
  setActiveInventorySubTab?: (subTab: any) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenCommand: () => void;
}

export function AppSidebar({
  viewMode,
  setViewMode,
  activeAdminTab,
  setActiveAdminTab,
  activeInventorySubTab,
  setActiveInventorySubTab,
  collapsed,
  onToggleCollapse,
  onOpenCommand,
}: AppSidebarProps) {
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

  // Get active roles array
  const userRoles = activeTenant?.roles || (activeTenant?.role ? [activeTenant.role as any] : []);
  const navSections = React.useMemo(() => filterNavForUser(userRoles), [userRoles]);

  const getRoleBadge = () => {
    if (isOwner()) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold">
          👑 Store Owner
        </Badge>
      );
    }
    if (isBranchManager()) {
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-bold">
          🏢 Branch Manager
        </Badge>
      );
    }
    if (isCashier()) {
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
          🛒 Cashier
        </Badge>
      );
    }
    if (isAccountant()) {
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold">
          📊 Accountant
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-slate-100 text-slate-700 text-[10px] font-bold">
        {activeTenant?.role}
      </Badge>
    );
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleNavClick = (item: NavItem) => {
    if (item.target === 'pos') {
      setViewMode('pos');
    } else {
      setViewMode('admin');
      if (item.adminTab && setActiveAdminTab) {
        setActiveAdminTab(item.adminTab);
      }
      if (item.adminSubTab && setActiveInventorySubTab) {
        setActiveInventorySubTab(item.adminSubTab);
      }
    }
  };

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={cn(
          'relative flex flex-col bg-white text-slate-800 border-r border-slate-200/90 transition-all duration-200 ease-in-out shrink-0 select-none z-30 shadow-[1px_0_2px_rgba(0,0,0,0.02)]',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Brand & Store Selector Header */}
        <div className="h-14 flex items-center justify-between px-3.5 border-b border-slate-200/80 bg-slate-50/40">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                ⚡
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-xs tracking-tight text-slate-900 truncate">
                  {activeTenant?.tenantName || 'Kirana POS'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Enterprise v1.0</span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
              ⚡
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-7 w-7 text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 rounded-md shrink-0 cursor-pointer"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Tenant & Branch Context Picker (Always rendered for selectors / tests) */}
        <div className={cn('p-3 border-b border-slate-200/70 bg-slate-50/30 flex flex-col gap-2', collapsed && 'items-center px-2')}>
          {/* Tenant Selector */}
          {user && user.memberships.length > 1 ? (
            <div className="w-full">
              {!collapsed && (
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 block">
                  Business Entity
                </label>
              )}
              <select
                value={activeTenant?.tenantId}
                onChange={(e) => selectTenant(e.target.value)}
                data-testid="tenant-selector"
                className={cn(
                  'bg-white border border-slate-200 text-xs text-slate-800 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none w-full cursor-pointer truncate shadow-2xs font-medium',
                  collapsed && 'w-12 text-[10px] px-1'
                )}
                title={activeTenant?.tenantName}
              >
                {user.memberships.map((m) => (
                  <option key={m.tenantId} value={m.tenantId}>
                    {m.tenantName || 'Kirana Supermart'}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div
              className={cn(
                'bg-white border border-slate-200 text-xs text-slate-800 rounded-lg px-2.5 py-1.5 flex items-center gap-2 font-medium w-full truncate shadow-2xs',
                collapsed && 'justify-center px-1'
              )}
              title={activeTenant?.tenantName || 'Kirana Supermart'}
            >
              <Building2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              {!collapsed && <span className="truncate">{activeTenant?.tenantName || 'Kirana Supermart'}</span>}
            </div>
          )}

          {/* Branch Selector */}
          {branches.length > 0 && (
            <div className="w-full">
              {!collapsed && (
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 block">
                  Active Branch
                </label>
              )}
              {isBranchScoped ? (
                <div
                  title="Branch locked by membership scope"
                  data-testid="locked-branch-badge"
                  className={cn(
                    'bg-slate-100 border border-slate-200 text-xs text-slate-700 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 w-full truncate font-medium',
                    collapsed && 'justify-center px-1'
                  )}
                >
                  <Lock className="h-3 w-3 text-amber-500 shrink-0" />
                  {!collapsed && <span className="truncate font-medium text-slate-900">{activeBranch?.name || 'Assigned Branch'}</span>}
                </div>
              ) : (
                <select
                  value={activeBranch?.id || ''}
                  onChange={(e) => selectBranch(e.target.value)}
                  data-testid="branch-selector"
                  className={cn(
                    'bg-white border border-slate-200 text-xs text-slate-800 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none w-full cursor-pointer truncate shadow-2xs font-medium',
                    collapsed && 'w-12 text-[10px] px-1'
                  )}
                  title={activeBranch?.name}
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      📍 {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Universal Mode Switcher Buttons */}
          <div className={cn('grid grid-cols-2 gap-1 mt-1 bg-slate-100/90 p-1 rounded-lg border border-slate-200/60', collapsed && 'grid-cols-1')}>
            {canAccessPos && (
              <button
                onClick={() => setViewMode('pos')}
                data-testid="mode-pos-btn"
                className={cn(
                  'px-2 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                  viewMode === 'pos'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                )}
                title="Cashier POS Terminal"
              >
                <span>🛒</span>
                {!collapsed && <span>POS</span>}
              </button>
            )}

            {canAccessAdmin && (
              <button
                onClick={() => setViewMode('admin')}
                data-testid="mode-admin-btn"
                className={cn(
                  'px-2 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                  viewMode === 'admin'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/70 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                )}
                title="Store Owner & Admin"
              >
                <span>🏢</span>
                {!collapsed && <span>Admin</span>}
              </button>
            )}
          </div>
        </div>

        {/* Global Command Menu Trigger (⌘K) */}
        {!collapsed && (
          <div className="px-3 pt-2.5">
            <button
              onClick={onOpenCommand}
              className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-slate-500 bg-slate-100/80 hover:bg-slate-100 border border-slate-200/80 rounded-lg transition-colors cursor-pointer group"
            >
              <span className="flex items-center gap-2">
                <CommandIcon className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600" />
                <span>Search / Jump...</span>
              </span>
              <kbd className="text-[10px] bg-white px-1.5 py-0.5 rounded text-slate-500 font-mono border border-slate-200 shadow-2xs">
                ⌘K
              </kbd>
            </button>
          </div>
        )}

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-3.5 scrollbar-thin">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {!collapsed && (
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {section.title}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.target === viewMode &&
                    (item.target === 'pos' ||
                      ((!item.adminTab || item.adminTab === activeAdminTab) &&
                        (!item.adminSubTab || item.adminSubTab === activeInventorySubTab)));

                  const buttonContent = (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item)}
                      data-testid={item.testId}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer group',
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200/60 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80',
                        collapsed && 'justify-center px-0'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-transform group-hover:scale-105',
                          isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-700'
                        )}
                      />
                      {!collapsed && (
                        <div className="flex items-center justify-between flex-1 overflow-hidden">
                          <span className="truncate">{item.title}</span>
                          {item.badge && (
                            <span
                              className={cn(
                                'text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1.5',
                                isActive
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.id}>
                        <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
                        <TooltipContent side="right" className="font-semibold text-xs">
                          {item.title}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return buttonContent;
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer User Profile & Logout */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/50 shrink-0">
          {!collapsed ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <Avatar className="h-8 w-8 rounded-lg border border-slate-200 bg-slate-100 text-slate-700">
                  <AvatarFallback className="font-bold text-xs bg-slate-100 text-blue-700">
                    {getInitials(user?.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                  <span
                    className="text-xs font-semibold text-slate-900 truncate"
                    data-testid="user-fullname"
                  >
                    {user?.fullName}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">{getRoleBadge()}</div>
                </div>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => logout()}
                    data-testid="logout-btn"
                    className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Sign Out</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-8 w-8 rounded-lg border border-slate-200 bg-slate-100 text-slate-700">
                <AvatarFallback className="font-bold text-xs bg-slate-100 text-blue-700">
                  {getInitials(user?.fullName)}
                </AvatarFallback>
              </Avatar>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => logout()}
                    data-testid="logout-btn"
                    className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Sign Out</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}

