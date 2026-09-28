'use client';

import Link from 'next/link';

import { PlusCircle, Radio } from 'lucide-react';

interface AdminHeaderProps {
  isApiConnected: boolean;
  isEditorOpen: boolean;
  onToggleEditor: () => void;
}

export function AdminHeader({ isApiConnected, isEditorOpen, onToggleEditor }: AdminHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          <Radio className="w-4 h-4 animate-pulse text-rose-500" />
          <span>Autonomous Newsroom & Editorial CMS</span>
          <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {isApiConnected ? 'Gateway Connected (SSE Live)' : 'Local Engine'}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
          GlobalPulse Newsroom Control Center
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Real-time human-AI collaborative journalism: authoring, embargo scheduling, virality
          analytics, and breaking broadcasts.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 transition"
        >
          ← View Reader Feed
        </Link>
        <button
          onClick={onToggleEditor}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{isEditorOpen ? 'Close Editor' : '+ Write New Story'}</span>
        </button>
      </div>
    </div>
  );
}
