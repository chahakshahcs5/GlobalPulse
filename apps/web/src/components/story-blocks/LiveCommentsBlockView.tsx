'use client';

import React from 'react';
import type { Comment, LiveCommentsBlock } from '@ai-news/schemas';
import { getStoryComments, subscribeToRealtimeEvents } from '../../lib/api-client';
import { formatDeterministicDate } from '../../lib/date-utils';

/**
 * Reader comments inside the article body.
 *
 * The thread is fetched on mount and then kept live over the story's realtime
 * channel, so a comment posted while the reader is mid-article appears
 * without a refresh.
 */
export const LiveCommentsBlockView: React.FC<{
  data: LiveCommentsBlock['data'];
  storyId?: string;
}> = ({ data, storyId }) => {
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [isLoading, setIsLoading] = React.useState(Boolean(storyId));

  const roleFilter = data.roles;

  const applyComment = React.useCallback((comment: Comment) => {
    setComments((prev) => {
      if (prev.some((c) => c.id === comment.id)) return prev;
      return [...prev, comment];
    });
  }, []);

  // Load the existing thread.
  React.useEffect(() => {
    if (!storyId) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;

    getStoryComments(storyId)
      .then((loaded) => {
        if (!cancelled) setComments(loaded);
      })
      .catch(() => {
        // Leave the block empty rather than showing an error in the article.
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [storyId]);

  // Keep it live.
  React.useEffect(() => {
    if (!storyId) return;

    const unsubscribe = subscribeToRealtimeEvents([`story_${storyId}`], (event) => {
      if (event.type !== 'comment.created') return;
      const payload = event.data as { storyId?: string; comment?: Comment } | undefined;
      if (!payload?.comment || payload.storyId !== storyId) return;
      applyComment(payload.comment);
    });

    return unsubscribe;
  }, [storyId, applyComment]);

  const visible = React.useMemo(() => {
    const filtered = roleFilter?.length
      ? comments.filter((c) => roleFilter.includes(c.authorRole))
      : comments;
    // Only approved comments are shown to readers.
    return filtered
      .filter((c) => c.status === 'approved')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, data.maxComments ?? 10);
  }, [comments, roleFilter, data.maxComments]);

  if (!storyId) return null;

  return (
    <section
      aria-label={data.title}
      className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden"
    >
      <header className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
          {data.description && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{data.description}</p>
          )}
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Live
        </span>
      </header>

      {isLoading ? (
        <p className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">Loading comments…</p>
      ) : visible.length === 0 ? (
        <p className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">
          No comments yet. Start the discussion below the story.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {visible.map((comment) => (
            <li key={comment.id} className="px-5 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {comment.authorName}
                </span>
                <span
                  className="text-[10px] text-slate-400 dark:text-slate-500"
                  suppressHydrationWarning
                >
                  {formatDeterministicDate(comment.createdAt)}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {comment.content}
              </p>
            </li>
          ))}
        </ul>
      )}

      {data.showCta && (
        <footer className="px-5 py-3 border-t border-slate-200 dark:border-slate-800">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Join the discussion in the comments below the story.
          </p>
        </footer>
      )}
    </section>
  );
};
