'use client';

import type { Story } from '@ai-news/schemas';

interface AdminMetricsBarProps {
  stories: Story[];
  onSweepScheduled: () => Promise<void>;
}

export function AdminMetricsBar({ stories, onSweepScheduled }: AdminMetricsBarProps) {
  const inReviewCount = stories.filter((s) => s.status === 'IN_REVIEW').length;
  const publishedCount = stories.filter((s) => s.status === 'PUBLISHED').length;
  const scheduledCount = stories.filter((s) => s.status === 'SCHEDULED').length;
  const draftCount = stories.filter((s) => s.status === 'DRAFT').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="text-xs text-slate-500">Total Stories</div>
        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
          {stories.length}
        </div>
      </div>

      <div
        className={`p-4 rounded-xl border bg-white dark:bg-slate-900 shadow-xs ${
          inReviewCount > 0
            ? 'border-amber-400 dark:border-amber-600 bg-amber-50/30'
            : 'border-slate-200 dark:border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-bold">
          <span>Review Queue</span>
          {inReviewCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          )}
        </div>
        <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
          {inReviewCount}
        </div>
      </div>

      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="text-xs text-emerald-600">Published Live</div>
        <div className="text-2xl font-bold text-emerald-600 mt-1">{publishedCount}</div>
      </div>

      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="flex items-center justify-between text-xs text-purple-600 dark:text-purple-400 font-bold">
          <span>Scheduled</span>
          {scheduledCount > 0 && (
            <button
              onClick={() => onSweepScheduled()}
              className="text-[10px] underline hover:text-purple-700 cursor-pointer"
              title="Publish due stories now"
            >
              Sweep
            </button>
          )}
        </div>
        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
          {scheduledCount}
        </div>
      </div>

      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="text-xs text-slate-400">Drafts</div>
        <div className="text-2xl font-bold text-slate-500 dark:text-slate-400 mt-1">
          {draftCount}
        </div>
      </div>
    </div>
  );
}
