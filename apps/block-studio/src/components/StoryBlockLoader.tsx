'use client';

import React from 'react';
import { Loader2, Search, X } from 'lucide-react';
import type { Story, StoryBlock } from '@ai-news/schemas';
import { NewsroomApiError, apiToken, searchStories, setApiToken } from '../lib/newsroom-api';

/** Where a loaded block came from, so it can be saved back. */
export interface BlockSource {
  storyId: string;
  storyTitle: string;
  blockId: string;
}

const PAGE_SIZE = 20;

/**
 * Load a real block from a live story.
 *
 * The studio is at its most useful when it is pointed at real content: an
 * editor can see how a block that is already live actually reads, change it,
 * and take the corrected payload back to the story.
 */
export function StoryBlockLoader({
  onClose,
  onLoad,
}: {
  onClose: () => void;
  onLoad: (blockType: string, data: Record<string, unknown>, source: BlockSource) => void;
}) {
  const [stories, setStories] = React.useState<Story[]>([]);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [state, setState] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [searching, setSearching] = React.useState(false);
  const [offset, setOffset] = React.useState(0);
  const [total, setTotal] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [token, setToken] = React.useState('');

  // The token is kept in the browser, so it is not baked into the app.
  React.useEffect(() => {
    setToken(apiToken());
  }, []);

  const load = React.useCallback(async (search: string, start: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setSearching(true);
    try {
      const page = await searchStories(search, start, PAGE_SIZE);
      setStories((current) => (append ? [...current, ...page.items] : page.items));
      setTotal(page.total);
      setHasMore(page.hasMore);
      setOffset(start + page.items.length);
      setState('ready');
      setError(null);
      if (!append && page.items.length > 0) {
        setExpanded((current) => current ?? page.items[0].id);
      }
    } catch (cause) {
      setState('error');
      setError(
        cause instanceof NewsroomApiError
          ? cause.message
          : cause instanceof Error
            ? cause.message
            : 'The stories could not be loaded.'
      );
    } finally {
      setSearching(false);
      setLoadingMore(false);
    }
  }, []);

  // The first load, and every search, go through the API rather than
  // filtering a list the studio already has.
  React.useEffect(() => {
    const handle = setTimeout(
      () => {
        void load(query, 0, false);
      },
      query.trim().length === 0 ? 0 : 250
    );
    return () => clearTimeout(handle);
  }, [query, load]);

  const toggle = (storyId: string) =>
    setExpanded((current) => (current === storyId ? null : storyId));

  const load_ = (block: StoryBlock, story: Story) => {
    onLoad(block.blockType, block.data as Record<string, unknown>, {
      storyId: story.id,
      storyTitle: story.title,
      blockId: block.id,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 p-6 backdrop-blur-sm">
      <div className="mt-10 flex max-h-[78vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0d1220]">
        <div className="border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Load a block from a live story
              </h2>
              <p className="text-[11px] text-slate-500">
                Pick a block to open it in the editor. You can save it back afterwards.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search stories by title or summary…"
              aria-label="Search stories"
              className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            {searching && (
              <Loader2 className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-slate-400" />
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {state === 'loading' && (
            <p className="flex items-center gap-2 px-3 py-6 text-xs text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading stories…
            </p>
          )}

          {state === 'error' && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-3 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              <p className="font-bold">The stories could not be loaded.</p>
              <p className="mt-1">{error}</p>
              <p className="mt-1 opacity-80">
                The studio reads the newsroom API. Check that it is running, and that a token is set
                if the API requires one.
              </p>
            </div>
          )}

          {state === 'ready' && stories.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-slate-500">
              {query.trim().length > 0
                ? `No story matches “${query.trim()}”.`
                : 'There are no stories yet.'}
            </p>
          )}

          {state === 'ready' &&
            stories.map((story) => {
              const blocks = story.blocks ?? [];
              const isOpen = expanded === story.id;
              return (
                <div
                  key={story.id}
                  className="mb-2 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800"
                >
                  <button
                    type="button"
                    onClick={() => toggle(story.id)}
                    className="flex w-full items-center justify-between gap-3 bg-slate-50 px-3 py-2 text-left transition-colors hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800/60"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                        {story.title}
                      </span>
                      <span className="block font-mono text-[10px] text-slate-400">
                        {story.status} · {blocks.length} block{blocks.length === 1 ? '' : 's'} ·{' '}
                        {story.slug}
                      </span>
                    </span>
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {isOpen ? 'Hide' : 'Show'}
                    </span>
                  </button>

                  {isOpen && (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                      {blocks.map((block) => (
                        <li key={block.id}>
                          <button
                            type="button"
                            onClick={() => load_(block, story)}
                            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-blue-50 dark:hover:bg-blue-500/10"
                          >
                            <span className="font-mono text-[12px] text-slate-700 dark:text-slate-200">
                              {block.blockType}
                            </span>
                            <span className="truncate text-[11px] text-slate-400">
                              {summarise(block)}
                            </span>
                          </button>
                        </li>
                      ))}
                      {blocks.length === 0 && (
                        <li className="px-3 py-2 text-[11px] text-slate-400">No blocks yet.</li>
                      )}
                    </ul>
                  )}
                </div>
              );
            })}
        </div>

        {state === 'ready' && stories.length > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-2.5 text-[11px] text-slate-500 dark:border-slate-800">
            <span>
              Showing {stories.length} of {total} stor{total === 1 ? 'y' : 'ies'}
            </span>
            {hasMore && (
              <button
                type="button"
                onClick={() => void load(query, offset, true)}
                disabled={loadingMore}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:text-white"
              >
                {loadingMore && <Loader2 className="h-3 w-3 animate-spin" />}
                Load more
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 border-t border-slate-200 bg-slate-50 px-5 py-2.5 dark:border-slate-800 dark:bg-slate-900/50">
          <label
            htmlFor="api-token"
            className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-500"
          >
            API token
          </label>
          <input
            id="api-token"
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            onBlur={() => setApiToken(token)}
            placeholder="Bearer dev-editor — needed to save, and to read a protected API"
            aria-label="API token"
            className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 py-1 font-mono text-[11px] text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:placeholder:text-slate-500"
          />
        </div>
      </div>
    </div>
  );
}

/** A short description of a block, so the list is readable at a glance. */
function summarise(block: StoryBlock): string {
  const data = block.data as Record<string, unknown>;
  const title = data.title ?? data.headline ?? data.quote ?? data.altText ?? data.text;
  if (typeof title === 'string' && title.length > 0) {
    return title.length > 70 ? `${title.slice(0, 70)}…` : title;
  }
  if (Array.isArray(data.items)) return `${data.items.length} items`;
  if (Array.isArray(data.values)) return `${data.values.length} values`;
  return '';
}
