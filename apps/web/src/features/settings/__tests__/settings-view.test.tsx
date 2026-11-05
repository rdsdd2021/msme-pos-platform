import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsView } from '../settings-view';
import { toast } from 'sonner';

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('SettingsView: Universal Store Settings & Administration Hub', () => {
  const mockBranches = [
    { id: 'branch-1', tenantId: 'tenant-1', code: 'MAIN', name: 'Main Store - Andheri', isActive: true },
    { id: 'branch-2', tenantId: 'tenant-1', code: 'BANDRA', name: 'Bandra Branch', isActive: true },
  ];

  const mockDevices = [
    {
      id: 'dev-1',
      tenantId: 'tenant-1',
      branchId: 'branch-1',
      deviceName: 'Counter 1 Tablet',
      deviceIdentifier: 'android-uuid-1',
      platform: 'android',
      appVersion: '1.0.1',
      status: 'active' as const,
      isAuthorized: true,
      lastSyncAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    },
  ];

  const mockSubscription = {
    id: 'sub-1',
    tenantId: 'tenant-1',
    tier: 'standard',
    status: 'active',
    maxBranches: 3,
    maxDevices: 5,
    maxProducts: 2000,
    validUntil: '2026-12-31T23:59:59Z',
  };

  const defaultProps = {
    tenantId: 'tenant-1',
    branchId: 'branch-1',
    tenantName: 'Kirana Supermart',
    branchName: 'Main Store - Andheri',
    branches: mockBranches,
    devices: mockDevices,
    subscription: mockSubscription as any,
    onRefresh: jest.fn(),
    onEditBranch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders Settings View with Store Profile tab by default', () => {
    render(<SettingsView {...defaultProps} />);

    expect(screen.getByTestId('settings-view')).toBeInTheDocument();
    expect(screen.getByText(/Store Settings & Administration/i)).toBeInTheDocument();
    expect(screen.getByTestId('settings-tab-profile')).toBeInTheDocument();
    expect(screen.getByTestId('settings-tab-receipt')).toBeInTheDocument();
    expect(screen.getByTestId('settings-tab-billing')).toBeInTheDocument();
    expect(screen.getByTestId('settings-tab-branches')).toBeInTheDocument();
    expect(screen.getByTestId('settings-tab-devices')).toBeInTheDocument();
    expect(screen.getByTestId('settings-tab-subscription')).toBeInTheDocument();

    expect(screen.getByText(/Commercial Store Profile & Legal Identity/i)).toBeInTheDocument();
  });

  it('switches between sub-tabs smoothly', async () => {
    render(<SettingsView {...defaultProps} />);

    // Switch to Thermal Receipt Designer
    fireEvent.click(screen.getByTestId('settings-tab-receipt'));
    expect(screen.getByText(/Thermal Printer Width & Receipt Template/i)).toBeInTheDocument();
    expect(screen.getByText(/58 mm \(2-inch roll\)/i)).toBeInTheDocument();

    // Switch to Billing Rules
    fireEvent.click(screen.getByTestId('settings-tab-billing'));
    expect(screen.getByRole('heading', { name: /Invoicing Rules & Cash Rounding Policy/i })).toBeInTheDocument();
    expect(screen.getByText(/Default GST Slab for New Items/i)).toBeInTheDocument();

    // Switch to Branches
    fireEvent.click(screen.getByTestId('settings-tab-branches'));
    expect(screen.getByText('Main Store - Andheri')).toBeInTheDocument();

    // Switch to Devices
    fireEvent.click(screen.getByTestId('settings-tab-devices'));
    expect(screen.getByText('Counter 1 Tablet')).toBeInTheDocument();

    // Switch to Subscription
    fireEvent.click(screen.getByTestId('settings-tab-subscription'));
    expect(screen.getByText(/Commercial Subscription Tier/i)).toBeInTheDocument();
  });

  it('respects initialTab prop for direct deep-linking', () => {
    render(<SettingsView {...defaultProps} initialTab="branches" />);
    expect(screen.getByText('Main Store - Andheri')).toBeInTheDocument();
  });

  it('saves Store Profile and triggers toast notification', () => {
    render(<SettingsView {...defaultProps} />);

    const saveBtn = screen.getByRole('button', { name: /Save Profile/i });
    fireEvent.click(saveBtn);

    expect(toast.success).toHaveBeenCalledWith('Store profile updated successfully!');
  });

  it('saves Billing Rules and triggers toast notification', () => {
    render(<SettingsView {...defaultProps} initialTab="billing" />);

    const saveBtn = screen.getByRole('button', { name: /Save Invoicing Rules/i });
    fireEvent.click(saveBtn);

    expect(toast.success).toHaveBeenCalledWith('Billing and invoicing rules updated successfully!');
  });

  it('saves and resets Thermal Receipt configuration', () => {
    render(<SettingsView {...defaultProps} initialTab="receipt" />);

    const saveBtn = screen.getByRole('button', { name: /Save Receipt Config/i });
    fireEvent.click(saveBtn);
    expect(toast.success).toHaveBeenCalledWith('Thermal receipt template saved for this branch!');

    const resetBtn = screen.getByRole('button', { name: /Reset Defaults/i });
    fireEvent.click(resetBtn);
    expect(toast.info).toHaveBeenCalledWith('Thermal receipt configuration reset to factory standards.');
  });
});

