'use client';

import React from 'react';
import { Subscription } from '@/lib/api-client';
import { Sparkles, Building2, Smartphone, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface SubscriptionViewProps {
  subscription: Subscription | null;
}

export function SubscriptionView({ subscription }: SubscriptionViewProps) {
  return (
    <div className="space-y-4" data-testid="subscription-content">
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Sparkles className="h-4 w-4" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Commercial Subscription Tier</h2>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Multi-tenant licensing limits &amp; active business entitlement
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Plan Tier</span>
            <h3 className="text-xl font-black text-slate-900 uppercase mt-0.5">
              {subscription?.planCode || 'Basic Kirana'}
            </h3>
          </div>
          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 font-bold text-xs uppercase px-3 py-1">
            {subscription?.status || 'Active'}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-4 my-6 text-center">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 mx-auto flex items-center justify-center text-slate-600 mb-2">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="text-[11px] text-slate-500 font-semibold block">Max Branches</span>
            <p className="text-xl font-black text-slate-900 mt-0.5">{subscription?.maxBranches || 1}</p>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 mx-auto flex items-center justify-center text-slate-600 mb-2">
              <Smartphone className="h-4 w-4" />
            </div>
            <span className="text-[11px] text-slate-500 font-semibold block">Max Devices</span>
            <p className="text-xl font-black text-slate-900 mt-0.5">{subscription?.maxDevices || 3}</p>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 mx-auto flex items-center justify-center text-slate-600 mb-2">
              <Users className="h-4 w-4" />
            </div>
            <span className="text-[11px] text-slate-500 font-semibold block">Max Cashiers</span>
            <p className="text-xl font-black text-slate-900 mt-0.5">{subscription?.maxUsers || 5}</p>
          </div>
        </div>

        <p className="text-xs text-slate-500 text-center">
          Billed per tenant. Compliant with commercial licensing policy.
        </p>
      </div>
    </div>
  );
}

