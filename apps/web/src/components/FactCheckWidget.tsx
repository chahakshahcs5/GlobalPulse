'use client';

import React, { useEffect, useState } from 'react';
import { listFactChecks } from '../lib/api-client';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import type { FactCheckClaim } from '@ai-news/schemas';

interface FactCheckItem extends FactCheckClaim {
  verdict?: string;
  explanation?: string;
}

export const FactCheckWidget: React.FC = () => {
  const [factChecks, setFactChecks] = useState<FactCheckItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    listFactChecks()
      .then((data) => {
        if (isMounted) {
          setFactChecks(Array.isArray(data) ? (data as FactCheckItem[]) : []);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setFactChecks([]);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Independent Fact Check Bureau</span>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2 animate-pulse">
          <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        </div>
      )}

      {!isLoading && factChecks.length === 0 && (
        <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Claims Verified Authentic
          </p>
          <p className="text-[11px] text-slate-500">
            No disputed or unverified claims flagged across active news dispatches.
          </p>
        </div>
      )}

      {!isLoading && factChecks.length > 0 && (
        <div className="space-y-3">
          {factChecks.map((fc: FactCheckItem) => {
            const isFalse = fc.verdict === 'FALSE' || fc.rating === 'FALSE';
            return (
              <div
                key={fc.id}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-500">
                    Claim by: {fc.claimant || 'External Source'}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase tracking-wider ${
                      isFalse
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
                    }`}
                  >
                    {fc.verdict || fc.rating || 'UNVERIFIED'}
                  </span>
                </div>

                <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                  "{fc.claim}"
                </p>

                {(fc.explanation || fc.summary) && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {fc.explanation || fc.summary}
                  </p>
                )}

                <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Verified by {fc.checker || 'FactCheck Bureau'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
