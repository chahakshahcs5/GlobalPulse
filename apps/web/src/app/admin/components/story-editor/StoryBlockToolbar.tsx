'use client';

import {
  Image as ImageIcon,
  BarChart2,
  Clock,
  Quote,
  Video,
  Table as TableIcon,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import type { MediaBlockDraft } from './types';

interface StoryBlockToolbarProps {
  onAddBlock: (type: MediaBlockDraft['type']) => void;
}

export function StoryBlockToolbar({ onAddBlock }: StoryBlockToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div>
        <h3 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
          Rich Media & Interactive Block Engine
        </h3>
        <p className="text-[11px] text-slate-500">
          Add supporting data charts, pull quotes, photo credits, timeline milestones, comparison
          tables, or callouts.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onAddBlock('image')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-100 transition cursor-pointer"
        >
          <ImageIcon className="w-3.5 h-3.5 text-blue-500" /> + Image
        </button>
        <button
          type="button"
          onClick={() => onAddBlock('chart')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-100 transition cursor-pointer"
        >
          <BarChart2 className="w-3.5 h-3.5 text-emerald-500" /> + Chart
        </button>
        <button
          type="button"
          onClick={() => onAddBlock('quote')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-100 transition cursor-pointer"
        >
          <Quote className="w-3.5 h-3.5 text-purple-500" /> + Quote
        </button>
        <button
          type="button"
          onClick={() => onAddBlock('timeline')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-100 transition cursor-pointer"
        >
          <Clock className="w-3.5 h-3.5 text-amber-500" /> + Timeline
        </button>
        <button
          type="button"
          onClick={() => onAddBlock('table')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-100 transition cursor-pointer"
        >
          <TableIcon className="w-3.5 h-3.5 text-cyan-500" /> + Table
        </button>
        <button
          type="button"
          onClick={() => onAddBlock('callout')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-100 transition cursor-pointer"
        >
          <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> + Callout
        </button>
        <button
          type="button"
          onClick={() => onAddBlock('statistic')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-100 transition cursor-pointer"
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> + Stat
        </button>
        <button
          type="button"
          onClick={() => onAddBlock('video')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-100 transition cursor-pointer"
        >
          <Video className="w-3.5 h-3.5 text-rose-500" /> + Video
        </button>
      </div>
    </div>
  );
}
