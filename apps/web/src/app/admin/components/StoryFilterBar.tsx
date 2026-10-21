'use client';

import type { NewsroomMetrics } from '@ai-news/schemas';

export type FilterStatus = 'ALL' | 'IN_REVIEW' | 'PUBLISHED' | 'SCHEDULED' | 'DRAFT';

interface StoryFilterBarProps {
  filterStatus: FilterStatus;
  onSelectFilter: (status: FilterStatus) => void;
  /**
   * The newsroom's counts, as the API counts them.
   *
   * These are the counts of the whole newsroom. Counting the page on screen
   * would say "0 drafts" about a newsroom with twelve, because none of the
   * drafts happened to be on the page that was fetched.
   */
  metrics: NewsroomMetrics;
  /** How many stories are on screen right now. */
  displayedCount: number;
  /** How many stories there are, for the filter that is showing. */
  displayedTotal: number;
}

export function StoryFilterBar({
  filterStatus,
  onSelectFilter,
  metrics,
  displayedCount,
  displayedTotal,
}: StoryFilterBarProps) {
  const inReviewCount = metrics.reviewQueueCount;
  const publishedCount = metrics.publishedStories;
  const scheduledCount = metrics.scheduledStoriesCount;
  const draftCount = metrics.draftStories;

  const tabs: { id: FilterStatus; label: string; hasBadge?: boolean }[] = [
    { id: 'ALL', label: `All (${metrics.totalStories})` },
    {
      id: 'IN_REVIEW',
      label: `Review Queue (${inReviewCount})`,
      hasBadge: inReviewCount > 0,
    },
    { id: 'PUBLISHED', label: `Published (${publishedCount})` },
    { id: 'SCHEDULED', label: `Scheduled (${scheduledCount})` },
    { id: 'DRAFT', label: `Drafts (${draftCount})` },
  ];

  return (
    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1 sm:gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSelectFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterStatus === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>{tab.label}</span>
            {tab.hasBadge && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            )}
          </button>
        ))}
      </div>
      <span className="text-xs text-slate-500">
        Showing {displayedCount} of {displayedTotal}
      </span>
    </div>
  );
}
