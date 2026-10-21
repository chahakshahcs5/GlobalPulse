'use client';

import type { NewsroomMetrics } from '@ai-news/schemas';

interface AdminMetricsBarProps {
  /**
   * The newsroom's metrics, as the API counts them.
   *
   * These are the counts of the whole newsroom, not of the page of stories
   * that happens to be on screen. A newsroom with 202 stories and a table
   * showing the first 50 has 202 stories, and the number in the corner has
   * to say so.
   */
  metrics: NewsroomMetrics;
  onSweepScheduled: () => Promise<void>;
}

export function AdminMetricsBar({ metrics, onSweepScheduled }: AdminMetricsBarProps) {
  const inReviewCount = metrics.reviewQueueCount;
  const publishedCount = metrics.publishedStories;
  const scheduledCount = metrics.scheduledStoriesCount;
  const draftCount = metrics.draftStories;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="text-xs text-slate-500">Total Stories</div>
        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
          {metrics.totalStories}
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
        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
          {publishedCount}
        </div>
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
