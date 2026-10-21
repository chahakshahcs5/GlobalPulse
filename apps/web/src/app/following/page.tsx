'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Bell, Layers, Newspaper, Rss, User } from 'lucide-react';
import { listFollowingResolved } from '@ai-news/api-client';
import { useMyNotifications } from '../../lib/news-store';
import { formatDeterministicDateTime } from '../../lib/date-utils';
import type { EditorialNotification } from '@ai-news/schemas';

interface ResolvedFollow {
  targetType: string;
  targetId: string;
  label: string;
  detail?: string;
  href?: string;
}

const TARGET_LABELS: Record<string, string> = {
  story: 'Story',
  cluster: 'Story cluster',
  topic: 'Topic',
  entity: 'Entity',
  author: 'Author',
  source: 'Source',
  event: 'Event',
};

const TARGET_ICONS: Record<string, React.ElementType> = {
  story: Newspaper,
  cluster: Layers,
  topic: Rss,
  entity: User,
  author: User,
  source: Rss,
  event: Layers,
};

/**
 * The reader's Following view.
 *
 * Shows what they follow and the developments on those stories. Following a
 * story also follows its cluster, so new articles in the same story appear
 * here automatically.
 */
export default function FollowingPage() {
  const [follows, setFollows] = useState<ResolvedFollow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { notifications } = useMyNotifications(20);

  useEffect(() => {
    let isMounted = true;

    listFollowingResolved()
      .then((records) => {
        if (!isMounted) return;
        setFollows(records);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const grouped = useMemo(() => {
    const byType = new Map<string, ResolvedFollow[]>();
    for (const record of follows) {
      const list = byType.get(record.targetType) ?? [];
      list.push(record);
      byType.set(record.targetType, list);
    }
    return Array.from(byType.entries());
  }, [follows]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Following
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Stories, clusters, and topics you follow. Following a story keeps you on the story as it
          evolves — new articles in the same cluster appear here automatically.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <Bell className="w-4 h-4" />
          Recent developments
        </h2>

        {notifications.length === 0 ? (
          <p className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 text-sm text-slate-500 dark:text-slate-400">
            No updates yet. Follow a story and its developments will show up here.
          </p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((notification: EditorialNotification) => (
              <li
                key={notification.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {notification.storyId ? (
                      <Link
                        href={`/stories/${notification.storyId}`}
                        className="font-semibold text-slate-900 dark:text-slate-100 hover:underline"
                      >
                        {notification.title}
                      </Link>
                    ) : (
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {notification.title}
                      </span>
                    )}
                    <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                      {notification.message}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] font-mono text-slate-400">
                    {formatDeterministicDateTime(notification.createdAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          What you follow
        </h2>

        {isLoading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
        ) : grouped.length === 0 ? (
          <p className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 text-sm text-slate-500 dark:text-slate-400">
            You are not following anything yet. Open a story and press Follow, or follow a topic,
            entity, or publication.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {grouped.map(([targetType, entries]) => {
              const Icon = TARGET_ICONS[targetType] ?? Rss;
              return (
                <div
                  key={targetType}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4"
                >
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                    <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    {TARGET_LABELS[targetType] ?? targetType}
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {entries.map((entry) => (
                      <li key={entry.targetId}>
                        {entry.href ? (
                          <Link
                            href={entry.href}
                            className="text-sm font-medium text-slate-800 dark:text-slate-200 hover:underline"
                          >
                            {entry.label}
                          </Link>
                        ) : (
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {entry.label}
                          </span>
                        )}
                        {entry.detail && (
                          <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                            {entry.detail}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
