'use client';

import React from 'react';
import Link from 'next/link';
import type { SourceBlock, EntityBlock, RelatedStoriesBlock } from '@ai-news/schemas';
import { formatDeterministicDate } from '../../lib/date-utils';

export const SourceBlockView: React.FC<{ data: SourceBlock['data'] }> = ({ data }) => {
  const pubSlug = data.publisher
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return (
    <div className="my-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition-colors">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link
            href={`/sources/${pubSlug}`}
            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 hover:text-white hover:bg-indigo-600/80 border border-slate-200 dark:border-indigo-500/20 transition-colors"
            title={`View all coverage & sources from ${data.publisher}`}
          >
            {data.publisher}
          </Link>
          {data.publishedAt && (
            <span className="text-xs text-slate-500 font-mono" suppressHydrationWarning>
              {formatDeterministicDate(data.publishedAt)}
            </span>
          )}
        </div>
        <h5 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{data.title}</h5>
      </div>
      <a
        href={data.url}
        target="_blank"
        rel="noopener noreferrer"
        className="self-start sm:self-center px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
      >
        <span>View Primary Source</span>
        <span className="text-slate-400">↗</span>
      </a>
    </div>
  );
};

export const EntityBlockView: React.FC<{ data: EntityBlock['data'] }> = ({ data }) => {
  return (
    <div className="my-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 flex items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center gap-3.5">
        {data.avatarUrl ? (
          <img
            src={data.avatarUrl}
            alt={data.name}
            className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
            {data.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h5 className="font-bold text-base text-slate-900 dark:text-slate-100">{data.name}</h5>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
              {data.type}
            </span>
          </div>
          {data.description && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2 max-w-xl">
              {data.description}
            </p>
          )}
        </div>
      </div>
      <Link
        href={`/entities/${data.entityId}`}
        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap cursor-pointer"
      >
        Profile →
      </Link>
    </div>
  );
};

export const RelatedStoriesBlockView: React.FC<{ data: RelatedStoriesBlock['data'] }> = ({
  data,
}) => {
  return (
    <div className="my-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-5 shadow-sm">
      <h5 className="font-bold text-sm uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
        {data.title || 'Related Coverage'}
      </h5>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.storyIds.map((sId, idx) => (
          <Link
            key={idx}
            href={`/stories/${sId}`}
            className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-indigo-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all flex items-center justify-between group shadow-xs"
          >
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Story Dispatch: {sId}
            </span>
            <span className="text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all text-sm">
              →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};
