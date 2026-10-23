'use client';

import React from 'react';
import type { Comment, LiveCommentsBlock } from '@ai-news/schemas';
import { useBlockRuntime } from './runtime';
import { formatDeterministicDate } from '../date-utils';

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
  const runtime = useBlockRuntime();
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [isLoading, setIsLoading] = React.useState(Boolean(storyId));

  /*
   * The thread the story was published with.
   *
   * It is the floor the block stands on: the server's comments are merged
   * over the top of it when they arrive, and it is what the block shows
   * when they never do — in the studio, and in a story republished away
   * from its server.
   */
  const snapshot = React.useMemo(() => data.comments ?? [], [data.comments]);

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

    runtime
      .getStoryComments(storyId)
      .then((loaded) => {
        if (!cancelled) setComments(loaded);
      })
      .catch(() => {
        // The snapshot in the payload is what the reader sees instead.
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [storyId, runtime]);

  // Keep it live.
  React.useEffect(() => {
    if (!storyId) return;

    const unsubscribe = runtime.subscribeToRealtimeEvents([`story_${storyId}`], (event) => {
      if (event.type !== 'comment.created') return;
      const payload = event.data as { storyId?: string; comment?: Comment } | undefined;
      if (!payload?.comment || payload.storyId !== storyId) return;
      applyComment(payload.comment);
    });

    return unsubscribe;
  }, [storyId, applyComment, runtime]);

  const visible = React.useMemo(() => {
    /*
     * The snapshot and the live thread are one thread.
     *
     * A comment that arrived while the reader was on the page is the same
     * comment as one that was there when the story was published, so the
     * two are merged rather than one replacing the other.
     */
    const merged = new Map<string, Comment>();
    for (const comment of snapshot) merged.set(comment.id, comment);
    for (const comment of comments) merged.set(comment.id, comment);

    const filtered = roleFilter?.length
      ? [...merged.values()].filter((c) => roleFilter.includes(c.authorRole))
      : [...merged.values()];
    // Only approved comments are shown to readers.
    return filtered
      .filter((c) => c.status === 'approved')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, data.maxComments ?? 10);
  }, [snapshot, comments, roleFilter, data.maxComments]);

  if (!storyId && snapshot.length === 0) return null;

  /*
   * How the discussion is drawn.
   *
   * The comments can be a list, a thread with replies indented under the
   * comment they answer, or a compact run of one-line excerpts. The
   * comments are the same; only the treatment changes.
   */
  const layout = data.layout ?? 'list';

  const isThread = layout === 'thread';

  return (
    <section
      aria-label={data.title}
      className={`my-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden ${
        layout === 'compact' ? 'rounded-lg' : 'rounded-2xl'
      }`}
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
      ) : layout === 'compact' ? (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {visible.map((comment) => (
            <li key={comment.id} className="flex items-baseline gap-2 px-5 py-2">
              <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 shrink-0">
                {comment.authorName}
              </span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                {comment.content}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {visible.map((comment) => {
            /*
             * A reply is a comment that answers another one. In the thread
             * treatment it is drawn indented under the comment it answers,
             * with a rule joining the two.
             */
            const isReply = Boolean(comment.parentId);
            return (
              <li
                key={comment.id}
                className={`px-5 py-3 ${isThread && isReply ? 'pl-12 border-l-2 border-slate-100 dark:border-slate-800 ml-5' : ''}`}
              >
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
            );
          })}
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
