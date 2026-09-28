'use client';

import type { Story } from '@ai-news/schemas';


export type FilterStatus = 'ALL' | 'IN_REVIEW' | 'PUBLISHED' | 'SCHEDULED' | 'DRAFT';

interface StoryFilterBarProps {
  filterStatus: FilterStatus;
  onSelectFilter: (status: FilterStatus) => void;
  stories: Story[];
}

export function StoryFilterBar({
  filterStatus,
  onSelectFilter,
  stories,
}: StoryFilterBarProps) {
  const inReviewCount = stories.filter((s) => s.status === 'IN_REVIEW').length;
  const publishedCount = stories.filter((s) => s.status === 'PUBLISHED').length;
  const scheduledCount = stories.filter((s) => s.status === 'SCHEDULED').length;
  const draftCount = stories.filter((s) => s.status === 'DRAFT').length;

  const tabs: { id: FilterStatus; label: string; hasBadge?: boolean }[] = [
    { id: 'ALL', label: `All (${stories.length})` },
    {
      id: 'IN_REVIEW',
      label: `Review Queue (${inReviewCount})`,
      hasBadge: inReviewCount > 0,
    },
    { id: 'PUBLISHED', label: `Published (${publishedCount})` },
    { id: 'SCHEDULED', label: `Scheduled (${scheduledCount})` },
    { id: 'DRAFT', label: `Drafts (${draftCount})` },
  ];

  const displayedCount = stories.filter((s) => filterStatus === 'ALL' || s.status === filterStatus).length;

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
        {displayedCount} stories displayed
      </span>
    </div>
  );
}
