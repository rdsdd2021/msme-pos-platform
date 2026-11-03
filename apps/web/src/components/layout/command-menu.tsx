'use client';

import * as React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Truck,
  Users,
  FileSpreadsheet,
  Clock,
  Store,
  Smartphone,
  CreditCard,
  Receipt,
  UtensilsCrossed,
  ChefHat,
  LogOut,
  PlusCircle,
  Search,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { useAuthStore } from '@/store/auth.store';

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAction: (target: 'pos' | 'admin' | 'restaurant' | 'kds', adminTab?: string, adminSubTab?: string) => void;
}

export function CommandMenu({ open, onOpenChange, onSelectAction }: CommandMenuProps) {
  const { isOwner, isBranchManager, isCashier, isAccountant, isInventoryStaff, logout } = useAuthStore();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const handleSelect = (callback: () => void) => {
    onOpenChange(false);
    callback();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command, search screen, or action..." />
      <CommandList>
        <CommandEmpty>No matching commands found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {(isOwner() || isBranchManager() || isCashier()) && (
            <>
              <CommandItem
                onSelect={() => handleSelect(() => onSelectAction('pos'))}
                className="cursor-pointer"
              >
                <ShoppingCart className="mr-2 h-4 w-4 text-emerald-500" />
                <span>POS Billing Terminal</span>
                <CommandShortcut>F1</CommandShortcut>
              </CommandItem>

              <CommandItem
                onSelect={() => handleSelect(() => onSelectAction('restaurant'))}
                className="cursor-pointer"
              >
                <UtensilsCrossed className="mr-2 h-4 w-4 text-amber-500" />
                <span>Restaurant Dining Floor & Tables</span>
                <CommandShortcut>F2</CommandShortcut>
              </CommandItem>

              <CommandItem
                onSelect={() => handleSelect(() => onSelectAction('kds'))}
                className="cursor-pointer"
              >
                <ChefHat className="mr-2 h-4 w-4 text-sky-500" />
                <span>Kitchen Display Screen (KDS)</span>
                <CommandShortcut>F3</CommandShortcut>
              </CommandItem>
            </>
          )}

          {(isOwner() || isBranchManager() || isCashier() || isAccountant()) && (
            <CommandItem
              onSelect={() => handleSelect(() => onSelectAction('admin', 'invoices'))}
              className="cursor-pointer"
            >
              <Receipt className="mr-2 h-4 w-4 text-emerald-500" />
              <span>Bills & Invoices Register</span>
              <CommandShortcut>F4</CommandShortcut>
            </CommandItem>
          )}

          {(isOwner() || isBranchManager()) && (
            <CommandItem
              onSelect={() => handleSelect(() => onSelectAction('admin', 'analytics'))}
              className="cursor-pointer"
            >
              <LayoutDashboard className="mr-2 h-4 w-4 text-indigo-500" />
              <span>Executive Analytics</span>
            </CommandItem>
          )}

          {(isOwner() || isBranchManager() || isInventoryStaff()) && (
            <>
              <CommandItem
                onSelect={() => handleSelect(() => onSelectAction('admin', 'inventory', 'products'))}
                className="cursor-pointer"
              >
                <Package className="mr-2 h-4 w-4 text-blue-500" />
                <span>Products & SKUs</span>
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect(() => onSelectAction('admin', 'inventory', 'stock'))}
                className="cursor-pointer"
              >
                <Boxes className="mr-2 h-4 w-4 text-amber-500" />
                <span>Stock Balances</span>
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect(() => onSelectAction('admin', 'inventory', 'purchases'))}
                className="cursor-pointer"
              >
                <Truck className="mr-2 h-4 w-4 text-cyan-500" />
                <span>Suppliers & Purchases</span>
              </CommandItem>
            </>
          )}

          {(isOwner() || isBranchManager() || isAccountant()) && (
            <>
              <CommandItem
                onSelect={() => handleSelect(() => onSelectAction('admin', 'khata'))}
                className="cursor-pointer"
              >
                <Users className="mr-2 h-4 w-4 text-emerald-500" />
                <span>Customer Khata & Statements</span>
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect(() => onSelectAction('admin', 'gst'))}
                className="cursor-pointer"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4 text-rose-500" />
                <span>GST Reports (GSTR-1 / GSTR-3B)</span>
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect(() => onSelectAction('admin', 'shifts'))}
                className="cursor-pointer"
              >
                <Clock className="mr-2 h-4 w-4 text-violet-500" />
                <span>Cashier Shifts</span>
              </CommandItem>
            </>
          )}

          {isOwner() && (
            <>
              <CommandItem
                onSelect={() => handleSelect(() => onSelectAction('admin', 'branches'))}
                className="cursor-pointer"
              >
                <Store className="mr-2 h-4 w-4 text-orange-500" />
                <span>Branches & GSTIN Setup</span>
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect(() => onSelectAction('admin', 'devices'))}
                className="cursor-pointer"
              >
                <Smartphone className="mr-2 h-4 w-4 text-teal-500" />
                <span>POS Hardware Devices</span>
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect(() => onSelectAction('admin', 'subscription'))}
                className="cursor-pointer"
              >
                <CreditCard className="mr-2 h-4 w-4 text-purple-500" />
                <span>Subscription Plan</span>
              </CommandItem>
            </>
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          {(isOwner() || isBranchManager() || isInventoryStaff()) && (
            <CommandItem
              onSelect={() => handleSelect(() => onSelectAction('admin', 'inventory', 'products'))}
              className="cursor-pointer"
            >
              <PlusCircle className="mr-2 h-4 w-4 text-emerald-500" />
              <span>Create New Product</span>
            </CommandItem>
          )}
          {(isOwner() || isBranchManager() || isAccountant()) && (
            <CommandItem
              onSelect={() => handleSelect(() => onSelectAction('admin', 'khata'))}
              className="cursor-pointer"
            >
              <PlusCircle className="mr-2 h-4 w-4 text-blue-500" />
              <span>New Customer Account</span>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Account">
          <CommandItem
            onSelect={() => handleSelect(() => logout())}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

