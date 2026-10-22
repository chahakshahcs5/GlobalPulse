'use client';

import React from 'react';
import type { SourceBlock, EntityBlock, RelatedStoriesBlock } from '@ai-news/schemas';
import { formatDeterministicDate } from '../date-utils';
import { BlockLink } from './runtime';

export const SourceBlockView: React.FC<{ data: SourceBlock['data'] }> = ({ data }) => {
  const pubSlug = data.publisher
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  /*
   * How the source is drawn.
   *
   * A source can be a card, a compact line, or a bare badge — the same
   * source, shown at a different weight depending on how much room the
   * story has for it.
   */
  const layout = data.layout ?? 'card';

  if (layout === 'badge') {
    return (
      <div className="my-3 flex items-center gap-2 text-xs">
        <BlockLink
          href={`/sources/${pubSlug}`}
          className="rounded px-2 py-0.5 font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 border border-slate-200 dark:border-indigo-500/20 transition-colors hover:bg-indigo-600/80 hover:text-white"
        >
          {data.publisher}
        </BlockLink>
        <span className="font-semibold text-slate-800 dark:text-slate-200">{data.title}</span>
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${data.title}`}
          className="ml-auto text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        >
          ↗
        </a>
      </div>
    );
  }

  if (layout === 'compact') {
    return (
      <div className="my-3 flex items-baseline gap-2 border-l-2 border-indigo-400 pl-3 text-xs">
        <BlockLink
          href={`/sources/${pubSlug}`}
          className="font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400"
        >
          {data.publisher}
        </BlockLink>
        <span className="text-slate-700 dark:text-slate-300">{data.title}</span>
        {data.publishedAt && (
          <span className="ml-auto font-mono text-slate-400 dark:text-slate-500">
            {formatDeterministicDate(data.publishedAt)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="my-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition-colors">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BlockLink
            href={`/sources/${pubSlug}`}
            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 hover:text-white hover:bg-indigo-600/80 border border-slate-200 dark:border-indigo-500/20 transition-colors"
            title={`View all coverage & sources from ${data.publisher}`}
          >
            {data.publisher}
          </BlockLink>
          {data.publishedAt && (
            <span className="text-xs text-slate-500 font-mono" suppressHydrationWarning>
              {formatDeterministicDate(data.publishedAt)}
            </span>
          )}
        </div>
        <h5 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{data.title}</h5>
        <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
          {data.sourceId}
        </span>
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
  /*
   * How the entity is drawn.
   *
   * An entity can be a card, a compact line, or a chip — the same entity,
   * at a different weight.
   */
  const layout = data.layout ?? 'card';

  if (layout === 'chip') {
    return (
      <div className="my-3 inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 py-1 pl-1 pr-3">
        {data.avatarUrl ? (
          <img
            src={data.avatarUrl}
            alt=""
            aria-hidden="true"
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
            {data.name.slice(0, 2).toUpperCase()}
          </span>
        )}
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          {data.name}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {data.type}
        </span>
      </div>
    );
  }

  if (layout === 'compact') {
    return (
      <div className="my-3 flex items-center gap-2.5">
        {data.avatarUrl ? (
          <img
            src={data.avatarUrl}
            alt=""
            aria-hidden="true"
            className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
            {data.name.slice(0, 2).toUpperCase()}
          </span>
        )}
        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{data.name}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 px-1.5 py-0.5 rounded">
          {data.type}
        </span>
      </div>
    );
  }

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
      <BlockLink
        href={`/entities/${data.entityId}`}
        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap cursor-pointer"
      >
        Profile →
      </BlockLink>
    </div>
  );
};

export const RelatedStoriesBlockView: React.FC<{ data: RelatedStoriesBlock['data'] }> = ({
  data,
}) => {
  /*
   * How the related stories are drawn.
   *
   * They can sit in a grid, in a list, or in a row that scrolls sideways.
   */
  const layout = data.layout ?? 'grid';

  if (layout === 'list') {
    return (
      <div className="my-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-5 shadow-sm">
        <h5 className="font-bold text-sm uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
          {data.title || 'Related Coverage'}
        </h5>
        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
          {data.storyIds.map((sId, idx) => (
            <li key={idx}>
              <BlockLink
                href={`/stories/${sId}`}
                className="flex items-center justify-between gap-3 py-2.5 group"
              >
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Story Dispatch: {sId}
                </span>
                <span className="text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-sm">
                  →
                </span>
              </BlockLink>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (layout === 'carousel') {
    return (
      <div className="my-8">
        <h5 className="font-bold text-sm uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
          {data.title || 'Related Coverage'}
        </h5>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {data.storyIds.map((sId, idx) => (
            <BlockLink
              key={idx}
              href={`/stories/${sId}`}
              className="shrink-0 w-64 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-indigo-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all flex flex-col gap-2 p-4 shadow-xs"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Story {idx + 1}
              </span>
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Story Dispatch: {sId}
              </span>
              <span className="text-slate-400 dark:text-slate-500 text-sm">→</span>
            </BlockLink>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="my-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-5 shadow-sm">
      <h5 className="font-bold text-sm uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
        {data.title || 'Related Coverage'}
      </h5>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.storyIds.map((sId, idx) => (
          <BlockLink
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
          </BlockLink>
        ))}
      </div>
    </div>
  );
};
