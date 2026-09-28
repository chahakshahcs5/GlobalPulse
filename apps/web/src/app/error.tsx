'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log exception to local observability logger
    console.error('Unhandled Web Application Exception:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Something unexpected occurred
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            We encountered a temporary disruption while assembling this dispatch feed.
          </p>
          {error.message && (
            <div className="mt-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300 text-left overflow-x-auto">
              {error.message}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 pt-2 text-xs font-semibold">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
          >
            <Home className="w-3.5 h-3.5" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
