'use client';

import React from 'react';
import { FACT_CHECKS } from '../lib/news-data';
import { ShieldCheck } from 'lucide-react';

export const FactCheckWidget: React.FC = () => {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Fact Check by Independent Outlets</span>
        </div>
      </div>

      <div className="space-y-3">
        {FACT_CHECKS.map((fc) => (
          <div
            key={fc.id}
            className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5"
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-500">Claim by: {fc.claimant}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase tracking-wider ${
                  fc.rating === 'FALSE'
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
                }`}
              >
                {fc.rating}
              </span>
            </div>

            <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
              "{fc.claim}"
            </p>

            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {fc.summary}
            </p>

            <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
              <span>Verified by {fc.checker}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
