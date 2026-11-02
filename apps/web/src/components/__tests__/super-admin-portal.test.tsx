import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SuperAdminPortal from '../super-admin-portal';
import { apiClient } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => {
  const actual = jest.requireActual('@/lib/api-client');
  return {
    ...actual,
    apiClient: {
      getPlatformMetrics: jest.fn(),
      getPlatformTenants: jest.fn(),
      getPlatformPlans: jest.fn(),
      getPlatformDevices: jest.fn(),
      getPlatformAudit: jest.fn(),
      updatePlatformTenantStatus: jest.fn(),
      createPlatformTenant: jest.fn(),
      revokePlatformDevice: jest.fn(),
    },
  };
});

jest.mock('@/store/auth.store', () => ({
  useAuthStore: () => ({
    user: {
      id: 'super-admin-1',
      email: 'superadmin@pos.assistt.in',
      fullName: 'Chief Platform Administrator',
      isSuperAdmin: true,
      memberships: [],
    },
    logout: jest.fn(),
  }),
}));

describe('SuperAdminPortal Component', () => {
  const mockMetrics = {
    tenants: { total: 3, active: 2, suspended: 1 },
    branches: { total: 5 },
    devices: { total: 8, active: 7, revoked: 1 },
    transactions: { totalInvoices: 420, totalSalesVolume: '154000.00' },
    platformVersion: 'v1.0.0-prod',
    systemStatus: 'HEALTHY',
  };

  const mockTenants = [
    {
      id: 'tenant-101',
      legalName: 'Gupta Kirana Stores Pvt Ltd',
      displayName: 'Gupta Kirana',
      businessType: 'GROCERY',
      status: 'ACTIVE',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      createdAt: '2026-01-01T00:00:00.000Z',
      branchCount: 2,
      userCount: 4,
      deviceCount: 2,
      subscription: {
        planCode: 'PRO',
        status: 'ACTIVE',
        maxBranches: 5,
        maxDevices: 10,
        maxUsers: 15,
        currentPeriodEnd: '2027-01-01',
      },
    },
  ];

  const mockPlans = [
    {
      planCode: 'PRO',
      name: 'Pro Retail',
      priceMonthly: 999,
      priceYearly: 9990,
      currency: 'INR',
      maxBranches: 5,
      maxDevices: 10,
      maxUsers: 15,
      features: ['Multi-Branch Support', 'Stock Transfers', 'Hardware Fleet Management'],
    },
  ];

  const mockDevices = [
    {
      id: 'dev-001',
      deviceIdentifier: 'SUNMI-V2-00129',
      deviceName: 'Billing Counter 1 Tablet',
      platform: 'ANDROID',
      appVersion: '1.2.0',
      status: 'ACTIVE',
      lastSeenAt: '2026-11-02T12:00:00.000Z',
      revokedAt: null,
      revocationReason: null,
      createdAt: '2026-01-10T00:00:00.000Z',
      tenantName: 'Gupta Kirana',
      tenantId: 'tenant-101',
      branchName: 'Main Bazaar',
      branchCode: 'MAIN',
    },
  ];

  const mockAudit = {
    total: 1,
    limit: 50,
    offset: 0,
    data: [
      {
        id: 'aud-1',
        tenantId: 'platform',
        userId: 'super-admin-1',
        action: 'TENANT_ONBOARDED',
        resourceType: 'TENANT',
        resourceId: 'tenant-101',
        details: { plan: 'PRO' },
        ipAddress: '127.0.0.1',
        createdAt: '2026-11-02T10:00:00.000Z',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.getPlatformMetrics as jest.Mock).mockResolvedValue(mockMetrics);
    (apiClient.getPlatformTenants as jest.Mock).mockResolvedValue(mockTenants);
    (apiClient.getPlatformPlans as jest.Mock).mockResolvedValue(mockPlans);
    (apiClient.getPlatformDevices as jest.Mock).mockResolvedValue(mockDevices);
    (apiClient.getPlatformAudit as jest.Mock).mockResolvedValue(mockAudit);
  });

  it('renders Super Admin Control Plane header and metrics', async () => {
    render(<SuperAdminPortal />);

    await waitFor(() => {
      expect(screen.getByText('POS CLOUD')).toBeInTheDocument();
      expect(screen.getByText('Super Admin')).toBeInTheDocument();
      expect(screen.getByText('Chief Platform Administrator')).toBeInTheDocument();
      expect(screen.getByText('Total Tenants')).toBeInTheDocument();
      expect(screen.getByText(/154000/)).toBeInTheDocument();
    });
  });

  it('navigates to Tenants tab and displays tenant table with actions', async () => {
    render(<SuperAdminPortal />);

    await waitFor(() => {
      expect(screen.getByText(/Tenants \(/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Tenants \(/));

    expect(screen.getByText('Registered Retail Tenants')).toBeInTheDocument();
    expect(screen.getByText('Gupta Kirana')).toBeInTheDocument();
    expect(screen.getByText('Gupta Kirana Stores Pvt Ltd')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Suspend/i })).toBeInTheDocument();
  });

  it('navigates to Plans & Quotas tab', async () => {
    render(<SuperAdminPortal />);

    await waitFor(() => {
      expect(screen.getByText(/Plans & Quotas/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Plans & Quotas/i));

    expect(screen.getByText('Platform Subscription Tiers & Quotas')).toBeInTheDocument();
    expect(screen.getByText('Pro Retail')).toBeInTheDocument();
    expect(screen.getByText('₹999')).toBeInTheDocument();
  });

  it('navigates to Devices tab and shows registered terminals', async () => {
    render(<SuperAdminPortal />);

    await waitFor(() => {
      expect(screen.getByText(/Devices \(/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Devices \(/));

    expect(screen.getByText('Hardware Terminal Fleet')).toBeInTheDocument();
    expect(screen.getByText('Billing Counter 1 Tablet')).toBeInTheDocument();
    expect(screen.getByText('SUNMI-V2-00129')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Revoke/i })).toBeInTheDocument();
  });
});
