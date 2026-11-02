'use client';

import * as React from 'react';
import {
  Sparkles,
  MapPin,
  Building,
  LogOut,
  Command as CommandIcon,
  Maximize2,
  Minimize2,
  HelpCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CashierTerminalShellProps {
  children: React.ReactNode;
  onSwitchToAdmin: () => void;
  onOpenCommand: () => void;
}

export function CashierTerminalShell({
  children,
  onSwitchToAdmin,
  onOpenCommand,
}: CashierTerminalShellProps) {
  const { user, activeTenant, activeBranch, logout, isOwner, isBranchManager } = useAuthStore();
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const canSwitchToAdmin = isOwner() || isBranchManager();

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'C';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-900 select-none">
        {/* Compact High-Speed Terminal Header (44px) */}
        <header className="h-11 bg-slate-950 text-white px-3 flex items-center justify-between border-b border-slate-800 shrink-0 z-30">
          {/* Left: Terminal Branding & Branch */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center border border-emerald-500/30">
                ⚡
              </span>
              <span className="font-extrabold text-xs tracking-wider text-white">
                KIRANA<span className="text-emerald-400">POS</span>
              </span>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-[9px] px-1.5 py-0 h-4 font-mono">
                LIVE
              </Badge>
            </div>

            <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-300 bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-800">
              <MapPin className="h-3 w-3 text-emerald-400" />
              <span className="font-medium truncate max-w-[200px]">
                {activeBranch?.name || 'Main Counter'}
              </span>
            </div>
          </div>

          {/* Middle: Fast Keyboard Hints */}
          <div className="hidden md:flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <kbd className="bg-slate-800 text-slate-300 px-1 rounded font-mono text-[10px] border border-slate-700">F2</kbd>
              <span>Scan Barcode</span>
            </span>
            <span className="text-slate-700">•</span>
            <span className="flex items-center gap-1">
              <kbd className="bg-slate-800 text-slate-300 px-1 rounded font-mono text-[10px] border border-slate-700">F1</kbd>
              <span>Cash Tender</span>
            </span>
            <span className="text-slate-700">•</span>
            <button
              onClick={onOpenCommand}
              className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <kbd className="bg-slate-800 text-slate-300 px-1 rounded font-mono text-[10px] border border-slate-700">⌘K</kbd>
              <span>Menu</span>
            </button>
          </div>

          {/* Right: Cashier Info & Shell Controls */}
          <div className="flex items-center gap-2">
            {canSwitchToAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSwitchToAdmin}
                className="h-7 text-[11px] border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800/80 px-2.5 font-medium cursor-pointer"
                title="Switch to Store Admin"
              >
                <Building className="h-3 w-3 mr-1 text-indigo-400" />
                <span>Backoffice</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </Button>

            {/* Cashier Avatar */}
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-800">
              <Avatar className="h-6 w-6 rounded-full border border-slate-700 bg-slate-800">
                <AvatarFallback className="font-bold text-[10px] bg-slate-800 text-emerald-400">
                  {getInitials(user?.fullName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-[11px] font-medium text-slate-200 hidden lg:inline truncate max-w-[120px]">
                {user?.fullName || 'Cashier'}
              </span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => logout()}
                    className="h-7 w-7 text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-md cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Sign Out</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        {/* Cashier Viewport Container */}
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>
    </TooltipProvider>
  );
}

