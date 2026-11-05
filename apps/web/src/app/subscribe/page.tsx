'use client';

import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';

const BENEFITS = [
  'Unlimited access to every dispatch and investigation',
  'Subscriber-only investigations and data journalism',
  'Neural audio briefings and archival PDF exports',
  'Metered paywall removed across all your devices',
];

export default function SubscribePage() {
  const checkoutUrl = process.env.NEXT_PUBLIC_SUBSCRIPTION_URL;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-600/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          <Sparkles className="h-3.5 w-3.5" />
          GlobalPulse Digital
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Subscribe for unmetered access
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Subscriptions are billed by the configured payment provider. Entitlement is granted
          server-side by the billing webhook, so it follows your account across devices and cannot
          be reset by clearing browser storage.
        </p>

        <ul className="mt-6 space-y-3">
          {BENEFITS.map((benefit) => (
            <li
              key={benefit}
              className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
            >
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {checkoutUrl ? (
            <a
              href={checkoutUrl}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-center text-sm font-bold text-white hover:bg-blue-700"
            >
              Continue to secure checkout
            </a>
          ) : (
            <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              Checkout is not configured for this deployment. Set{' '}
              <code className="font-mono">NEXT_PUBLIC_SUBSCRIPTION_URL</code> and configure the
              billing webhook.
            </p>
          )}
          <Link
            href="/login"
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-center text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Already a subscriber? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
