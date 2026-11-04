'use client';

import React, { useState } from 'react';
import {
  Store,
  UtensilsCrossed,
  Pill,
  Smartphone,
  Shirt,
  Boxes,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  Building2,
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DEFAULT_MODULES_BY_BUSINESS, BusinessType, AppModule } from '@pos/shared-types';

export const AVAILABLE_MODULE_OPTIONS = [
  { id: AppModule.POS, name: 'POS Billing Terminal', desc: 'Touch grid, barcode scanning, shortcuts', required: true },
  { id: AppModule.INVENTORY, name: 'Catalog & Stock Ledger', desc: 'Stock movements, low-stock alerts', required: true },
  { id: AppModule.RESTAURANT, name: 'Restaurant Tables & KDS', desc: 'Dine-in floorplan, KOT ticket dispatch' },
  { id: AppModule.KHATA, name: 'Customer Khata Credit Book', desc: 'Credit limits & ledger repayments' },
  { id: AppModule.GST, name: 'GST Returns (GSTR-1/3B)', desc: 'HSN summaries & statutory filing exports' },
  { id: AppModule.SHIFTS, name: 'Cashier Shift Register', desc: 'Opening/closing float and cash auditing' },
];

export const INDIAN_STATES = [
  { code: '01', name: 'Jammu and Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: '27', name: 'Maharashtra' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman and Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
  { code: '38', name: 'Ladakh' },
];

export const INDUSTRY_OPTIONS = [
  {
    id: 'grocery',
    name: 'Kirana & Grocery',
    desc: 'Loose grains, barcode scan & weighing scale',
    icon: Store,
    badge: 'Live',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'restaurant',
    name: 'Restaurant & Cafe',
    desc: 'Table floorplans, KOT tickets & kitchen KDS',
    icon: UtensilsCrossed,
    badge: 'Live',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    id: 'pharmacy',
    name: 'Pharmacy & Chemist',
    desc: 'FEFO batch expiry & loose strips',
    icon: Pill,
    badge: 'Popular',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  },
  {
    id: 'electronics',
    name: 'Electronics & Mobile',
    desc: 'Serial/IMEI tracker & warranty cards',
    icon: Smartphone,
    badge: 'Retail',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: 'apparel',
    name: 'Apparel & Fashion',
    desc: 'Size x Color matrix & barcode hangtags',
    icon: Shirt,
    badge: 'Retail',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    id: 'wholesale',
    name: 'Wholesale & FMCG',
    desc: 'Bulk tiered pricing & carton breakdown',
    icon: Boxes,
    badge: 'B2B',
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
  },
];

interface OnboardingWizardProps {
  initialIndustry?: string;
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function OnboardingWizard({
  initialIndustry = 'grocery',
  onSuccess,
  onSwitchToLogin,
}: OnboardingWizardProps) {
  const { registerMerchant, status, error, clearError } = useAuthStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [storeName, setStoreName] = useState('');
  const [businessType, setBusinessType] = useState(initialIndustry);
  const [enabledModules, setEnabledModules] = useState<string[]>(() => {
    const defaults = (DEFAULT_MODULES_BY_BUSINESS as any)[initialIndustry] || DEFAULT_MODULES_BY_BUSINESS[BusinessType.GROCERY];
    return defaults.map((d: any) => String(d));
  });

  const handleSelectBusinessType = (type: string) => {
    setBusinessType(type);
    const defaults = (DEFAULT_MODULES_BY_BUSINESS as any)[type] || DEFAULT_MODULES_BY_BUSINESS[BusinessType.GROCERY];
    setEnabledModules(defaults.map((d: any) => String(d)));
  };

  const [stateCode, setStateCode] = useState('27'); // Default: Maharashtra
  const [city, setCity] = useState('');
  const [gstin, setGstin] = useState('');
  const [seedSampleCatalog, setSeedSampleCatalog] = useState(true);

  // User credentials
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    if (!storeName.trim()) {
      setValidationError('Please enter your business / store name');
      return;
    }
    if (!stateCode) {
      setValidationError('Please select the state where your store is located');
      return;
    }

    setStep(2);
  };

  const handlePrevStep = () => {
    setValidationError(null);
    clearError();
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    if (!fullName.trim()) {
      setValidationError('Full Name is required');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setValidationError('Valid email address is required');
      return;
    }
    if (!password || password.length < 8) {
      setValidationError('Password must be at least 8 characters with upper, lower & numbers');
      return;
    }

    if (gstin.trim()) {
      const cleanGstin = gstin.trim().toUpperCase();
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(cleanGstin)) {
        setValidationError('Invalid GSTIN format (e.g. 27ABCDE1234F1Z5)');
        return;
      }
      if (cleanGstin.substring(0, 2) !== stateCode) {
        setValidationError(
          `GSTIN state prefix (${cleanGstin.substring(0, 2)}) must match selected state code (${stateCode})`,
        );
        return;
      }
    }

    try {
      await registerMerchant({
        email: email.trim().toLowerCase(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim() ? phone.trim() : undefined,
        storeName: storeName.trim(),
        businessType,
        stateCode,
        gstin: gstin.trim() ? gstin.trim().toUpperCase() : undefined,
        city: city.trim() ? city.trim() : undefined,
        seedSampleCatalog,
        enabledModules,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch {
      // Error handled by zustand auth.store
    }
  };

  const isSubmitting = status === 'loading';

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden text-slate-900">
      {/* Wizard Header */}
      <div className="bg-slate-50/80 px-6 py-5 border-b border-slate-200/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 leading-tight">Create Store Account</h2>
              <p className="text-[11px] text-slate-500">Fast 45-Second Self-Serve Setup</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                step === 1 ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              1
            </span>
            <span className="text-slate-300">•</span>
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                step === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              2
            </span>
          </div>
        </div>

        {/* Step subtitle */}
        <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>{step === 1 ? 'Step 1: Store & Industry Type' : 'Step 2: Owner Account & GST'}</span>
          <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
            {step === 1 ? 'Next: Owner Profile' : 'Final Step'}
          </span>
        </div>
      </div>

      {/* Error alert */}
      {(validationError || error) && (
        <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{validationError || error}</span>
        </div>
      )}

      {/* Step 1: Business Details & Vertical */}
      {step === 1 && (
        <form data-testid="onboarding-step1-form" onSubmit={handleNextStep} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Store / Business Display Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Ramesh Kirana &amp; Supermarket"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select Your Retail Vertical <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {INDUSTRY_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = businessType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectBusinessType(opt.id)}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${opt.badgeColor}`}>
                        {opt.badge}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 leading-tight">{opt.name}</div>
                      <div className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-1">
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active modules checklist */}
            <div className="mt-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700">Configured Store Modules</span>
                <span className="text-[10px] text-emerald-700 font-semibold">
                  {enabledModules.length} Active for {INDUSTRY_OPTIONS.find((o) => o.id === businessType)?.name}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {AVAILABLE_MODULE_OPTIONS.map((mod) => {
                  const isChecked = enabledModules.includes(mod.id);
                  return (
                    <label
                      key={mod.id}
                      className={`flex items-start gap-1.5 p-2 rounded-lg border text-left cursor-pointer transition select-none ${
                        isChecked
                          ? 'bg-white border-emerald-300 shadow-2xs'
                          : 'bg-slate-100/60 border-slate-200/80 opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={mod.required}
                        onChange={(e) => {
                          if (mod.required) return;
                          if (e.target.checked) {
                            setEnabledModules([...enabledModules, mod.id]);
                          } else {
                            setEnabledModules(enabledModules.filter((m) => m !== mod.id));
                          }
                        }}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                      />
                      <div>
                        <div className="text-[10px] font-bold text-slate-800 leading-tight flex items-center gap-1">
                          {mod.name}
                          {mod.required && <span className="text-[9px] text-slate-400 font-normal">(Core)</span>}
                        </div>
                        <div className="text-[9px] text-slate-400 leading-tight mt-0.5">{mod.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                State (GST Jurisdiction) <span className="text-rose-500">*</span>
              </label>
              <select
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.code} - {st.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City / Town</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Pune"
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            {onSwitchToLogin && (
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                Already have an account? Sign In
              </button>
            )}
            <Button
              type="submit"
              className="ml-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </form>
      )}

      {/* Step 2: Account Details & Fast Seed */}
      {step === 2 && (
        <form data-testid="onboarding-step2-form" onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Owner Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ramesh Gupta"
                  className="w-full pl-8.5 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-8.5 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Address (Login ID) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ramesh@guptakirana.in"
                className="w-full pl-8.5 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters (Upper, Lower, Number)"
                className="w-full pl-8.5 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                GSTIN <span className="text-slate-400 font-normal">(Optional for Composition/Unregistered)</span>
              </label>
              <span className="text-[10px] text-slate-400">Prefix must be {stateCode}</span>
            </div>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              placeholder={`${stateCode}AAAAA0000A1Z5`}
              maxLength={15}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition font-mono uppercase"
            />
          </div>

          {/* Starter Catalog Seed Switch */}
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-2.5">
            <input
              id="seedCatalog"
              type="checkbox"
              checked={seedSampleCatalog}
              onChange={(e) => setSeedSampleCatalog(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 border-slate-300 cursor-pointer"
            />
            <label htmlFor="seedCatalog" className="text-xs cursor-pointer select-none">
              <span className="font-bold text-emerald-950 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Pre-load fast-moving starter catalog
              </span>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Automatically loads standard {businessType} SKUs with verified HSN codes &amp; GST rates so you can
                start billing immediately.
              </p>
            </label>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={isSubmitting}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="ml-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Store &amp; Catalog...
                </>
              ) : (
                <>
                  <span>Complete Setup &amp; Launch POS</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Footer Trust Bar */}
      <div className="bg-slate-50 px-6 py-2.5 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] text-slate-400">
        <ShieldCheck className="w-3 h-3 text-emerald-600" />
        <span>100% Encrypted • Multi-Tenant Isolated • Indian GST Compliant</span>
      </div>
    </div>
  );
}
