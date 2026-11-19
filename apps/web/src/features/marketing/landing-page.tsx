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
  ChevronDown,
  Star,
  Users,
  FileText,
  Clock,
  Layers,
  Building,
  HelpCircle,
  Quote,
  Zap,
  Cpu,
  RefreshCw,
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
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
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
        title: '100% Offline Billing & Stock Sync',
        description: 'Never pause your billing counter. Generate bills without internet, and sync seamlessly to the cloud once reconnected.',
        tag: 'Always Working',
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
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
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
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
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
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
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
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
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
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
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
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const activeModule = INDUSTRY_MODULES.find((m) => m.id === selectedIndustry) || INDUSTRY_MODULES[0];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openAuth = (mode: 'login' | 'register', industry?: IndustryVerticalId) => {
    setAuthMode(mode);
    if (industry) setSelectedIndustry(industry);
    scrollToSection('signin-section');
  };

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const FAQS = [
    {
      q: 'What happens when broadband or electricity goes down during billing?',
      a: 'ZeeZo Billing operates completely offline. You can ring up bills, scan barcodes, print thermal receipts, and take cash payments with zero internet. Once your network or Wi-Fi reconnects, all sales, stock changes, and customer balances automatically and safely back up to the cloud.',
    },
    {
      q: 'Does it work with my existing Bluetooth thermal printer or billing machine?',
      a: 'Yes. ZeeZo Billing connects easily over Bluetooth, USB, or Wi-Fi to all standard 58mm and 80mm thermal receipt printers (including Sunmi, NGX, Essae, TVS, Epson, and regular thermal printers). Once paired, it connects automatically every morning when you start billing.',
    },
    {
      q: 'How are GST calculations and tax summaries handled?',
      a: 'GST is calculated automatically down to the exact paisa, with clear CGST, SGST, and IGST breakdowns. Every invoice prints the correct HSN code and tax rates. You can export clean GST summaries whenever you need to file your monthly returns.',
    },
    {
      q: 'Can my cashiers see store profit, edit prices, or switch branches?',
      a: 'No. Cashiers only have access to the checkout counter and billing screen. Your product purchase costs, store profits, inventory adjustments, and settings are strictly password-protected for Store Owners and Managers only.',
    },
    {
      q: 'Can I run the app on my phone and manage my store from a laptop?',
      a: 'Yes! Cashiers can ring up bills on Android phones, tablets, or handheld billing machines. Store owners can log in from any web browser on a laptop, desktop, or tablet to check live sales, add items, view stock, and manage accounts anytime.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* =========================================================================
          TOP NAVIGATION BAR (Glassmorphism + Shipixen Light Header Pattern)
          ========================================================================= */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-amber-400 bg-slate-900 shadow-md shadow-amber-500/20 flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="ZeeZo Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-slate-900">
                  ZeeZo <span className="text-amber-500 font-extrabold">Billing</span>
                </span>
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold px-1.5 py-0"
                >
                  Smart POS
                </Badge>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block">
                Fast Billing &amp; Store Management
              </p>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <button
              onClick={() => scrollToSection('bento-section')}
              className="hover:text-amber-600 transition cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('modules-section')}
              className="hover:text-amber-600 transition cursor-pointer"
            >
              Businesses
            </button>
            <button
              onClick={() => scrollToSection('hardware-section')}
              className="hover:text-amber-600 transition cursor-pointer"
            >
              Hardware &amp; Printers
            </button>
            <button
              onClick={() => scrollToSection('pricing-section')}
              className="hover:text-amber-600 transition cursor-pointer"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection('faq-section')}
              className="hover:text-amber-600 transition cursor-pointer"
            >
              FAQ
            </button>
          </nav>

          {/* Right Action CTA Buttons */}
          <div className="flex items-center gap-2.5">
            <a
              href="/downloads/kirana-pos.apk"
              download="kirana-pos.apk"
              title="Download Android Mobile POS APK"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-800 text-xs font-bold cursor-pointer shadow-xs transition"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-600" />
              <span>Download App</span>
            </a>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAuth('login')}
              className="border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold cursor-pointer shadow-xs"
            >
              Sign In
            </Button>
            <Button
              size="sm"
              onClick={() => openAuth('register')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5 transition-all hover:scale-[1.02]"
            >
              <span>Launch POS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          HERO SECTION (Shipixen Light Leading Pill + Ambient Radial Glow)
          ========================================================================= */}
      <section className="relative overflow-hidden pt-16 pb-20 border-b border-slate-200/80 bg-white bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(245,158,11,0.12),rgba(255,255,255,0))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Shipixen Light Leading Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm shadow-slate-100 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-700 font-bold">100% Offline Ready</span>
            <span className="text-slate-300">•</span>
            <span>Instant GST Invoicing</span>
            <span className="text-slate-300">•</span>
            <span className="text-amber-600 font-medium">Thermal Bill Printing</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 max-w-4xl mx-auto leading-[1.12]">
            Superfast Billing &amp; POS for <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-600">Retail &amp; Restaurants</span>
          </h1>

          <p className="mt-5 text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Lightning-fast counter checkout, barcode scanning, customer Khata notebook, instant UPI payments, and Bluetooth thermal receipts. Works smoothly even during power or internet cuts.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={() => openAuth('register')}
              className="w-full sm:w-auto h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/25 cursor-pointer flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <span>Launch POS Terminal</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <a
              href="/downloads/kirana-pos.apk"
              download="kirana-pos.apk"
              className="w-full sm:w-auto h-12 px-6 rounded-xl border border-amber-300/80 bg-amber-50/80 hover:bg-amber-100 text-amber-900 text-sm font-bold cursor-pointer flex items-center justify-center gap-2 shadow-xs transition-all hover:scale-[1.02]"
            >
              <Smartphone className="w-4 h-4 text-amber-600" />
              <span>Download Android App</span>
            </a>
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollToSection('modules-section')}
              className="w-full sm:w-auto h-12 px-6 border-slate-200 bg-white text-slate-800 hover:bg-slate-50 text-sm font-bold cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Explore Businesses</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Button>
          </div>

          {/* Social Proof Strip */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="font-semibold text-slate-900">4.9/5</span>
            <span>•</span>
            <span>Trusted by 1,200+ Indian MSMEs across Mumbai, Pune, Bangalore &amp; Delhi</span>
          </div>

          {/* Quick Metrics Bar (Light Cards) */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
              <div className="text-2xl font-black text-emerald-600">&lt; 0.2s</div>
              <div className="text-xs text-slate-500 mt-0.5">Barcode Scan Ring-up</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
              <div className="text-2xl font-black text-teal-600">Zero Lag</div>
              <div className="text-xs text-slate-500 mt-0.5">Offline Local Persistence</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
              <div className="text-2xl font-black text-cyan-600">100% Tax</div>
              <div className="text-xs text-slate-500 mt-0.5">CGST / SGST Auto-Split</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
              <div className="text-2xl font-black text-amber-600">ESC/POS</div>
              <div className="text-xs text-slate-500 mt-0.5">Bluetooth 58/80mm Ready</div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ECOSYSTEM & HARDWARE TICKER BAND (Light Shipixen Marquee Band)
          ========================================================================= */}
      <section className="py-6 bg-slate-100/70 border-b border-slate-200/80 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center mb-4">
            Certified Hardware &amp; Payment Rails Compatible
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-2 text-slate-700">
              <Printer className="w-4 h-4 text-emerald-600" /> Sunmi POS
            </span>
            <span className="flex items-center gap-2 text-slate-700">
              <Printer className="w-4 h-4 text-emerald-600" /> NGX Handheld
            </span>
            <span className="flex items-center gap-2 text-slate-700">
              <Printer className="w-4 h-4 text-emerald-600" /> Essae &amp; TVS
            </span>
            <span className="flex items-center gap-2 text-slate-700">
              <Printer className="w-4 h-4 text-emerald-600" /> Epson ESC/POS
            </span>
            <span className="flex items-center gap-2 text-slate-700">
              <QrCode className="w-4 h-4 text-cyan-600" /> Dynamic UPI QR
            </span>
            <span className="flex items-center gap-2 text-slate-700">
              <ShieldCheck className="w-4 h-4 text-teal-600" /> GST Suvidha Ready
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          KEY FEATURES GRID: FAST, SIMPLE & RELIABLE BILLING
          ========================================================================= */}
      <section id="bento-section" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <Badge
              variant="outline"
              className="bg-amber-50 text-amber-800 border-amber-200 text-xs font-bold px-3 py-1 mb-3"
            >
              Why Store Owners Choose ZeeZo
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Built for Speed, Simplicity &amp; Zero Downtime
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Handle rush-hour counter queues, weighing scale loose items, instant UPI payments, and customer store credit without ever getting stuck.
            </p>
          </div>

          {/* 5-Item Bento Box Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Bento Card 1: 100% Offline Resilience (Spans 2 columns) */}
            <div className="md:col-span-2 p-8 rounded-3xl bg-white border border-slate-200 relative overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md hover:border-emerald-500/50 transition-all duration-300">
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 mb-6">
                  <WifiOff className="w-6 h-6" />
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold mb-3">
                  100% Offline Ready
                </Badge>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  Works 100% Offline — Never Stops During Internet Cuts
                </h3>
                <p className="text-sm text-slate-600 mt-2 max-w-xl leading-relaxed">
                  When broadband or mobile data drops, your checkout counter never halts. Scan barcodes, print thermal receipts, collect cash, and manage customers completely offline. Everything backs up safely to the cloud the moment you reconnect.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100 text-xs font-medium text-emerald-700">
                <span className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Zero Downtime Billing
                </span>
                <span className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Automatic Cloud Backup
                </span>
              </div>
            </div>

            {/* Bento Card 2: 0.2s Ring-up & Weighing Scale */}
            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-teal-500/50 flex flex-col justify-between transition-all duration-300">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-200 mb-6">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">0.2s Fast Barcode Ring-up</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Instant recognition with USB &amp; Bluetooth laser scanners or phone camera. Connects with electronic weighing scales for loose grains, fruits, and vegetables.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-medium text-teal-700 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-teal-600" /> Electronic Weighing Scale Sync
              </div>
            </div>

            {/* Bento Card 3: Automated Indian GST Engine */}
            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-cyan-500/50 flex flex-col justify-between transition-all duration-300">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-200 mb-6">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Simple GST Invoicing</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Accurate CGST, SGST, and IGST tax calculations down to the exact paisa. Print GSTIN &amp; HSN codes on receipts and export clean summaries for monthly filing.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-medium text-cyan-700 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-cyan-600" /> One-Click GST Tax Summaries
              </div>
            </div>

            {/* Bento Card 4: Customer Khata & WhatsApp Invoicing */}
            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-purple-500/50 flex flex-col justify-between transition-all duration-300">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200 mb-6">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Customer Khata (Udhaar)</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Record customer store credit, track pending balances, set credit limits, and send instant WhatsApp bills and polite payment reminders with UPI links.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-medium text-purple-700 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-purple-600" /> WhatsApp Receipts &amp; Reminders
              </div>
            </div>

            {/* Bento Card 5: Cashier Float & Staff Security */}
            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-amber-500/50 flex flex-col justify-between transition-all duration-300">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 mb-6">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Cash Drawer &amp; Staff Security</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Track cashier shift opening float, mid-day cash collections, and end-of-shift drawer handovers. Protect your purchase prices and profits from staff eyes.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-medium text-amber-700 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-amber-600" /> Staff Roles &amp; Cash Float Security
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          INDUSTRY MODULES SHOWCASE (EXPANDABLE VERTICALS & LIVE PREVIEWS) (LIGHT)
          ========================================================================= */}
      <section id="modules-section" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold px-3 py-1 mb-3"
            >
              All-In-One Business Solution
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Tailored For Every Retail &amp; Dining Business
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Every business has unique billing needs. ZeeZo Billing adapts its catalog, barcode scanner, receipt format, and taxes to your exact store type.
            </p>
          </div>

          {/* Module Selector Pills / Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200/90 mb-10">
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
                      ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-bold leading-tight">{mod.name}</span>
                </button>
              );
            })}
          </div>

          {/* Active Industry Deep-Dive Display Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-50 rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm">
            {/* Left Column: Vertical Description & Feature Checklist (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={`${activeModule.badgeColor} font-bold text-xs px-2.5 py-0.5`}>
                  {activeModule.badge}
                </Badge>
                {activeModule.status === 'active' ? (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Ready to Use
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 font-medium">Included in Next Release</span>
                )}
              </div>

              <div>
                <h3 className="text-xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {activeModule.headline}
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {activeModule.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {activeModule.features.map((feat, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        {feat.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Button
                  size="sm"
                  onClick={() => openAuth('register', activeModule.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 cursor-pointer flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
                >
                  <span>Experience {activeModule.name} POS</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Right Column: Live Terminal Preview Box (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4 text-slate-100">
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
                    <div className="text-[10px] text-slate-400 truncate">{m.label}</div>
                    <div className="text-xs font-mono font-bold text-white mt-0.5 truncate">{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Terminal Invoice Lines Mockup */}
              <div className="space-y-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div className="text-[10px] text-slate-400 uppercase flex justify-between border-b border-slate-800 pb-1">
                  <span>ITEM &amp; SPECS</span>
                  <span>AMOUNT</span>
                </div>
                {activeModule.terminalPreview.sampleLines.map((line, idx) => (
                  <div key={idx} className="flex justify-between items-start text-[11px] py-1 border-b border-slate-900/80 last:border-none">
                    <div className="truncate max-w-[200px]">
                      <div className="font-semibold text-slate-200 truncate">{line.item}</div>
                      <div className="text-[10px] text-slate-400 truncate">{line.detail}</div>
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
          HARDWARE & PRINTER ECOSYSTEM (LIGHT)
          ========================================================================= */}
      <section id="hardware-section" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-5">
              <Badge
                variant="outline"
                className="bg-purple-50 text-purple-700 border-purple-200 text-xs font-bold px-3 py-1"
              >
                Plug &amp; Play Hardware
              </Badge>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Works With Any Thermal Printer &amp; Billing Machine
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                No expensive proprietary POS hardware locks. Use your existing Android phone, handheld billing machine, tablet, or desktop workstation.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">58mm &amp; 80mm ESC/POS Support</h4>
                    <p className="text-[11px] text-slate-600">
                      Compatible with Sunmi, NGX, Essae, EzyPOS, TVS, and Epson Bluetooth &amp; USB printers.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 border border-blue-200">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Dynamic UPI QR Codes On Every Bill</h4>
                    <p className="text-[11px] text-slate-600">
                      Customers scan the printed receipt with GPay, PhonePe, or Paytm to pay instantly.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 border border-amber-200">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Electronic Weighing Scale Wedge</h4>
                    <p className="text-[11px] text-slate-600">
                      Direct serial &amp; Bluetooth scale integration for loose grains, vegetables, and bulk commodities.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-900">Supported Hardware Directory</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono font-bold">100% Certified</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">Android Billing POS</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">Sunmi V2, NGX N5, handhelds</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">Thermal Receipt Printers</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">Bluetooth 58mm / USB 80mm</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">Barcode Scanners</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">1D/2D Laser guns, Camera scan</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">Cash Drawers</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">RJ11 printer-kick auto trigger</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          PRICING PLANS (LIGHT SHIPXEN PRICING BLOCK)
          ========================================================================= */}
      <section id="pricing-section" className="py-20 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold px-3 py-1 mb-3"
            >
              Affordable &amp; Transparent
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Fair Pricing for Indian MSMEs
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              No hidden commission on your sales. No forced hardware bundles.
            </p>

            {/* Billing Interval Toggle */}
            <div className="mt-6 inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                onClick={() => setBillingInterval('monthly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  billingInterval === 'monthly'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingInterval('annual')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  billingInterval === 'annual'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Annual Billing</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
                  billingInterval === 'annual' ? 'bg-emerald-800 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Tier 1: Starter */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200 flex flex-col justify-between shadow-xs hover:shadow-md transition">
              <div>
                <h3 className="text-base font-bold text-slate-900">Kirana Starter</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">₹0</span>
                  <span className="text-xs text-slate-500">/ forever</span>
                </div>
                <p className="text-xs text-slate-600 mt-2">Perfect for single-counter standalone stores.</p>
                <div className="mt-6 space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Single Counter POS Terminal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>100% Offline Billing Support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Up to 1,000 Products</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>58mm Thermal Bill Prints</span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => openAuth('register', 'grocery')}
                className="mt-6 w-full border-slate-200 bg-white text-slate-800 hover:bg-slate-50 text-xs font-bold cursor-pointer shadow-xs"
              >
                Start Free
              </Button>
            </div>

            {/* Tier 2: Pro Retail (Highlighted) */}
            <div className="p-7 rounded-3xl bg-gradient-to-b from-emerald-50/60 via-white to-white border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 flex flex-col justify-between relative">
              <div className="absolute -top-3 right-6 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                Most Popular
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Retail Pro</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-emerald-700">
                    {billingInterval === 'annual' ? '₹399' : '₹499'}
                  </span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>
                <p className="text-xs text-slate-600 mt-2">For busy supermarkets, cafes, and chemist shops.</p>
                <div className="mt-6 space-y-2.5 text-xs text-slate-800 font-medium">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Unlimited POS Counters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Customer Udhaar &amp; Khata Ledger</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Automated GSTR-1 &amp; GSTR-3B Reports</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Dynamic UPI QR On Receipts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Cashier Shift Handover &amp; Drawer Audit</span>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => openAuth('register')}
                className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer shadow-md shadow-emerald-600/25"
              >
                Get Started
              </Button>
            </div>

            {/* Tier 3: Enterprise & Franchise */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200 flex flex-col justify-between shadow-xs hover:shadow-md transition">
              <div>
                <h3 className="text-base font-bold text-slate-900">Multi-Branch Enterprise</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">
                    {billingInterval === 'annual' ? '₹1,199' : '₹1,499'}
                  </span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>
                <p className="text-xs text-slate-600 mt-2">For chain stores, franchises, and wholesale distributors.</p>
                <div className="mt-6 space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Multi-Branch Warehouse Transfers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Centralized Purchasing &amp; POs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Wholesale Tiered Slab Pricing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Custom ERP &amp; Tally Exports</span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => openAuth('register', 'wholesale')}
                className="mt-6 w-full border-slate-200 bg-white text-slate-800 hover:bg-slate-50 text-xs font-bold cursor-pointer shadow-xs"
              >
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SHIPXEN TESTIMONIALS: REAL MERCHANT SUCCESS STORIES (LIGHT)
          ========================================================================= */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold px-3 py-1 mb-3"
            >
              Merchant Success
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Trusted on Counter Floors Across India
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Read how store owners transformed their checkout speed, offline reliability, and GST reconciliations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Testimonial 1 */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed italic">
                  &ldquo;During evening rush hour from 7 to 9 PM, our broadband used to drop and customers walked away. With ZeeZo Billing offline mode, counter ring-up is under 2 seconds and we never lose a sale.&rdquo;
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                  RG
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    Rajesh Gupta
                    <span className="text-[10px] text-emerald-700 font-normal">✓ Verified</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Gupta Super Kirana • Pune</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed italic">
                  &ldquo;Table visual floorplan and wireless KOT printing to the kitchen station cut our order delivery time by 8 minutes. Splitting bills across guests is seamless for college groups.&rdquo;
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                  AR
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    Chef Ananya Rao
                    <span className="text-[10px] text-emerald-700 font-normal">✓ Verified</span>
                  </div>
                  <div className="text-[11px] text-slate-500">The Urban Bistro • Bangalore</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed italic">
                  &ldquo;FEFO batch expiry alerts completely eliminated expired medicine losses at our pharmacy. Our CA downloads GSTR-1 directly from the portal every month with zero discrepancies.&rdquo;
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-cyan-100 text-cyan-800 font-bold flex items-center justify-center text-xs">
                  VS
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    Dr. Vikram Sharma
                    <span className="text-[10px] text-emerald-700 font-normal">✓ Verified</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Sharma Medicos • New Delhi</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SHIPXEN FAQ COLLAPSIBLE (INTERACTIVE ACCORDION) (LIGHT)
          ========================================================================= */}
      <section id="faq-section" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-bold px-3 py-1 mb-3"
            >
              Frequently Asked Questions
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Got Questions? We Have Answers.
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Clear answers to the most common questions from retail merchants and cashiers.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden transition"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition"
                  >
                    <span className="text-sm font-bold text-slate-900">{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-emerald-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          HIGH-CONVERTING CTA BANNER (LIGHT SHIPXEN GRADIENT)
          ========================================================================= */}
      <section className="py-16 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-b border-emerald-200/80 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-emerald-800 border border-emerald-200 text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Instant 45-Second Store Onboarding
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight max-w-2xl mx-auto leading-tight">
            Ready to Accelerate Your Checkout Counter?
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Deploy in minutes with pre-seeded fast items, connect your thermal printer, and experience zero-lag offline sales.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={() => openAuth('register')}
              className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/25 cursor-pointer flex items-center gap-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => openAuth('login')}
              className="h-12 px-7 border-slate-300 bg-white text-slate-800 hover:bg-slate-50 text-sm font-bold cursor-pointer shadow-xs"
            >
              Sign In to Terminal
            </Button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SIGN IN / TERMINAL ACCESS SECTION (LIGHT)
          ========================================================================= */}
      <section id="signin-section" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-8">
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold px-3 py-1 mb-3"
          >
            Access Your Store
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Sign In to POS Workstation
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Log in with your store credentials or click below for a 1-click test drive as a Store Owner or Cashier.
          </p>
        </div>

        {/* Embedded Full LoginScreen for seamless authentication */}
        <div className={`mx-auto px-4 transition-all duration-300 ${authMode === 'register' ? 'max-w-2xl' : 'max-w-md'}`}>
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-white text-slate-900">
            <LoginScreen
              key={`${authMode}-${selectedIndustry}`}
              defaultMode={authMode}
              defaultIndustry={selectedIndustry}
            />
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER (LIGHT SHIPXEN PATTERN)
          ========================================================================= */}
      <footer className="py-14 bg-white text-slate-600 text-xs border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-black text-sm mb-3">
              <div className="w-6 h-6 rounded-full overflow-hidden border border-amber-400 bg-slate-900 flex items-center justify-center shrink-0">
                <img src="/logo.png" alt="ZeeZo Logo" className="w-full h-full object-cover" />
              </div>
              <span>ZeeZo™ Billing</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Fast, simple, and reliable billing and store management for kirana stores, supermarkets, restaurants, and retail shops.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">Business Types</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>Kirana &amp; Grocery</li>
              <li>Restaurant &amp; Cafe</li>
              <li>Pharmacy &amp; Chemist</li>
              <li>Electronics &amp; Appliances</li>
              <li>Apparel &amp; Fashion</li>
              <li>Wholesale &amp; Distribution</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">Hardware Support</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>58mm &amp; 80mm Thermal Printers</li>
              <li>Dynamic Bharat UPI QR Codes</li>
              <li>Electronic Weighing Scales</li>
              <li>Android Handheld Billing Devices</li>
              <li>1D / 2D Barcode Scanners</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">GST &amp; Cloud</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>Instant GST Bills (CGST / SGST / IGST)</li>
              <li>Clean Monthly Tax Summaries</li>
              <li>HSN Code Database</li>
              <li>Staff &amp; Cashier Float Controls</li>
              <li className="text-emerald-700 font-semibold flex items-center gap-1 mt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                Live Cloud Sync Active
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div>
            &copy; {new Date().getFullYear()} ZeeZo™ Billing. Built for Indian Businesses.
          </div>
          <div className="flex items-center gap-6 text-slate-500">
            <span>GST Ready</span>
            <span>Thermal Bill Printing</span>
            <span>100% Offline Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
