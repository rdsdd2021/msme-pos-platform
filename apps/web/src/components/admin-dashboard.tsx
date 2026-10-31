'use client';

import React, { useState, useEffect } from 'react';

interface DailyReport {
  date: string;
  totalSales: number;
  invoiceCount: number;
  cashCollected: number;
  upiCollected: number;
  cardCollected: number;
  khataCreditGiven: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
}

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  barcodePrimary: string | null;
  sellingPrice: string;
  purchaseCost: string;
  mrp: string;
  hsnCode: string | null;
  trackInventory: boolean;
  currentStock?: string;
}

interface CustomerAccount {
  id: string;
  name: string;
  phone: string | null;
  creditLimit: string;
  currentBalance: string;
}

interface CashierShift {
  id: string;
  cashierUserId: string;
  status: 'open' | 'closed';
  openingCash: string;
  closingCash: string | null;
  expectedCash: string | null;
  variance: string | null;
  openedAt: string;
}

interface DeviceItem {
  id: string;
  deviceName: string;
  deviceIdentifier: string;
  platform: string;
  status: 'active' | 'inactive' | 'revoked';
  lastSeenAt: string | null;
}

interface SubscriptionInfo {
  planCode: string;
  status: string;
  maxBranches: number;
  maxDevices: number;
  maxUsers: number;
  currentPeriodEnd: string | null;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'inventory' | 'khata' | 'shifts' | 'devices'>('analytics');
  
  // Seeded default tenant ID for live dev display
  const tenantId = 'a72d32b7-f3e4-4e51-9370-03c748623848';

  // Demo / Initial State with live fallback
  const [report, setReport] = useState<DailyReport>({
    date: new Date().toISOString().split('T')[0],
    totalSales: 4850.0,
    invoiceCount: 18,
    cashCollected: 2450.0,
    upiCollected: 1800.0,
    cardCollected: 350.0,
    khataCreditGiven: 250.0,
    totalCgst: 112.5,
    totalSgst: 112.5,
    totalIgst: 0.0,
  });

  const [products, setProducts] = useState<ProductItem[]>([
    {
      id: 'prod-1',
      name: 'Aashirvaad Shudh Chakki Atta 5kg',
      sku: 'GROC-001',
      barcodePrimary: '890103000001',
      sellingPrice: '240.00',
      purchaseCost: '210.00',
      mrp: '250.00',
      hsnCode: '11010000',
      trackInventory: true,
      currentStock: '50.000',
    },
    {
      id: 'prod-2',
      name: 'Amul Salted Butter 500g',
      sku: 'DAIRY-001',
      barcodePrimary: '890103000002',
      sellingPrice: '275.00',
      purchaseCost: '245.00',
      mrp: '280.00',
      hsnCode: '04051000',
      trackInventory: true,
      currentStock: '4.000', // Low stock demo (<5)
    },
    {
      id: 'prod-3',
      name: 'Tata Salt Vacuum Evaporated 1kg',
      sku: 'GROC-002',
      barcodePrimary: '890103000003',
      sellingPrice: '28.00',
      purchaseCost: '22.00',
      mrp: '30.00',
      hsnCode: '25010010',
      trackInventory: true,
      currentStock: '100.000',
    },
    {
      id: 'prod-4',
      name: 'Fortune Sunlite Refined Sunflower Oil 1L',
      sku: 'GROC-003',
      barcodePrimary: '890103000004',
      sellingPrice: '165.00',
      purchaseCost: '140.00',
      mrp: '175.00',
      hsnCode: '15121910',
      trackInventory: true,
      currentStock: '60.000',
    },
    {
      id: 'prod-5',
      name: 'Parle-G Gold Glucose Biscuit 800g',
      sku: 'SNACK-001',
      barcodePrimary: '890103000005',
      sellingPrice: '80.00',
      purchaseCost: '68.00',
      mrp: '85.00',
      hsnCode: '19053100',
      trackInventory: true,
      currentStock: '80.000',
    },
    {
      id: 'prod-6',
      name: 'Maggi 2-Minute Masala Noodles 280g',
      sku: 'SNACK-002',
      barcodePrimary: '890103000006',
      sellingPrice: '55.00',
      purchaseCost: '46.00',
      mrp: '60.00',
      hsnCode: '19023010',
      trackInventory: true,
      currentStock: '3.000', // Low stock demo (<5)
    },
  ]);

