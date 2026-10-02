'use client';

import React from 'react';
import { Sparkles, Check, Lock, ArrowRight, Star } from 'lucide-react';

interface PaywallBarrierProps {
  storyTitle: string;
  monthlyReads: number;
  readLimit: number;
  isSubscriberOnly?: boolean;
  onSubscribe: () => void;
  onSignIn: () => void;
}

export const PaywallBarrier: React.FC<PaywallBarrierProps> = ({
  monthlyReads,
  readLimit,
  isSubscriberOnly = false,
  onSubscribe,
  onSignIn,
}) => {
  const cappedReads = Math.min(monthlyReads, readLimit);
  const isLimitReached = monthlyReads >= readLimit;

  return (
    <div className="relative mt-2 pt-10 pb-8 px-6 sm:px-10 rounded-3xl bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Top Floating Badge */}
      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
        {isSubscriberOnly ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/30 text-amber-700 dark:text-amber-400">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>Subscriber Exclusive Investigation</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/10 dark:bg-blue-400/10 border border-blue-600/20 text-blue-600 dark:text-blue-400">
            <Lock className="w-3.5 h-3.5" />
            <span>Google News Showcase • Metered Access</span>
          </span>
        )}
      </div>

      <div className="max-w-lg mx-auto space-y-2.5">
        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {isSubscriberOnly
            ? 'Exclusive to GlobalPulse Subscribers'
            : isLimitReached
              ? "You've Reached Your Free Article Limit"
              : 'Support Independent Global Journalism'}
        </h3>
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          {isSubscriberOnly ? (
            <>
              This in-depth investigative dispatch is reserved exclusively for{' '}
              <strong className="text-slate-900 dark:text-white">
                GlobalPulse Digital subscribers
              </strong>
              . Subscribe today for unmetered access to verified investigations, autonomous AI
              dispatches, and neural audio briefings.
            </>
          ) : isLimitReached ? (
            <>
              You have read all{' '}
              <strong className="text-blue-600 dark:text-blue-400">
                {readLimit} of your {readLimit} free articles
              </strong>{' '}
              this month. Subscribe to GlobalPulse Digital for unmetered access to verified
              investigations, autonomous AI dispatches, and audio briefings.
            </>
          ) : (
            <>
              You have read <strong className="text-blue-600">{cappedReads}</strong> of your{' '}
              <strong className="text-slate-900 dark:text-white">{readLimit} free articles</strong>{' '}
              this month. Subscribe to GlobalPulse Digital for unmetered access to verified
              investigations, autonomous AI dispatches, and audio briefings.
            </>
          )}
        </p>
      </div>

      {/* Benefits Checklist */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
        <span className="flex items-center gap-1.5">
          <Check className="w-4 h-4 text-emerald-500" /> Unlimited Global Dispatches
        </span>
        <span className="flex items-center gap-1.5">
          <Check className="w-4 h-4 text-emerald-500" /> AI Neural Audio Briefings
        </span>
        <span className="flex items-center gap-1.5">
          <Check className="w-4 h-4 text-emerald-500" /> Archival Broadsheet PDFs
        </span>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onSubscribe}
          className="w-full sm:w-auto px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition cursor-pointer flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>
            {isSubscriberOnly
              ? 'Unlock Subscriber Access • $5 / Month'
              : 'Unlock Full Story • $5 / Month'}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={onSignIn}
          className="w-full sm:w-auto px-6 py-3 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
        >
          Already a subscriber? Sign in
        </button>
      </div>
    </div>
  );
};
