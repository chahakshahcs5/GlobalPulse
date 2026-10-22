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
   * A card, a compact line, a bare badge, the passage the story leans
   * on, or an entry in a numbered reference list — the same source, shown
   * at a different weight depending on what it is doing in the story.
   */
  const layout = data.layout ?? 'card';

  const kindLabel: Record<string, string> = {
    report: 'Report',
    dataset: 'Dataset',
    testimony: 'Testimony',
    filing: 'Filing',
    article: 'Article',
    website: 'Website',
  };

  if (layout === 'quote' && data.excerpt) {
    return (
      <figure className="my-6 border-l-4 border-indigo-500 pl-4">
        <blockquote className="text-lg italic leading-relaxed text-slate-800 dark:text-slate-200">
          “{data.excerpt}”
        </blockquote>
        <figcaption className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-indigo-700 dark:text-indigo-400 hover:underline"
          >
            {data.title}
          </a>
          <span className="ml-2">{data.publisher}</span>
          {data.publishedAt && (
            <span className="ml-2 font-mono">{formatDeterministicDate(data.publishedAt)}</span>
          )}
        </figcaption>
      </figure>
    );
  }

  if (layout === 'reference') {
    return (
      <div className="my-4 flex gap-3 text-sm">
        <span className="font-mono font-bold text-slate-400 dark:text-slate-500 shrink-0">
          {data.referenceNumber ?? '—'}
        </span>
        <div className="min-w-0">
          <div className="text-slate-800 dark:text-slate-200">
            {data.publisher}
            {data.kind && (
              <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {kindLabel[data.kind]}
              </span>
            )}
          </div>
          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-400"
          >
            {data.title}
          </a>
          <div className="mt-0.5 text-[11px] font-mono text-slate-400 dark:text-slate-500">
            {data.publishedAt && formatDeterministicDate(data.publishedAt)}
            {data.accessedAt && (
              <span className="ml-2">Accessed {formatDeterministicDate(data.accessedAt)}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

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
          {data.kind && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              {kindLabel[data.kind]}
            </span>
          )}
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
   * A card, a compact line, a chip, a full profile, or a directory entry
   * — the same entity, at a different weight.
   */
  const layout = data.layout ?? 'card';

  if (layout === 'profile') {
    return (
      <section className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-5 p-5">
          {data.avatarUrl ? (
            <img
              src={data.avatarUrl}
              alt={data.name}
              className="w-24 h-24 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
            />
          ) : (
            <div className="w-24 h-24 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-2xl">
              {data.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h5 className="text-xl font-bold text-slate-900 dark:text-slate-100">{data.name}</h5>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                {data.type}
              </span>
            </div>
            {data.role && (
              <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
                {data.role}
              </p>
            )}
            {data.organization && (
              <p className="text-sm text-slate-500 dark:text-slate-400">{data.organization}</p>
            )}
            {data.description && (
              <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300 max-w-2xl">
                {data.description}
              </p>
            )}
            {data.links && data.links.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-3">
                {data.links.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 hover:underline"
                    >
                      {link.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (layout === 'directory') {
    return (
      <div className="my-4 flex items-start gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        {data.avatarUrl ? (
          <img
            src={data.avatarUrl}
            alt=""
            aria-hidden="true"
            className="h-10 w-10 shrink-0 rounded-full object-cover border border-slate-200 dark:border-slate-700"
          />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
            {data.name.slice(0, 2).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {data.name}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {data.type}
            </span>
            {data.role && (
              <span className="text-xs text-slate-500 dark:text-slate-400">{data.role}</span>
            )}
          </div>
          {data.organization && (
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              {data.organization}
            </span>
          )}
        </div>
      </div>
    );
  }

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
          {(data.role || data.organization) && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {[data.role, data.organization].filter(Boolean).join(' · ')}
            </p>
          )}
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
   * A grid, a list, a row that scrolls sideways, the first story given
   * the room, or a compact run of titles. The stories are the same; only
   * the treatment changes.
   */
  const layout = data.layout ?? 'grid';

  /*
   * Where the stories are named, they are drawn from the name. Where a
   * block carries only ids, the id stands in for the title.
   */
  const stories: Array<{
    id: string;
    title: string;
    summary?: string;
    topic?: string;
    publishedAt?: string;
  }> =
    data.stories && data.stories.length > 0
      ? data.stories
      : data.storyIds.map((id) => ({ id, title: `Story Dispatch: ${id}` }));

  const titleOf = (story: { title: string }) => story.title;

  if (layout === 'compact') {
    return (
      <div className="my-5">
        <h5 className="font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          {data.title || 'Related Coverage'}
        </h5>
        <ul className="space-y-1">
          {stories.map((story) => (
            <li key={story.id}>
              <BlockLink
                href={`/stories/${story.id}`}
                className="group flex items-baseline gap-2 text-sm"
              >
                <span className="text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {titleOf(story)}
                </span>
                {story.topic && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {story.topic}
                  </span>
                )}
              </BlockLink>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (layout === 'featured') {
    const [first, ...rest] = stories;
    return (
      <section className="my-8">
        <h5 className="font-bold text-sm uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
          {data.title || 'Related Coverage'}
        </h5>

        {first && (
          <article className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-5 shadow-sm">
            <BlockLink href={`/stories/${first.id}`} className="group block">
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {titleOf(first)}
              </h4>
            </BlockLink>
            {'summary' in first && first.summary && (
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400 max-w-2xl">
                {first.summary}
              </p>
            )}
            {'publishedAt' in first && first.publishedAt && (
              <p className="mt-2 font-mono text-[11px] text-slate-400 dark:text-slate-500">
                {formatDeterministicDate(first.publishedAt)}
              </p>
            )}
          </article>
        )}

        {rest.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rest.map((story) => (
              <article
                key={story.id}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-3"
              >
                <BlockLink href={`/stories/${story.id}`} className="group block">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {titleOf(story)}
                  </span>
                </BlockLink>
              </article>
            ))}
          </div>
        )}
      </section>
    );
  }

  if (layout === 'list') {
    return (
      <div className="my-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-5 shadow-sm">
        <h5 className="font-bold text-sm uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
          {data.title || 'Related Coverage'}
        </h5>
        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
          {stories.map((story) => (
            <li key={story.id}>
              <BlockLink
                href={`/stories/${story.id}`}
                className="flex items-center justify-between gap-3 py-2.5 group"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {titleOf(story)}
                  </span>
                  {'summary' in story && story.summary && (
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {story.summary}
                    </span>
                  )}
                </span>
                <span className="text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-sm shrink-0">
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
          {stories.map((story, idx) => (
            <BlockLink
              key={story.id}
              href={`/stories/${story.id}`}
              className="shrink-0 w-64 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-indigo-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all flex flex-col gap-2 p-4 shadow-xs"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Story {idx + 1}
              </span>
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {titleOf(story)}
              </span>
              {'summary' in story && story.summary && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  {story.summary}
                </span>
              )}
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
        {stories.map((story) => (
          <BlockLink
            key={story.id}
            href={`/stories/${story.id}`}
            className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-indigo-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all flex items-start justify-between gap-3 group shadow-xs"
          >
            <span className="min-w-0">
              <span className="block text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {titleOf(story)}
              </span>
              {'summary' in story && story.summary && (
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                  {story.summary}
                </span>
              )}
            </span>
            <span className="text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all text-sm shrink-0">
              →
            </span>
          </BlockLink>
        ))}
      </div>
    </div>
  );
};
