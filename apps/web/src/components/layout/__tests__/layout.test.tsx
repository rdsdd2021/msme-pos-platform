import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppSidebar } from '../app-sidebar';
import { AppHeader } from '../app-header';
import { CashierTerminalShell } from '../cashier-shell';
import { CommandMenu } from '../command-menu';
import { useAuthStore } from '@/store/auth.store';
import { Role, Permission } from '@pos/shared-types';

describe('Sprint 2: Modern Layout Components & Role-Based Navigation', () => {
  const mockOwnerMembership = {
    tenantId: 'tenant-1',
    tenantName: 'Kirana Supermart',
    branchId: null,
    role: 'owner',
    roles: [Role.OWNER],
    status: 'active',
    permissions: [Permission.BILLING_POS_CREATE, Permission.TENANT_READ],
    isOwner: true,
  };

  const mockCashierMembership = {
    tenantId: 'tenant-1',
    tenantName: 'Kirana Supermart',
    branchId: 'branch-1',
    role: 'cashier',
    roles: [Role.CASHIER],
    status: 'active',
    permissions: [Permission.BILLING_POS_CREATE],
    isOwner: false,
  };

  const mockUser = {
    id: 'u-1',
    email: 'admin@kirana.dev',
    fullName: 'Rajesh Store Owner',
    phone: '+919876543201',
    memberships: [mockOwnerMembership],
  };

  const mockBranches = [
    { id: 'branch-1', tenantId: 'tenant-1', code: 'BR-001', name: 'Main Store - Andheri West', isActive: true },
    { id: 'branch-2', tenantId: 'tenant-1', code: 'BR-002', name: 'Bandra West Branch', isActive: true },
  ];

  beforeEach(() => {
    useAuthStore.setState({
      user: mockUser,
      activeTenant: mockOwnerMembership,
      branches: mockBranches,
      activeBranch: mockBranches[0],
      status: 'authenticated',
      error: null,
    });
  });

  describe('AppSidebar', () => {
    it('renders expanded with business info, role badge, and navigation items', () => {
      const setViewMode = jest.fn();
      const setActiveAdminTab = jest.fn();
      const onToggleCollapse = jest.fn();
      const onOpenCommand = jest.fn();

      render(
        <AppSidebar
          viewMode="admin"
          setViewMode={setViewMode}
          activeAdminTab="inventory"
          setActiveAdminTab={setActiveAdminTab}
          collapsed={false}
          onToggleCollapse={onToggleCollapse}
          onOpenCommand={onOpenCommand}
        />
      );

      expect(screen.getAllByText('Kirana Supermart').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('👑 Store Owner')).toBeInTheDocument();
      expect(screen.getByTestId('user-fullname')).toHaveTextContent('Rajesh Store Owner');
      expect(screen.getByTestId('branch-selector')).toBeInTheDocument();

      // Core sections visible for Owner
      expect(screen.getByText('Core Operations')).toBeInTheDocument();
      expect(screen.getByText('Catalogue & Stock')).toBeInTheDocument();
      expect(screen.getByText('Customers & Finance')).toBeInTheDocument();
      expect(screen.getByText('Store Administration')).toBeInTheDocument();
      expect(screen.getByTestId('nav-settings')).toBeInTheDocument();
    });

    it('filters navigation items for Cashier role', () => {
      useAuthStore.setState({
        user: { ...mockUser, fullName: 'Suresh Cashier', memberships: [mockCashierMembership] },
        activeTenant: mockCashierMembership,
        activeBranch: mockBranches[0],
      });

      render(
        <AppSidebar
          viewMode="pos"
          setViewMode={jest.fn()}
          collapsed={false}
          onToggleCollapse={jest.fn()}
          onOpenCommand={jest.fn()}
        />
      );

      expect(screen.getByText('🛒 Cashier')).toBeInTheDocument();
      expect(screen.getByTestId('locked-branch-badge')).toBeInTheDocument();

      // Cashier should see POS Terminal but not Store Administration or Executive Analytics
      expect(screen.getByText('POS Terminal')).toBeInTheDocument();
      expect(screen.queryByText('Store Administration')).not.toBeInTheDocument();
      expect(screen.queryByText('Executive Analytics')).not.toBeInTheDocument();
    });

    it('triggers toggle collapse and command menu triggers', () => {
      const onToggleCollapse = jest.fn();
      const onOpenCommand = jest.fn();

      render(
        <AppSidebar
          viewMode="admin"
          setViewMode={jest.fn()}
          collapsed={false}
          onToggleCollapse={onToggleCollapse}
          onOpenCommand={onOpenCommand}
        />
      );

      // Trigger collapse
      const collapseBtn = screen.getByTitle('Collapse sidebar');
      fireEvent.click(collapseBtn);
      expect(onToggleCollapse).toHaveBeenCalledTimes(1);

      // Trigger command palette
      const searchTrigger = screen.getByText('Search / Jump...');
      fireEvent.click(searchTrigger);
      expect(onOpenCommand).toHaveBeenCalledTimes(1);
    });
  });

  describe('AppHeader', () => {
    it('renders breadcrumbs, branch pill, and POS launch button in admin mode', () => {
      const setViewMode = jest.fn();
      const onOpenCommand = jest.fn();

      render(
        <AppHeader
          viewMode="admin"
          setViewMode={setViewMode}
          activeAdminTab="inventory"
          onOpenCommand={onOpenCommand}
        />
      );

      expect(screen.getAllByText('Kirana Supermart').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Products & Inventory')).toBeInTheDocument();
      expect(screen.getByTestId('header-branch-pill')).toHaveTextContent('BR-001');

      const launchPosBtn = screen.getByText('Launch POS Terminal');
      expect(launchPosBtn).toBeInTheDocument();
      fireEvent.click(launchPosBtn);
      expect(setViewMode).toHaveBeenCalledWith('pos');
    });

    it('renders Backoffice button in POS mode for store owner', () => {
      const setViewMode = jest.fn();

      render(
        <AppHeader
          viewMode="pos"
          setViewMode={setViewMode}
          onOpenCommand={jest.fn()}
        />
      );

      expect(screen.getByText('Cashier POS Terminal')).toBeInTheDocument();
      const backofficeBtn = screen.getByText('Store Backoffice');
      expect(backofficeBtn).toBeInTheDocument();
      fireEvent.click(backofficeBtn);
      expect(setViewMode).toHaveBeenCalledWith('admin');
    });

    it('renders mobile menu toggle button and triggers onToggleMobileMenu', () => {
      const onToggleMobileMenu = jest.fn();

      render(
        <AppHeader
          viewMode="admin"
          setViewMode={jest.fn()}
          onOpenCommand={jest.fn()}
          onToggleMobileMenu={onToggleMobileMenu}
        />
      );

      const toggleBtn = screen.getByTestId('mobile-menu-toggle-btn');
      expect(toggleBtn).toBeInTheDocument();
      fireEvent.click(toggleBtn);
      expect(onToggleMobileMenu).toHaveBeenCalledTimes(1);
    });
  });

  describe('CashierTerminalShell', () => {
    it('renders full-screen high-speed terminal header with shortcuts', () => {
      const onSwitchToAdmin = jest.fn();
      const onOpenCommand = jest.fn();

      render(
        <CashierTerminalShell
          onSwitchToAdmin={onSwitchToAdmin}
          onOpenCommand={onOpenCommand}
        >
          <div data-testid="test-pos-canvas">POS Canvas</div>
        </CashierTerminalShell>
      );

      expect(screen.getByText('KIRANA')).toBeInTheDocument();
      expect(screen.getByText('LIVE')).toBeInTheDocument();
      expect(screen.getByText('F1')).toBeInTheDocument();
      expect(screen.getByText('F2')).toBeInTheDocument();
      expect(screen.getByTestId('test-pos-canvas')).toBeInTheDocument();

      const backofficeBtn = screen.getByText('Backoffice');
      fireEvent.click(backofficeBtn);
      expect(onSwitchToAdmin).toHaveBeenCalledTimes(1);
    });
  });

  describe('CommandMenu', () => {
    it('renders command palette items when open is true', () => {
      const onSelectAction = jest.fn();

      render(
        <CommandMenu
          open={true}
          onOpenChange={jest.fn()}
          onSelectAction={onSelectAction}
        />
      );

      expect(screen.getByPlaceholderText('Type a command, search screen, or action...')).toBeInTheDocument();
      expect(screen.getByText('POS Billing Terminal')).toBeInTheDocument();
      expect(screen.getByText('Products & SKUs')).toBeInTheDocument();
      expect(screen.getByText('GST Reports (GSTR-1 / GSTR-3B)')).toBeInTheDocument();
    });
  });
});
