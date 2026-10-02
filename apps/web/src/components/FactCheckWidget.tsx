'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { listFactChecks } from '../lib/api-client';
import { ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
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

  const displayedChecks = factChecks.slice(0, 3);

  const getRatingBadge = (ratingRaw?: string) => {
    const r = (ratingRaw || 'UNVERIFIED').toUpperCase();
    if (r === 'FALSE' || r === 'MOSTLY_FALSE') {
      return {
        label: r.replace('_', ' '),
        className:
          'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900',
      };
    }
    if (r === 'TRUE' || r === 'MOSTLY_TRUE') {
      return {
        label: r.replace('_', ' '),
        className:
          'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900',
      };
    }
    if (r === 'MIXTURE') {
      return {
        label: 'MIXTURE',
        className:
          'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900',
      };
    }
    return {
      label: 'UNVERIFIED',
      className:
        'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    };
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Independent Fact Check Bureau</span>
        </div>
        <Link
          href="/fact-checks"
          className="group inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors whitespace-nowrap"
          title="Explore all verified claims and investigative debunks"
        >
          <span>Explore All</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-2 animate-pulse">
          <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl" />
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

      {!isLoading && displayedChecks.length > 0 && (
        <div className="space-y-3">
          {displayedChecks.map((fc: FactCheckItem) => {
            const badge = getRatingBadge(fc.verdict || fc.rating);
            return (
              <Link
                key={fc.id}
                href={`/fact-checks#${fc.id}`}
                className="block p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/90 dark:hover:bg-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700 space-y-1.5 transition-all group"
              >
                <div className="flex items-center justify-between text-[11px] gap-2">
                  <span className="font-semibold text-slate-500 dark:text-slate-400 truncate">
                    Claim by: {fc.claimant || 'External Source'}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  "{fc.claim}"
                </p>

                {(fc.explanation || fc.summary) && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                    {fc.explanation || fc.summary}
                  </p>
                )}

                <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                  <span>Verified by {fc.checker || 'FactCheck Bureau'}</span>
                  <span className="text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                    View Dossier →
                  </span>
                </div>
              </Link>
            );
          })}

          {factChecks.length > 3 && (
            <Link
              href="/fact-checks"
              className="flex items-center justify-center gap-1.5 w-full py-2.5 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200/90 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200/60 dark:border-slate-700/60 rounded-xl transition-all shadow-sm group"
            >
              <span>Explore All {factChecks.length} Verified Claims</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
};
