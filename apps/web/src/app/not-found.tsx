'use client';

import Link from 'next/link';
import { Home, Radio, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-xl w-full text-center space-y-8">
        {/* Brand Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
          <Radio className="w-8 h-8 text-white animate-pulse" />
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
            404 — Story Not Found
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            We couldn’t find that dispatch
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
            The article, topic, or archive file you requested might have been moved, updated with
            breaking developments, or withdrawn by the editorial desk.
          </p>
        </div>

        {/* Quick Links */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition"
          >
            <Home className="w-4 h-4" /> Top Stories
          </Link>
          <Link
            href="/category/technology"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
          >
            <Compass className="w-4 h-4" /> Technology
          </Link>
          <Link
            href="/category/business"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
          >
            Business & Markets
          </Link>
        </div>
      </div>
    </div>
  );
}
