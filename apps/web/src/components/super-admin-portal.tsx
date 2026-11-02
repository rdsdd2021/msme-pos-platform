'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  apiClient,
  PlatformMetrics,
  PlatformTenant,
  PlatformPlan,
  PlatformDevice,
  PlatformAuditLog,
} from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import {
  Shield,
  Building2,
  Smartphone,
  CreditCard,
  FileText,
  Activity,
  RefreshCw,
  LogOut,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Ban,
  RotateCcw,
  Store,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Cpu,
} from 'lucide-react';

type SuperAdminTab = 'overview' | 'tenants' | 'plans' | 'devices' | 'audit';

export default function SuperAdminPortal() {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SuperAdminTab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Platform Data
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [devices, setDevices] = useState<PlatformDevice[]>([]);
  const [auditLogs, setAuditLogs] = useState<PlatformAuditLog[]>([]);

  // Search & filter
  const [tenantSearch, setTenantSearch] = useState('');
  const [deviceSearch, setDeviceSearch] = useState('');

  // Modals
  const [showCreateTenantModal, setShowCreateTenantModal] = useState(false);
  const [showRevokeDeviceModal, setShowRevokeDeviceModal] = useState<PlatformDevice | null>(null);
  const [revokeReason, setRevokeReason] = useState('Lost or damaged POS terminal');
  const [actionInProgress, setActionInProgress] = useState(false);

  // Form state for creating tenant
  const [newTenant, setNewTenant] = useState({
    legalName: '',
    displayName: '',
    businessType: 'GROCERY',
    planCode: 'PRO',
    currency: 'INR',
    initialBranchName: 'Main Store',
    initialBranchCode: 'MAIN',
    ownerEmail: '',
    ownerName: '',
    ownerPassword: 'Password@123',
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [m, t, p, d, a] = await Promise.all([
        apiClient.getPlatformMetrics().catch((err) => {
          console.error('Failed to fetch metrics', err);
          return null;
        }),
        apiClient.getPlatformTenants().catch((err) => {
          console.error('Failed to fetch tenants', err);
          return [];
        }),
        apiClient.getPlatformPlans().catch((err) => {
          console.error('Failed to fetch plans', err);
          return [];
        }),
        apiClient.getPlatformDevices().catch((err) => {
          console.error('Failed to fetch devices', err);
          return [];
        }),
        apiClient.getPlatformAudit(50, 0).catch((err) => {
          console.error('Failed to fetch audit', err);
          return { total: 0, limit: 50, offset: 0, data: [] };
        }),
      ]);

      if (m) setMetrics(m);
      setTenants(t);
      setPlans(p);
      setDevices(d);
      setAuditLogs(a.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Platform Super Admin API');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Tenant status toggle (Activate / Suspend)
  const handleToggleTenantStatus = async (tenant: PlatformTenant) => {
    const newStatus = tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!confirm(`Are you sure you want to change tenant "${tenant.displayName}" status to ${newStatus}?`)) {
      return;
    }
    setActionInProgress(true);
    try {
      await apiClient.updatePlatformTenantStatus(tenant.id, newStatus);
      await loadData();
    } catch (err: any) {
      alert(`Error updating tenant: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  // Handle Create Tenant
  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenant.legalName || !newTenant.displayName || !newTenant.ownerEmail) {
      alert('Please fill in all required tenant details.');
      return;
    }

    setActionInProgress(true);
    try {
      await apiClient.createPlatformTenant({
        legalName: newTenant.legalName,
        displayName: newTenant.displayName,
        businessType: newTenant.businessType,
        planCode: newTenant.planCode,
        ownerEmail: newTenant.ownerEmail,
        ownerName: newTenant.ownerName,
        ownerPassword: newTenant.ownerPassword,
      });
      setShowCreateTenantModal(false);
      setNewTenant({
        legalName: '',
        displayName: '',
        businessType: 'GROCERY',
        planCode: 'PRO',
        currency: 'INR',
        initialBranchName: 'Main Store',
        initialBranchCode: 'MAIN',
        ownerEmail: '',
        ownerName: '',
        ownerPassword: 'Password@123',
      });
      await loadData();
    } catch (err: any) {
      alert(`Error onboarding tenant: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  // Handle Revoke Device
  const handleRevokeDevice = async () => {
    if (!showRevokeDeviceModal) return;
    setActionInProgress(true);
    try {
      await apiClient.revokePlatformDevice(showRevokeDeviceModal.id, revokeReason);
      setShowRevokeDeviceModal(null);
      await loadData();
    } catch (err: any) {
      alert(`Error revoking device: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.displayName.toLowerCase().includes(tenantSearch.toLowerCase()) ||
      t.legalName.toLowerCase().includes(tenantSearch.toLowerCase()) ||
      t.id.toLowerCase().includes(tenantSearch.toLowerCase()),
  );

  const filteredDevices = devices.filter(
    (d) =>
      d.deviceName.toLowerCase().includes(deviceSearch.toLowerCase()) ||
      d.deviceIdentifier.toLowerCase().includes(deviceSearch.toLowerCase()) ||
      d.tenantName.toLowerCase().includes(deviceSearch.toLowerCase()) ||
      d.branchName.toLowerCase().includes(deviceSearch.toLowerCase()),
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-900 text-slate-100 font-sans overflow-hidden">
      {/* Top Super Admin Navbar */}
      <header className="h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black shadow-lg shadow-purple-600/30">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white">POS CLOUD</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded">
                Super Admin
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Platform Control Plane &amp; Multi-Tenant Fleet</p>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('tenants')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'tenants'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            Tenants ({tenants.length})
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'plans'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            Plans &amp; Quotas
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'devices'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            Devices ({devices.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'audit'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Audit Trail
          </button>
        </nav>

        {/* Right user & system actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 px-2 py-1 rounded bg-slate-900 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-mono text-emerald-400">API: {metrics?.systemStatus || 'ONLINE'}</span>
            <span className="text-slate-600">|</span>
            <span className="text-[11px] font-mono text-slate-400">{metrics?.platformVersion || 'v1.0.0'}</span>
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            title="Refresh Platform Data"
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
          </button>

          <div className="h-4 w-px bg-slate-800"></div>

          <div className="flex items-center gap-2">
            <div className="text-right text-xs">
              <div className="font-semibold text-slate-200">{user?.fullName || 'Super Admin'}</div>
              <div className="text-[10px] text-purple-400 font-mono">{user?.email || 'admin@pos.assistt.in'}</div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-xl transition cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 overflow-y-auto p-6 bg-slate-900/90 text-slate-100">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadData}
              className="px-3 py-1 bg-rose-900 hover:bg-rose-800 text-white rounded font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">Platform Health &amp; Key Metrics</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Aggregate telemetry across all retail tenants, branches, and active hardware terminals
                </p>
              </div>
              <button
                onClick={() => setShowCreateTenantModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/20 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Onboard New Tenant
              </button>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tenants</span>
                  <div className="p-2 rounded-xl bg-purple-950/60 text-purple-400 border border-purple-800/40">
                    <Building2 className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 text-3xl font-black text-white">{metrics?.tenants.total ?? tenants.length}</div>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="h-3 w-3" /> {metrics?.tenants.active ?? 0} Active
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                    <Ban className="h-3 w-3" /> {metrics?.tenants.suspended ?? 0} Suspended
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Stores / Branches</span>
                  <div className="p-2 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                    <Store className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 text-3xl font-black text-white">{metrics?.branches.total ?? 0}</div>
                <div className="mt-2 text-xs text-slate-400">
                  Across registered MSME businesses
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">POS Devices &amp; Hardware</span>
                  <div className="p-2 rounded-xl bg-blue-950/60 text-blue-400 border border-blue-800/40">
                    <Smartphone className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 text-3xl font-black text-white">{metrics?.devices.total ?? devices.length}</div>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="h-3 w-3" /> {metrics?.devices.active ?? 0} Online/Authorized
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                    <XCircle className="h-3 w-3" /> {metrics?.devices.revoked ?? 0} Revoked
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sales Invoices / GMV</span>
                  <div className="p-2 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-800/40">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-black text-white">
                  ₹{metrics?.transactions.totalSalesVolume || '0.00'}
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  {metrics?.transactions.totalInvoices ?? 0} Total Fiscal Invoices Posted
                </div>
              </div>
            </div>

            {/* Quick Status and Plan Summaries */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Architecture & Infrastructure Status */}
              <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-purple-400" />
                    <h3 className="font-bold text-sm text-white">Infrastructure Stack Status</h3>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                    Strict Multi-Tenant Isolation Active
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                    <div className="text-[11px] text-slate-400">Core Relational Database</div>
                    <div className="text-sm font-bold text-slate-100 mt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      PostgreSQL 16 Engine
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">RLS &amp; Tenant-partitioned</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                    <div className="text-[11px] text-slate-400">Backend API Monolith</div>
                    <div className="text-sm font-bold text-slate-100 mt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      NestJS 10 Runtime
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Scoped Guards &amp; RBAC</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                    <div className="text-[11px] text-slate-400">Offline SQLite Sync Protocol</div>
                    <div className="text-sm font-bold text-slate-100 mt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Idempotent Ingestion
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Hardware Device Revocation</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <span>Server Host: <strong className="text-slate-300 font-mono">pos.assistt.in</strong></span>
                  <span>Encryption: <strong className="text-emerald-400 font-mono">TLS 1.3 / Let&apos;s Encrypt</strong></span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white mb-1">Administrative Shortcuts</h3>
                  <p className="text-xs text-slate-400 mb-4">Direct commands for SaaS platform operator</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowCreateTenantModal(true)}
                      className="w-full py-2.5 px-3 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/60 rounded-xl text-xs font-semibold text-purple-200 flex items-center justify-between transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-purple-400" />
                        Provision New Kirana / Store Tenant
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setActiveTab('devices')}
                      className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 flex items-center justify-between transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Smartphone className="h-3.5 w-3.5 text-blue-400" />
                        Audit Hardware Fleet &amp; Revocations
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setActiveTab('plans')}
                      className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 flex items-center justify-between transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                        Configure Subscription Tiers
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
                  All Super Admin actions are audit-logged with caller IP and timestamp.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. TENANTS TAB */}
        {activeTab === 'tenants' && (
          <div className="space-y-4 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">Registered Retail Tenants</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage individual business accounts, subscription tiers, and operational permissions
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search tenant name or ID..."
                    value={tenantSearch}
                    onChange={(e) => setTenantSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 w-64"
                  />
                </div>
                <button
                  onClick={() => setShowCreateTenantModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  New Tenant
                </button>
              </div>
            </div>

            {/* Tenants Table */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Business / Display Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Subscription Plan</th>
                    <th className="py-3 px-4">Branches</th>
                    <th className="py-3 px-4">Staff</th>
                    <th className="py-3 px-4">Devices</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                        No tenants match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-900/50 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{t.displayName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{t.legalName}</div>
                          <div className="text-[10px] text-slate-500 font-mono truncate max-w-xs">{t.id}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                            {t.businessType}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/60 text-purple-300 border border-purple-800/40">
                            {t.subscription?.planCode || 'BASIC'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-300">{t.branchCount}</td>
                        <td className="py-3 px-4 font-semibold text-slate-300">{t.userCount}</td>
                        <td className="py-3 px-4 font-semibold text-slate-300">{t.deviceCount}</td>
                        <td className="py-3 px-4">
                          {t.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-950/50 border border-rose-800/40 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Suspended
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleToggleTenantStatus(t)}
                            disabled={actionInProgress}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                              t.status === 'ACTIVE'
                                ? 'bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60'
                                : 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60'
                            }`}
                          >
                            {t.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. PLANS & QUOTAS TAB */}
        {activeTab === 'plans' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Platform Subscription Tiers &amp; Quotas</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configured plan features, multi-branch quotas, and hardware limits for MSMEs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((p) => (
                <div
                  key={p.planCode}
                  className={`p-6 rounded-2xl bg-slate-950/80 border ${
                    p.planCode === 'PRO' ? 'border-purple-600/60 shadow-lg shadow-purple-900/20' : 'border-slate-800'
                  } flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-400">{p.planCode}</span>
                      {p.planCode === 'PRO' && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-600 text-white px-2 py-0.5 rounded-full">
                          Most Popular
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-white">{p.name}</h3>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">₹{p.priceMonthly}</span>
                      <span className="text-xs text-slate-400">/ month</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">₹{p.priceYearly} billed annually</div>

                    <div className="mt-6 pt-4 border-t border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Max Branches / Outlets:</span>
                        <strong className="font-mono text-white">{p.maxBranches}</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Max POS Hardware Devices:</span>
                        <strong className="font-mono text-white">{p.maxDevices}</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Max Cashiers / Users:</span>
                        <strong className="font-mono text-white">{p.maxUsers}</strong>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800">
                      <div className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                        Included Capabilities
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {p.features?.map((f, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. DEVICES TAB */}
        {activeTab === 'devices' && (
          <div className="space-y-4 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">Hardware Terminal Fleet</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage paired Android tablets, thermal POS terminals, and enforce remote device revocation
                </p>
              </div>
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search device identifier or store..."
                  value={deviceSearch}
                  onChange={(e) => setDeviceSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 w-64"
                />
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Device Name &amp; ID</th>
                    <th className="py-3 px-4">Platform</th>
                    <th className="py-3 px-4">Store Tenant</th>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4">Last Synced</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredDevices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                        No hardware devices found.
                      </td>
                    </tr>
                  ) : (
                    filteredDevices.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-900/50 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <Smartphone className="h-3.5 w-3.5 text-slate-400" />
                            {d.deviceName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs">
                            {d.deviceIdentifier}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                            {d.platform} {d.appVersion ? `(${d.appVersion})` : ''}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-300">{d.tenantName}</td>
                        <td className="py-3 px-4 text-slate-400 font-mono">{d.branchName} ({d.branchCode})</td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString() : 'Never'}
                        </td>
                        <td className="py-3 px-4">
                          {d.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Authorized
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-950/50 border border-rose-800/40 px-2 py-0.5 rounded-full" title={d.revocationReason || 'Revoked'}>
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Revoked
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {d.status === 'ACTIVE' && (
                            <button
                              onClick={() => setShowRevokeDeviceModal(d)}
                              className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded text-[11px] font-semibold transition cursor-pointer"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. AUDIT TRAIL TAB */}
        {activeTab === 'audit' && (
          <div className="space-y-4 max-w-7xl mx-auto">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Platform Administrative Audit Trail</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tamper-evident logs of tenant onboarding, device revocations, and system actions
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Resource</th>
                    <th className="py-3 px-4">Resource ID</th>
                    <th className="py-3 px-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                        No audit events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/50 transition">
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-bold text-white font-mono">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-purple-300">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{log.resourceType}</td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px] truncate max-w-xs">
                          {log.resourceId || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{log.ipAddress || 'internal'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: Onboard Tenant */}
      {showCreateTenantModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-400" />
                <h3 className="font-bold text-base text-white">Provision New Store Tenant</h3>
              </div>
              <button
                onClick={() => setShowCreateTenantModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Store / Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gupta General Store"
                    value={newTenant.displayName}
                    onChange={(e) => setNewTenant({ ...newTenant, displayName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Legal / Business Entity Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gupta Enterprises Pvt Ltd"
                    value={newTenant.legalName}
                    onChange={(e) => setNewTenant({ ...newTenant, legalName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Business Sector
                  </label>
                  <select
                    value={newTenant.businessType}
                    onChange={(e) => setNewTenant({ ...newTenant, businessType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="GROCERY">Grocery &amp; Kirana</option>
                    <option value="PHARMACY">Pharmacy &amp; Chemists</option>
                    <option value="APPAREL">Apparel &amp; Footwear</option>
                    <option value="ELECTRONICS">Electronics &amp; Hardware</option>
                    <option value="GENERAL_RETAIL">General Retail</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Initial Subscription Plan
                  </label>
                  <select
                    value={newTenant.planCode}
                    onChange={(e) => setNewTenant({ ...newTenant, planCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="BASIC">Basic Kirana (₹499/mo)</option>
                    <option value="PRO">Pro Retail (₹999/mo)</option>
                    <option value="ENTERPRISE">Enterprise (₹2,499/mo)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <div className="text-xs font-bold text-purple-400 mb-2">Store Owner Initial Login</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Owner Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Gupta"
                      value={newTenant.ownerName}
                      onChange={(e) => setNewTenant({ ...newTenant, ownerName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Owner Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="owner@guptastore.in"
                      value={newTenant.ownerEmail}
                      onChange={(e) => setNewTenant({ ...newTenant, ownerEmail: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Temporary Password
                  </label>
                  <input
                    type="password"
                    value={newTenant.ownerPassword}
                    onChange={(e) => setNewTenant({ ...newTenant, ownerPassword: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTenantModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionInProgress}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  {actionInProgress ? 'Provisioning...' : 'Provision Store Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Revoke Device */}
      {showRevokeDeviceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400 mb-2">
              <Ban className="h-5 w-5" />
              <h3 className="font-bold text-base text-white">Revoke Hardware Terminal</h3>
            </div>
            <p className="text-xs text-slate-400">
              Revoking terminal <strong className="text-white font-mono">{showRevokeDeviceModal.deviceName}</strong> ({showRevokeDeviceModal.deviceIdentifier}) will immediately disconnect it and reject all subsequent offline sync requests.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reason for Revocation *
              </label>
              <input
                type="text"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="e.g. Lost device, staff termination, broken hardware"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRevokeDeviceModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevokeDevice}
                disabled={actionInProgress}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow transition"
              >
                {actionInProgress ? 'Revoking...' : 'Confirm Remote Revocation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

