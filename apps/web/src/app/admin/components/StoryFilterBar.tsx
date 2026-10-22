'use client';

import { Search, ArrowUpDown } from 'lucide-react';
import type { NewsroomMetrics } from '@ai-news/schemas';

export type FilterStatus = 'ALL' | 'IN_REVIEW' | 'PUBLISHED' | 'SCHEDULED' | 'DRAFT';

/** The orders the newsroom can ask for. */
export const STORY_SORTS: { id: string; label: string }[] = [
  { id: 'updated_desc', label: 'Recently edited' },
  { id: 'created_desc', label: 'Newest first' },
  { id: 'created_asc', label: 'Oldest first' },
  { id: 'title_asc', label: 'Title A–Z' },
  { id: 'title_desc', label: 'Title Z–A' },
  { id: 'status_asc', label: 'By status' },
];

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
  /** What the editor is searching for. */
  query: string;
  onQueryChange: (query: string) => void;
  /** The order the stories are in. */
  sort: string;
  onSortChange: (sort: string) => void;
}

export function StoryFilterBar({
  filterStatus,
  onSelectFilter,
  metrics,
  displayedCount,
  displayedTotal,
  query,
  onQueryChange,
  sort,
  onSortChange,
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
    <div className="border-b border-slate-200 dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-1 sm:gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onSelectFilter(tab.id)}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                filterStatus === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              {tab.hasBadge && (
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              )}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500">
          Showing {displayedCount} of {displayedTotal}
        </span>
      </div>

      {/*
        The search and the order.

        Both are the API's work: a newsroom of two hundred stories cannot be
        searched in the browser without fetching all two hundred, and the
        counts would be the counts of a page rather than of the newsroom.
      */}
      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 px-4 py-2.5 dark:border-slate-800">
        <div className="relative min-w-[16rem] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search the newsroom — a headline, a summary…"
            aria-label="Search the newsroom's stories"
            className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-2 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          <label htmlFor="story-sort" className="sr-only">
            Order the stories
          </label>
          <select
            id="story-sort"
            value={sort}
            onChange={(event) => onSortChange(event.target.value)}
            className="cursor-pointer rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-[12px] font-semibold text-slate-600 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300"
          >
            {STORY_SORTS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
