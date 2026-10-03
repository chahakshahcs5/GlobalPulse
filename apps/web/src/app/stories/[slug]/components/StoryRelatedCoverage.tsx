'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import type { Story } from '@ai-news/schemas';
import { formatDeterministicDate } from '../../../../lib/date-utils';

interface StoryRelatedCoverageProps {
  relatedStories: Story[];
}

export function StoryRelatedCoverage({ relatedStories }: StoryRelatedCoverageProps) {
  if (relatedStories.length === 0) return null;

  return (
    <section className="pt-8 mt-10 border-t border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Related Coverage & Further Reading</span>
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {relatedStories.map((rel) => (
          <Link
            key={rel.id}
            href={`/stories/${rel.slug}`}
            className="group p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:shadow-md transition space-y-2 block"
          >
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-bold text-blue-600 uppercase">
                {rel.articleType.replace('_', ' ')}
              </span>
              <span suppressHydrationWarning>{formatDeterministicDate(rel.publishedAt)}</span>
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 line-clamp-2">
              {rel.title}
            </h4>
            <p className="text-xs text-slate-500 line-clamp-2">{rel.summary}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
