'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Store, ShieldCheck, AlertCircle, ArrowRight, Loader2, UserCheck } from 'lucide-react';

export default function LoginScreen() {
  const { login, status, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    if (!email.trim()) {
      setValidationError('Email is required');
      return;
    }
    if (!password) {
      setValidationError('Password is required');
      return;
    }

    try {
      await login(email.trim(), password);
    } catch {
      // Error is set in store
    }
  };

  const handleFillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password@123');
    setValidationError(null);
    clearError();
  };

  const isLoading = status === 'loading';

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Branding */}
        <div className="flex flex-col items-center justify-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-emerald-600/20 mb-3">
            <Store className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            KIRANA <span className="text-emerald-600 font-extrabold">POS</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">MSME Retail &amp; Kirana Platform</p>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xs border border-slate-200/80 rounded-2xl">
          <div className="mb-6 text-center">
            <h2 className="text-lg font-bold text-slate-900">Sign in to your Store</h2>
            <p className="text-xs text-slate-500 mt-1">
              Live multi-tenant authentication &amp; branch RBAC
            </p>
          </div>

          {/* Error alerts */}
          {(error || validationError) && (
            <div
              data-testid="login-error-banner"
              className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5"
            >
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{validationError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                data-testid="login-email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@kirana.dev"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition shadow-2xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                data-testid="login-password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition shadow-2xs font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              data-testid="login-submit-btn"
              className="w-full mt-2 flex justify-center items-center py-2.5 px-4 rounded-xl shadow-xs text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition cursor-pointer gap-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin h-4 w-4 text-white" />
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  Sign In to Terminal
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 mb-2.5 text-center uppercase tracking-wider">
              Quick Test Credentials
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('admin@kirana.dev')}
                data-testid="demo-owner-btn"
                className="p-2.5 text-left bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl text-xs transition cursor-pointer group"
              >
                <div className="font-bold text-slate-900 flex items-center gap-1 group-hover:text-emerald-700">
                  <UserCheck className="h-3 w-3 text-emerald-600" />
                  <span>Store Owner</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">admin@kirana.dev</div>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('cashier@kirana.dev')}
                data-testid="demo-cashier-btn"
                className="p-2.5 text-left bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl text-xs transition cursor-pointer group"
              >
                <div className="font-bold text-slate-900 flex items-center gap-1 group-hover:text-blue-700">
                  <UserCheck className="h-3 w-3 text-blue-600" />
                  <span>Cashier</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">cashier@kirana.dev</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Secure session with HttpOnly cookies &amp; SHA-256 token rotation</span>
        </div>
      </div>
    </div>
  );
}

