'use client';

import React, { useState } from 'react';
import {
  Store,
  UtensilsCrossed,
  Pill,
  Smartphone,
  Shirt,
  Boxes,
  WifiOff,
  Printer,
  Receipt,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Scale,
  QrCode,
  Check,
  ChevronRight,
  Laptop,
  Zap,
  BarChart3,
  Database,
  FileText,
  Layers,
  Lock,
  ArrowUpRight,
} from 'lucide-react';
import LoginScreen from '@/components/login-screen';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export type IndustryVerticalId =
  | 'grocery'
  | 'restaurant'
  | 'pharmacy'
  | 'electronics'
  | 'apparel'
  | 'wholesale';

interface IndustryModuleInfo {
  id: IndustryVerticalId;
  name: string;
  badge: string;
  badgeColor: string;
  icon: React.ComponentType<{ className?: string }>;
  headline: string;
  description: string;
  status: 'active' | 'upcoming';
  features: Array<{
    title: string;
    description: string;
    tag?: string;
  }>;
  terminalPreview: {
    title: string;
    metrics: Array<{ label: string; value: string }>;
    sampleLines: Array<{ item: string; detail: string; amount: string }>;
  };
}

export const INDUSTRY_MODULES: IndustryModuleInfo[] = [
  {
    id: 'grocery',
    name: 'Kirana & Grocery',
    badge: 'Live in Production',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    icon: Store,
    headline: 'High-speed barcode ring-up, weighing scale sync, and loose commodity pricing',
    description:
      'Engineered specifically for Indian grocery stores, supermarkets, and neighbourhood Kirana shops. Handles fast counter queues, loose weight calculations, and customer udhaar credit notebooks.',
    status: 'active',
    features: [
      {
        title: '0.2s Barcode & Camera Ring-up',
        description: 'Instant scan with hardware barcode scanners, keyboard wedge, or mobile camera scanner.',
        tag: 'Fast Checkout',
      },
      {
        title: 'Loose Weight & Fractional Units',
        description: 'Decimal accuracy for Kg, Grams, Litre, and Dozen. Integrates with electronic weighing scales.',
        tag: 'Commodity Ready',
      },
      {
        title: 'Customer Khata & Udhaar Notebook',
        description: 'Track store credit with customer-wise credit limits, partial repayments, and WhatsApp bills.',
        tag: 'Customer Loyalty',
      },
      {
        title: '58mm / 80mm Bill Designer',
        description: 'Customize thermal roll templates, FSSAI numbers, GSTIN headers, and dynamic UPI QR codes.',
        tag: 'Thermal Printing',
      },
      {
        title: 'Atomic Offline Stock Ledger',
        description: 'Stock deductions and invoice creation occur atomically in local SQLite with idempotent sync.',
        tag: '100% Offline',
      },
    ],
    terminalPreview: {
      title: 'Kirana Terminal Checkout',
      metrics: [
        { label: 'Today Sales', value: '₹18,450.00' },
        { label: 'Bills Posted', value: '42' },
        { label: 'Offline Queue', value: '0 pending' },
      ],
      sampleLines: [
        { item: 'Fortune Sunflower Oil 1L', detail: '2.000 L @ ₹165.00 • HSN 1512', amount: '₹330.00' },
        { item: 'Aashirvaad Shudh Chakki Atta 5kg', detail: '1.000 BAG @ ₹245.00 • HSN 1101', amount: '₹245.00' },
        { item: 'Tata Salt Vacuum Evaporated 1kg', detail: '1.000 PKT @ ₹28.00 • HSN 2501', amount: '₹28.00' },
      ],
    },
  },
  {
    id: 'restaurant',
    name: 'Restaurant & Cafe',
    badge: 'Specialized Module',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    icon: UtensilsCrossed,
    headline: 'Table visual management, Kitchen Order Tickets (KOT), and multi-station split billing',
    description:
      'Purpose-built for cafes, QSR counters, cloud kitchens, and fine dining. Dispatches KOTs to kitchen printers, displays live KDS orders, and allows splitting bills per guest.',
    status: 'upcoming',
    features: [
      {
        title: 'Visual Floorplan & Table Mapping',
        description: 'Color-coded live status: Vacant (Green), Seated (Blue), Billed (Amber), Cleaning (Red).',
        tag: 'Floor Management',
      },
      {
        title: 'Instant KOT Digital & Thermal Dispatch',
        description: 'Route orders directly to kitchen stations (Tandoor, Main Curry, Beverage Bar, Bakery).',
        tag: 'Kitchen Automation',
      },
      {
        title: 'Kitchen Display Screen (KDS)',
        description: 'Real-time order board for head chefs with item prep timer countdowns and order bumping.',
        tag: 'KDS System',
      },
      {
        title: 'Item & Equal Split Payments',
        description: 'Split invoices evenly among diners or divide specific food dishes across multiple payment cards.',
        tag: 'Split Billing',
      },
      {
        title: 'Captain Waiter Tablet Ordering',
        description: 'Captains take orders at table-side on Android tablets; orders fire to kitchen instantly.',
        tag: 'Mobile Waiter',
      },
    ],
    terminalPreview: {
      title: 'Restaurant Table T-04 (Dine-In)',
      metrics: [
        { label: 'Occupied Tables', value: '14 / 20' },
        { label: 'Active KOTs', value: '6 Kitchen' },
        { label: 'Table Turn Time', value: '38 min' },
      ],
      sampleLines: [
        { item: 'Paneer Butter Masala (Full)', detail: '2 x ₹280.00 • Station: Kitchen Main', amount: '₹560.00' },
        { item: 'Butter Garlic Naan', detail: '4 x ₹45.00 • Station: Tandoor Bar', amount: '₹180.00' },
        { item: 'Fresh Mint Lime Soda', detail: '2 x ₹90.00 • Station: Beverage', amount: '₹180.00' },
      ],
    },
  },
  {
    id: 'pharmacy',
    name: 'Pharmacy & Healthcare',
    badge: 'Specialized Module',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    icon: Pill,
    headline: 'Batch expiry tracking, Schedule H1 antibiotic compliance, and loose strip dispensing',
    description:
      'Meets strict regulatory standards for chemist shops, pharmacies, and clinics. Manages First-Expiry-First-Out (FEFO) dispensing, salt molecule substitution, and statutory drug registers.',
    status: 'upcoming',
    features: [
      {
        title: 'FEFO Batch & Expiry Date Enforcement',
        description: 'Prevents expired drug sales at checkout with automatic earliest-expiry batch suggestion.',
        tag: 'Compliance',
      },
      {
        title: 'Schedule H / H1 Prescription Audit',
        description: 'Mandatory capture of prescribing doctor name, registration number, and patient prescription.',
        tag: 'Statutory Register',
      },
      {
        title: 'Strip & Loose Tablet Dispensing',
        description: 'Sell full strips or break down into individual tablets with automatic fractional pricing.',
        tag: 'Strip Breakdown',
      },
      {
        title: 'Salt & Molecule Substitution Lookup',
        description: 'Search by generic composition (e.g. Paracetamol 650mg) to display all equivalent brands.',
        tag: 'Salt Matching',
      },
      {
        title: 'Drug License (Form 20B/21B) Snapshots',
        description: 'Permanently records merchant drug license number and GST HSN on every medicine bill.',
        tag: 'Tax Invoices',
      },
    ],
    terminalPreview: {
      title: 'Chemist Prescription Dispense',
      metrics: [
        { label: 'Expiring 30 Days', value: '4 Batches' },
        { label: 'Prescription Bills', value: '28' },
        { label: 'Drug Lic', value: 'MH-MZ-20B/992' },
      ],
      sampleLines: [
        { item: 'Dolo 650mg Tablets', detail: 'Batch DL-402 (Exp: 08/2027) • 15 Tabs', amount: '₹34.50' },
        { item: 'Augmentin 625 Duo', detail: 'Batch AG-911 • Schedule H1 • Dr. Sen', amount: '₹204.00' },
        { item: 'Pantocid DSR Capsule', detail: 'Batch PN-881 (Exp: 11/2026) • 1 Strip', amount: '₹145.00' },
      ],
    },
  },
  {
    id: 'electronics',
    name: 'Electronics & Mobile',
    badge: 'Specialized Module',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: Smartphone,
    headline: 'IMEI & serial number tracking, digital warranty cards, and repair job sheets',
    description:
      'Tailored for mobile stores, consumer appliance showrooms, and hardware shops. Tracks unique individual serial/IMEI units, manages warranty claims, and issues service job sheets.',
    status: 'upcoming',
    features: [
      {
        title: 'Single-Unit Serial & IMEI Tracking',
        description: 'Scan IMEI 1 & IMEI 2 directly on sale invoice. Full history lookup from supplier to customer.',
        tag: 'IMEI Registry',
      },
      {
        title: 'Digital Warranty Certificate Generation',
        description: 'Generates branded warranty documents with serial number snapshot and brand service links.',
        tag: 'Warranty Cards',
      },
      {
        title: 'Repair & Service Job Sheet Tracker',
        description: 'Service intake with fault description, repair estimate, status tracking, and customer alerts.',
        tag: 'Service Desk',
      },
      {
        title: 'Consumer Finance & EMI Support',
        description: 'Track Bajaj Finserv, HDFC Pine Labs, and credit card no-cost EMI schemes seamlessly.',
        tag: 'EMI Tenders',
      },
      {
        title: 'Accessory & Variant Matrix',
        description: 'Organize by Brand, Model, Storage (128GB/256GB), Color, and Warranty Period.',
        tag: 'Specification Matrix',
      },
    ],
    terminalPreview: {
      title: 'Mobile & Appliance Checkout',
      metrics: [
        { label: 'IMEIs Tracked', value: '318' },
        { label: 'Open Service Jobs', value: '5' },
        { label: 'Finance Sales', value: '₹82,000' },
      ],
      sampleLines: [
        { item: 'Samsung Galaxy A15 (128GB Blue)', detail: 'IMEI: 869402058194012 • 1 Yr Brand Warranty', amount: '₹14,499.00' },
        { item: 'Fast Charging Adapter 25W', detail: 'Serial: SN-CHG-9921 • HSN: 8504', amount: '₹1,299.00' },
        { item: 'Screen Tempered Guard 9H', detail: 'Model: SM-A15-SCR • Inclusive GST', amount: '₹299.00' },
      ],
    },
  },
  {
    id: 'apparel',
    name: 'Apparel & Fashion',
    badge: 'Specialized Module',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    icon: Shirt,
    headline: 'Size x Color variant matrices, barcode hangtag printing, and season exchange workflows',
    description:
      'Designed for garment retailers, boutiques, footwear stores, and textile shops. Eliminates duplicate SKUs with multi-dimensional variant grids and manages size exchanges effortlessly.',
    status: 'upcoming',
    features: [
      {
        title: 'Size x Color x Fit Matrix',
        description: 'Single product card manages all variations (e.g. Slim Fit Jeans in Sizes 28-38 across 4 washes).',
        tag: 'Variant Matrix',
      },
      {
        title: 'Barcode Hangtag & Garment Label Printing',
        description: 'Print self-adhesive price tags and barcode stickers with MRP, brand, and size info.',
        tag: 'Label Printing',
      },
      {
        title: 'Hassle-Free Size / Color Exchange',
        description: '1-click return and swap for a different size without re-entering tax calculations or payment.',
        tag: 'Exchange Window',
      },
      {
        title: 'EOSS & Volume Discount Rules',
        description: 'Automated Buy 2 Get 1 Free, End-of-Season flat discounts, and clearance promo rules.',
        tag: 'Promo Rules',
      },
      {
        title: 'Hold Cart & Trial Room Parking',
        description: 'Park customer bills while they try more garments; recall cart with one barcode scan.',
        tag: 'Hold Cart',
      },
    ],
    terminalPreview: {
      title: 'Apparel Fashion Counter',
      metrics: [
        { label: 'Exchanges Today', value: '3' },
        { label: 'EOSS Promo', value: 'Active (B2G1)' },
        { label: 'Parked Carts', value: '2' },
      ],
      sampleLines: [
        { item: 'Men Slim Fit Denim (Dark Blue)', detail: 'Size: 32 • Brand: Urban Denim • HSN 6203', amount: '₹1,499.00' },
        { item: 'Cotton Polo T-Shirt (Maroon)', detail: 'Size: L • 100% Combed Cotton • HSN 6109', amount: '₹799.00' },
        { item: 'Leather Belt (Reversible Brown)', detail: 'Size: 34-38 • Accessory • HSN 4203', amount: '₹499.00' },
      ],
    },
  },
  {
    id: 'wholesale',
    name: 'Wholesale & FMCG',
    badge: 'Specialized Module',
    badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    icon: Boxes,
    headline: 'Tiered bulk pricing, carton/case packaging breakdown, and GST e-Way bill ledger',
    description:
      'Engineered for wholesale traders, distributors, and stockists. Automatically applies bulk slab pricing, manages carton-to-unit conversions, and enforces B2B credit ledger limits.',
    status: 'upcoming',
    features: [
      {
        title: 'Tiered B2B Slab Pricing',
        description: 'Different rates for Wholesalers, Semi-Wholesalers, and Retailers with automatic volume discounts.',
        tag: 'Tiered Pricing',
      },
      {
        title: 'Master Carton & Crate Breakdown',
        description: 'Purchase in cartons of 48 units and sell in inner boxes of 12 or loose pieces seamlessly.',
        tag: 'Unit Conversion',
      },
      {
        title: 'Credit Aging & Outstanding Khata',
        description: '30/60/90 days credit monitoring with overdue alerts, statement PDFs, and interest tracking.',
        tag: 'Credit Aging',
      },
      {
        title: 'GST B2B Invoicing & E-Way Bill Ready',
        description: 'Full transport details (vehicle number, transporter ID, state code) exported for GST e-Way bills.',
        tag: 'E-Way Ready',
      },
      {
        title: 'Purchase Orders & GRN 3-Way Match',
        description: 'Verify supplier invoices against Purchase Orders and physical Goods Received Notes (GRN).',
        tag: 'Procurement',
      },
    ],
    terminalPreview: {
      title: 'Wholesale B2B Distribution',
      metrics: [
        { label: 'B2B Invoices', value: '18' },
        { label: 'Receivables Outstanding', value: '₹4,12,000' },
        { label: 'Cartons Dispatched', value: '160 Cases' },
      ],
      sampleLines: [
        { item: 'Parle-G Glucose Biscuits (Master Crate)', detail: '10 Cases (480 pkts) @ ₹4.10/pkt • Wholesale Tier', amount: '₹1,968.00' },
        { item: 'Rin Detergent Bar 250g (Carton)', detail: '5 Cartons (120 bars) @ ₹18.50/bar • B2B Rate', amount: '₹2,220.00' },
        { item: 'Colgate Strong Teeth 100g (Shrink Pack)', detail: '8 Bundles (96 tubes) @ ₹52.00/tube', amount: '₹4,992.00' },
      ],
    },
  },
];