  const [customers, setCustomers] = useState<CustomerAccount[]>([
    {
      id: 'cust-1',
      name: 'Ramesh Sharma',
      phone: '+919876543210',
      creditLimit: '5000.00',
      currentBalance: '1250.00',
    },
    {
      id: 'cust-2',
      name: 'Pooja Verma',
      phone: '+919876543211',
      creditLimit: '3000.00',
      currentBalance: '420.00',
    },
  ]);

  const [shifts, setShifts] = useState<CashierShift[]>([
    {
      id: 'shift-1',
      cashierUserId: 'Suresh Cashier',
      status: 'open',
      openingCash: '1000.00',
      closingCash: null,
      expectedCash: '3450.00',
      variance: '0.00',
      openedAt: '2026-10-31T09:00:00Z',
    },
  ]);

  const [devices, setDevices] = useState<DeviceItem[]>([
    {
      id: 'dev-1',
      deviceName: 'Counter 1 - Sunmi V2 Pro',
      deviceIdentifier: 'POS-SUNMI-001',
      platform: 'android',
      status: 'active',
      lastSeenAt: '2026-10-31T14:15:00Z',
    },
    {
      id: 'dev-2',
      deviceName: 'Counter 2 - Chrome Web POS',
      deviceIdentifier: 'POS-WEB-001',
      platform: 'web',
      status: 'active',
      lastSeenAt: '2026-10-31T14:18:00Z',
    },
  ]);

  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    planCode: 'basic_kirana',
    status: 'active',
    maxBranches: 2,
    maxDevices: 5,
    maxUsers: 10,
    currentPeriodEnd: '2027-10-31T00:00:00Z',
  });

  const [repaymentModal, setRepaymentModal] = useState<{ open: boolean; customer: CustomerAccount | null; amount: string }>({
    open: false,
    customer: null,
    amount: '',
  });

  const [adjustmentModal, setAdjustmentModal] = useState<{ open: boolean; product: ProductItem | null; qty: string; reason: string }>({
    open: false,
    product: null,
    qty: '',
    reason: 'Restock / Purchase',
  });

  // Handle Khata Repayment
  const handleRecordRepayment = () => {
    if (!repaymentModal.customer || !repaymentModal.amount || isNaN(Number(repaymentModal.amount))) return;
    const paid = parseFloat(repaymentModal.amount);
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === repaymentModal.customer?.id) {
          const newBal = Math.max(0, parseFloat(c.currentBalance) - paid);
          return { ...c, currentBalance: newBal.toFixed(2) };
        }
        return c;
      })
    );
    // Add to cash collected in daily report
    setReport((prev) => ({
      ...prev,
      cashCollected: prev.cashCollected + paid,
    }));
    setRepaymentModal({ open: false, customer: null, amount: '' });
  };

  // Handle Stock Adjustment
  const handleStockAdjustment = () => {
    if (!adjustmentModal.product || !adjustmentModal.qty || isNaN(Number(adjustmentModal.qty))) return;
    const delta = parseFloat(adjustmentModal.qty);
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === adjustmentModal.product?.id) {
          const current = parseFloat(p.currentStock || '0');
          const updated = Math.max(0, current + delta);
          return { ...p, currentStock: updated.toFixed(3) };
        }
        return p;
      })
    );
    setAdjustmentModal({ open: false, product: null, qty: '', reason: 'Restock / Purchase' });
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 text-slate-800" data-testid="admin-dashboard">
      {/* Top Admin Sub-navigation Header */}
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl border border-emerald-500/30">
            KM
          </div>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              Kirana Supermart <span className="text-xs px-2 py-0.5 bg-emerald-700 text-white rounded font-normal">Store Owner Portal</span>
            </h1>
            <p className="text-xs text-slate-400">Branch: Andheri West (BR-001) | GSTIN: 27AABCU9603R1ZM</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex space-x-1 bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('analytics')}
            data-testid="tab-analytics"
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'analytics' ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            📊 Analytics & Tax
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            data-testid="tab-inventory"
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'inventory' ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            📦 Inventory ({products.filter((p) => parseFloat(p.currentStock || '0') < 5).length} Low)
          </button>
          <button
            onClick={() => setActiveTab('khata')}
            data-testid="tab-khata"
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'khata' ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            📒 Khata Ledger
          </button>
          <button
            onClick={() => setActiveTab('shifts')}
            data-testid="tab-shifts"
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'shifts' ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            ⏱️ Cashier Shifts
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            data-testid="tab-devices"
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'devices' ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            📱 Devices & Plan
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 flex-1 overflow-y-auto">
        {/* TAB 1: ANALYTICS & GST TAX REPORT */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Today&apos;s Store Performance</h2>
                <p className="text-xs text-slate-500">Live operational ledger for {report.date}</p>
              </div>
              <span className="px-3 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live Store Synced
              </span>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Sales</p>
                <p className="text-2xl font-black text-slate-900 mt-1">₹{report.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-emerald-600 font-medium mt-1">{report.invoiceCount} invoices generated today</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cash Collected</p>
                <p className="text-2xl font-black text-emerald-700 mt-1">₹{report.cashCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-slate-500 mt-1">In register / drawer</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">UPI & Digital Collections</p>
                <p className="text-2xl font-black text-blue-700 mt-1">₹{(report.upiCollected + report.cardCollected).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-slate-500 mt-1">UPI: ₹{report.upiCollected} | Card: ₹{report.cardCollected}</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Khata Credit Extended</p>
                <p className="text-2xl font-black text-amber-700 mt-1">₹{report.khataCreditGiven.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-amber-600 font-medium mt-1">Unpaid customer debt</p>
              </div>
            </div>

            {/* GST Tax Reconciliation */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-4">GST Tax Breakdown (Government Compliant)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs font-bold text-slate-600">CGST (Central Tax 50%)</p>
                  <p className="text-xl font-bold text-slate-900 mt-1">₹{report.totalCgst.toFixed(2)}</p>
                  <p className="text-xs text-slate-500 mt-1">Intra-state sales within MH (27)</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs font-bold text-slate-600">SGST (State Tax 50%)</p>
                  <p className="text-xl font-bold text-slate-900 mt-1">₹{report.totalSgst.toFixed(2)}</p>
                  <p className="text-xs text-slate-500 mt-1">Maharashtra State GST component</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs font-bold text-slate-600">Total Tax Collected</p>
                  <p className="text-xl font-bold text-emerald-800 mt-1">₹{(report.totalCgst + report.totalSgst + report.totalIgst).toFixed(2)}</p>
                  <p className="text-xs text-slate-500 mt-1">Eligible for GSTR-1 & GSTR-3B filing</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INVENTORY MANAGEMENT */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Grocery Catalogue & Stock Balances</h2>
                <p className="text-xs text-slate-500">Real-time stock ledger movements and reorder thresholds</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2.5 py-1 bg-amber-100 text-amber-800 rounded">
                  ⚠️ Threshold Alert: &lt; 5 Units
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm" data-testid="inventory-table">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">SKU / Barcode</th>
                    <th className="px-4 py-3">HSN Code</th>
                    <th className="px-4 py-3">Cost Price</th>
                    <th className="px-4 py-3">Selling Price</th>
                    <th className="px-4 py-3">Stock On Hand</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => {
                    const stock = parseFloat(p.currentStock || '0');
                    const isLow = stock < 5;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{p.sku}</span>
                          <span className="block text-slate-400 mt-0.5">{p.barcodePrimary || 'No Barcode'}</span>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-600">{p.hsnCode}</td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-600">₹{p.purchaseCost}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">₹{p.sellingPrice}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                              isLow ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {stock.toFixed(1)} {isLow ? '⚠️ LOW' : 'OK'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setAdjustmentModal({ open: true, product: p, qty: '', reason: 'Restock / Purchase' })}
                            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                          >
                            Adjust Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: KHATA (CUSTOMER CREDIT) */}
        {activeTab === 'khata' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Customer Khata (Credit Ledger)</h2>
                <p className="text-xs text-slate-500">Track informal udhaar, credit limits, and record repayments</p>
              </div>
              <div className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200">
                Total Debt Outstanding: ₹{customers.reduce((acc, c) => acc + parseFloat(c.currentBalance), 0).toFixed(2)}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm" data-testid="khata-table">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Customer Name</th>
                    <th className="px-4 py-3">Phone Number</th>
                    <th className="px-4 py-3">Credit Limit</th>
                    <th className="px-4 py-3">Balance Owed (Debit)</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900">{c.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{c.phone}</td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-600">₹{parseFloat(c.creditLimit).toFixed(2)}</td>
                      <td className="px-4 py-3 font-bold text-red-600">₹{parseFloat(c.currentBalance).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setRepaymentModal({ open: true, customer: c, amount: '' })}
                          className="px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors shadow-sm"
                        >
                          Record Repayment
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: CASHIER SHIFTS */}
        {activeTab === 'shifts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Cashier Shifts & Cash Reconciliation</h2>
                <p className="text-xs text-slate-500">Monitor cash in drawer, float amount, and end-of-shift variances</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Cashier</th>
                    <th className="px-4 py-3">Shift Status</th>
                    <th className="px-4 py-3">Opening Float</th>
                    <th className="px-4 py-3">Expected Cash</th>
                    <th className="px-4 py-3">Closing Cash</th>
                    <th className="px-4 py-3">Variance</th>
                    <th className="px-4 py-3">Opened At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shifts.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900">{s.cashierUserId}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 uppercase">
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">₹{s.openingCash}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">₹{s.expectedCash}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{s.closingCash ? `₹${s.closingCash}` : 'In Progress'}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">₹{s.variance}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{new Date(s.openedAt).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: DEVICES & SUBSCRIPTIONS */}
        {activeTab === 'devices' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Subscription Plan: {subscription.planCode.replace('_', ' ').toUpperCase()}</h3>
                  <p className="text-xs text-slate-500">Plan renewal date: {new Date(subscription.currentPeriodEnd || '').toLocaleDateString()}</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 font-bold text-xs rounded-full uppercase">
                  {subscription.status}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <p className="text-xs text-slate-500 font-medium">Max Branches Allowed</p>
                  <p className="text-xl font-bold text-slate-900">{subscription.maxBranches}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <p className="text-xs text-slate-500 font-medium">Active Devices</p>
                  <p className="text-xl font-bold text-slate-900">{devices.length} / {subscription.maxDevices}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <p className="text-xs text-slate-500 font-medium">Max Cashier Users</p>
                  <p className="text-xl font-bold text-slate-900">{subscription.maxUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Registered Hardware & Terminals</h3>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Device Name</th>
                    <th className="px-4 py-3">Device Identifier</th>
                    <th className="px-4 py-3">Platform</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {devices.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900">{d.deviceName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{d.deviceIdentifier}</td>
                      <td className="px-4 py-3 text-xs uppercase font-medium text-slate-600">{d.platform}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setDevices((prev) => prev.map((dev) => dev.id === d.id ? { ...dev, status: 'revoked' } : dev));
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: KHATA REPAYMENT */}
      {repaymentModal.open && repaymentModal.customer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Record Debt Repayment</h3>
            <p className="text-xs text-slate-600">
              Customer: <span className="font-semibold text-slate-800">{repaymentModal.customer.name}</span>
              <br />
              Current Outstanding: <span className="font-bold text-red-600">₹{parseFloat(repaymentModal.customer.currentBalance).toFixed(2)}</span>
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Repayment Amount (₹)</label>
              <input
                type="number"
                placeholder="Enter amount paid"
                value={repaymentModal.amount}
                onChange={(e) => setRepaymentModal({ ...repaymentModal, amount: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRepaymentModal({ open: false, customer: null, amount: '' })}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordRepayment}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
              >
                Confirm Repayment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: STOCK ADJUSTMENT */}
      {adjustmentModal.open && adjustmentModal.product && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Adjust Inventory Quantity</h3>
            <p className="text-xs text-slate-600">
              Product: <span className="font-semibold text-slate-800">{adjustmentModal.product.name}</span>
              <br />
              Current Stock: <span className="font-bold text-slate-900">{parseFloat(adjustmentModal.product.currentStock || '0').toFixed(3)} units</span>
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Quantity Delta (+ or -)</label>
              <input
                type="number"
                placeholder="e.g. 20 to add, -5 to reduce"
                value={adjustmentModal.qty}
                onChange={(e) => setAdjustmentModal({ ...adjustmentModal, qty: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setAdjustmentModal({ open: false, product: null, qty: '', reason: 'Restock / Purchase' })}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStockAdjustment}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
              >
                Record Stock Movement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