export function LandingPage() {
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryVerticalId>('grocery');
  const [showSignInModal, setShowSignInModal] = useState(false);

  const activeModule = INDUSTRY_MODULES.find((m) => m.id === selectedIndustry) || INDUSTRY_MODULES[0];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* =========================================================================
          TOP NAVIGATION BAR
          ========================================================================= */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-emerald-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-white">
                  ASSISTT <span className="text-emerald-400">POS</span>
                </span>
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-bold px-1.5 py-0"
                >
                  v1.0 Production
                </Badge>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Multi-Tenant Offline-First Retail Platform
              </p>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <button
              onClick={() => scrollToSection('modules-section')}
              className="hover:text-emerald-400 transition cursor-pointer"
            >
              Industry Modules
            </button>
            <button
              onClick={() => scrollToSection('architecture-section')}
              className="hover:text-emerald-400 transition cursor-pointer"
            >
              Offline Engine
            </button>
            <button
              onClick={() => scrollToSection('hardware-section')}
              className="hover:text-emerald-400 transition cursor-pointer"
            >
              Printers &amp; Hardware
            </button>
            <button
              onClick={() => scrollToSection('pricing-section')}
              className="hover:text-emerald-400 transition cursor-pointer"
            >
              Pricing
            </button>
          </nav>

          {/* Right Action CTA Buttons */}
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => scrollToSection('signin-section')}
              className="border-slate-700 bg-slate-900 text-slate-200 hover:text-white hover:bg-slate-800 text-xs font-semibold cursor-pointer"
            >
              Sign In
            </Button>
            <Button
              size="sm"
              onClick={() => scrollToSection('signin-section')}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs px-4 shadow-lg shadow-emerald-500/25 cursor-pointer flex items-center gap-1.5"
            >
              <span>Launch POS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          HERO SECTION
          ========================================================================= */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-800/60 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {/* Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Trust Badges */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-[11px] font-semibold text-slate-300 shadow-inner mb-6">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <WifiOff className="w-3.5 h-3.5" /> 100% Offline SQLite
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5 text-teal-400">
              <ShieldCheck className="w-3.5 h-3.5" /> GST Statutory Ready
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <Printer className="w-3.5 h-3.5" /> 58/80mm Thermal Printing
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
            The Modern <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Offline-First POS</span> for Bharat’s Retailers
          </h1>

          <p className="mt-5 text-sm sm:text-base lg:text-lg text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Uninterrupted counter sales, instant barcode ring-up, customer Khata notebook, and Bluetooth thermal receipts. Built for Kirana, Supermarkets, Restaurants, Chemists, Electronics, and Fashion.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={() => scrollToSection('signin-section')}
              className="w-full sm:w-auto h-12 px-7 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Launch POS Terminal</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollToSection('modules-section')}
              className="w-full sm:w-auto h-12 px-6 border-slate-700 bg-slate-900/80 text-white hover:bg-slate-800 text-sm font-bold cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Explore Industry Modules</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="text-2xl font-black text-emerald-400">&lt; 0.2s</div>
              <div className="text-xs text-slate-400 mt-0.5">Barcode Scan Ring-up</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="text-2xl font-black text-teal-400">Zero Lag</div>
              <div className="text-xs text-slate-400 mt-0.5">Offline Local Persistence</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="text-2xl font-black text-cyan-400">100% Tax</div>
              <div className="text-xs text-slate-400 mt-0.5">CGST / SGST Auto-Split</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="text-2xl font-black text-amber-400">ESC/POS</div>
              <div className="text-xs text-slate-400 mt-0.5">Bluetooth 58/80mm Ready</div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          INDUSTRY MODULES SHOWCASE (EXPANDABLE VERTICALS)
          ========================================================================= */}
      <section id="modules-section" className="py-20 bg-slate-900/50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs font-bold px-3 py-1 mb-3"
            >
              Enterprise Multi-Vertical Architecture
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              One Universal Engine. Specialized Industry Modules.
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Every retail vertical has unique checkout demands. Assistt POS adapts its catalog schema, hardware interfaces, and tax rules to your specific business model.
            </p>
          </div>

          {/* Module Selector Pills / Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 mb-10">
            {INDUSTRY_MODULES.map((mod) => {
              const Icon = mod.icon;
              const isSelected = selectedIndustry === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => setSelectedIndustry(mod.id)}
                  data-testid={`module-tab-${mod.id}`}
                  className={`p-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition cursor-pointer text-center ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-bold leading-tight">{mod.name}</span>
                </button>
              );
            })}
          </div>

          {/* Active Industry Deep-Dive Display Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-950 rounded-3xl border border-slate-800 p-6 sm:p-10 shadow-2xl">
            {/* Left Column: Vertical Description & Feature Checklist (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={`${activeModule.badgeColor} font-bold text-xs px-2.5 py-0.5`}>
                  {activeModule.badge}
                </Badge>
                {activeModule.status === 'active' ? (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Ready to Use
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">Included in Next Release</span>
                )}
              </div>

              <div>
                <h3 className="text-xl sm:text-3xl font-black text-white leading-tight">
                  {activeModule.headline}
                </h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  {activeModule.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {activeModule.features.map((feat, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/90 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        {feat.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Button
                  size="sm"
                  onClick={() => scrollToSection('signin-section')}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs px-4 cursor-pointer flex items-center gap-1.5"
                >
                  <span>Experience {activeModule.name} POS</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Right Column: Live Terminal Preview Box (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-inner space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-white">{activeModule.terminalPreview.title}</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  LIVE COUNTER
                </span>
              </div>

              {/* Metrics Pill Grid */}
              <div className="grid grid-cols-3 gap-2">
                {activeModule.terminalPreview.metrics.map((m, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-center">
                    <div className="text-[10px] text-slate-500 truncate">{m.label}</div>
                    <div className="text-xs font-mono font-bold text-white mt-0.5 truncate">{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Terminal Invoice Lines Mockup */}
              <div className="space-y-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div className="text-[10px] text-slate-500 uppercase flex justify-between border-b border-slate-800 pb-1">
                  <span>ITEM &amp; SPECS</span>
                  <span>AMOUNT</span>
                </div>
                {activeModule.terminalPreview.sampleLines.map((line, idx) => (
                  <div key={idx} className="flex justify-between items-start text-[11px] py-1 border-b border-slate-900/80 last:border-none">
                    <div className="truncate max-w-[200px]">
                      <div className="font-semibold text-slate-200 truncate">{line.item}</div>
                      <div className="text-[10px] text-slate-500 truncate">{line.detail}</div>
                    </div>
                    <div className="font-bold text-emerald-400 shrink-0">{line.amount}</div>
                  </div>
                ))}
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-[11px] font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  1-Click Barcode / Keyboard Wedge Fast-Billing
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CORE ARCHITECTURAL PILLARS
          ========================================================================= */}
      <section id="architecture-section" className="py-20 border-b border-slate-800 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <Badge
              variant="outline"
              className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs font-bold px-3 py-1 mb-3"
            >
              Enterprise Engineering
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Engineered For The Reality of Indian Retail
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Intermittent broadband, power cuts, rush-hour lines, and strict GST audits. Built from the ground up to never fail at the checkout counter.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1: Offline SQLite */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <WifiOff className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">100% Offline-First SQLite</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                When the internet drops, your store never stops. Invoices, lines, inventory ledger movements, and customer balances write to a local encrypted SQLite database in a single atomic transaction. Syncs automatically upon reconnection.
              </p>
              <div className="pt-2 text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> Idempotent Sync Ingestion
              </div>
            </div>

            {/* Pillar 2: Indian GST Statutory Engine */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Automated GST Compliance</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Full support for intra-state (CGST + SGST) and inter-state (IGST) calculations. Automatically snapshots HSN commodity codes, computes rounded totals, and prepares one-click GSTR-1 (Table 4B, 7, 8, 12) and GSTR-3B tax summaries.
              </p>
              <div className="pt-2 text-xs font-mono text-teal-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> GSTR-1 &amp; GSTR-3B Ready
              </div>
            </div>

            {/* Pillar 3: Multi-Tenant RBAC & Branch Scoping */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Zero-Trust Role Security</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cashiers are strictly isolated to their assigned physical counter with cash float open/close reconciliation. Store Owners maintain global multi-branch oversight with centralized inventory replenishment and audit logs.
              </p>
              <div className="pt-2 text-xs font-mono text-cyan-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> Branch-Level IDOR Protection
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          HARDWARE & PRINTER ECOSYSTEM
          ========================================================================= */}
      <section id="hardware-section" className="py-20 bg-slate-900/40 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-5">
              <Badge
                variant="outline"
                className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs font-bold px-3 py-1"
              >
                Plug &amp; Play Hardware
              </Badge>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Works With Any Thermal Printer &amp; Billing Machine
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                No expensive proprietary POS hardware locks. Use your existing Android phone, handheld billing machine, tablet, or desktop workstation.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">58mm &amp; 80mm ESC/POS Support</h4>
                    <p className="text-[11px] text-slate-400">
                      Compatible with Sunmi, NGX, Essae, EzyPOS, TVS, and Epson Bluetooth &amp; USB printers.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Dynamic UPI QR Codes On Every Bill</h4>
                    <p className="text-[11px] text-slate-400">
                      Customers scan the printed receipt with GPay, PhonePe, or Paytm to pay instantly.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Electronic Weighing Scale Wedge</h4>
                    <p className="text-[11px] text-slate-400">
                      Direct serial &amp; Bluetooth scale integration for loose grains, vegetables, and bulk commodities.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-white">Supported Hardware Directory</span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">100% Certified</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="font-bold text-white">Android Billing POS</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Sunmi V2, NGX N5, handhelds</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="font-bold text-white">Thermal Receipt Printers</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Bluetooth 58mm / USB 80mm</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="font-bold text-white">Barcode Scanners</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">1D/2D Laser guns, Camera scan</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="font-bold text-white">Cash Drawers</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">RJ11 printer-kick auto trigger</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          PRICING PLANS
          ========================================================================= */}
      <section id="pricing-section" className="py-20 border-b border-slate-800 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs font-bold px-3 py-1 mb-3"
            >
              Affordable &amp; Transparent
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Fair Pricing for Indian MSMEs
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              No hidden commission on your sales. No forced hardware bundles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Tier 1: Starter */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Kirana Starter</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">₹0</span>
                  <span className="text-xs text-slate-400">/ forever</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">Perfect for single-counter standalone stores.</p>
                <div className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Single Counter POS Terminal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Offline SQLite Persistence</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Up to 1,000 Products</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>58mm Thermal Bill Prints</span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => scrollToSection('signin-section')}
                className="mt-6 w-full border-slate-700 bg-slate-800 text-white hover:bg-slate-700 text-xs font-bold cursor-pointer"
              >
                Start Free
              </Button>
            </div>

            {/* Tier 2: Pro Retail (Highlighted) */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 flex flex-col justify-between relative">
              <div className="absolute -top-3 right-6 bg-emerald-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Most Popular
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Retail Pro</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-emerald-400">₹499</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">For busy supermarkets, cafes, and chemist shops.</p>
                <div className="mt-6 space-y-2.5 text-xs text-slate-200">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Unlimited POS Counters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Customer Udhaar &amp; Khata Ledger</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Automated GSTR-1 &amp; GSTR-3B Reports</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Dynamic UPI QR On Receipts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Cashier Shift Handover &amp; Drawer Audit</span>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => scrollToSection('signin-section')}
                className="mt-6 w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black cursor-pointer shadow-md shadow-emerald-500/25"
              >
                Get Started
              </Button>
            </div>

            {/* Tier 3: Enterprise & Franchise */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Multi-Branch Enterprise</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">₹1,499</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">For chain stores, franchises, and wholesale distributors.</p>
                <div className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Multi-Branch Warehouse Transfers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Centralized Purchasing &amp; POs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Wholesale Tiered Slab Pricing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Custom ERP &amp; Tally Exports</span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => scrollToSection('signin-section')}
                className="mt-6 w-full border-slate-700 bg-slate-800 text-white hover:bg-slate-700 text-xs font-bold cursor-pointer"
              >
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SIGN IN / TERMINAL ACCESS SECTION
          (EMBEDS THE FULL LOGIN SCREEN & DEMO PRESETS)
          ========================================================================= */}
      <section id="signin-section" className="py-20 bg-slate-900/80 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-8">
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs font-bold px-3 py-1 mb-3"
          >
            Access Your Store
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Sign In to POS Workstation
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Log in with your store credentials or click below for a 1-click test drive as a Store Owner or Cashier.
          </p>
        </div>

        {/* Embedded Full LoginScreen for seamless authentication */}
        <div className="max-w-md mx-auto px-4">
          <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-white text-slate-900">
            <LoginScreen />
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER
          ========================================================================= */}
      <footer className="py-12 bg-slate-950 text-slate-400 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white">Assistt MSME POS Platform</span>
            <span>•</span>
            <span>Production v1.0</span>
          </div>
          <div className="flex items-center gap-6">
            <span>GST Statutory Compliant</span>
            <span>ESC/POS Standard</span>
            <span>100% Offline Resilience</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

