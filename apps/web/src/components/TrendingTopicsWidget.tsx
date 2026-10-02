'use client';

import React, { useEffect, useState } from 'react';
import { listTopics, getTrendingStories } from '../lib/api-client';
import { TrendingUp, Hash } from 'lucide-react';

interface TrendingTopicsWidgetProps {
  onSelectTopic?: (topic: string) => void;
}

export const TrendingTopicsWidget: React.FC<TrendingTopicsWidgetProps> = ({ onSelectTopic }) => {
  const [topics, setTopics] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([listTopics(), getTrendingStories(5)])
      .then(([topicsList, trendingList]) => {
        if (!isMounted) return;
        const items: Array<{ id: string; name: string; slug: string }> = [];

        if (Array.isArray(topicsList) && topicsList.length > 0) {
          for (const t of topicsList) {
            items.push({ id: t.id, name: t.name, slug: t.slug || t.name });
          }
        }

        if (Array.isArray(trendingList)) {
          for (const tr of trendingList) {
            if (tr.title && !items.some((i) => i.name === tr.title)) {
              items.push({
                id: tr.storyId || (tr as { id?: string }).id || tr.slug,
                name: tr.title,
                slug: tr.slug || tr.storyId,
              });
            }
          }
        }

        setTopics(items.slice(0, 8));
        setIsLoading(false);
      })
      .catch(() => {
        if (isMounted) {
          setTopics([]);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isLoading && topics.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
        <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span>In the News</span>
      </div>

      {isLoading ? (
        <div className="flex flex-wrap gap-1.5 animate-in fade-in duration-200">
          {[72, 88, 64, 96, 76, 84].map((width, idx) => (
            <div
              key={idx}
              className="h-6.5 bg-slate-200/80 dark:bg-slate-800/80 rounded-full animate-shimmer"
              style={{ width: `${width}px` }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => onSelectTopic?.(topic.slug)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700/80 transition cursor-pointer"
            >
              <Hash className="w-3 h-3 text-slate-400" />
              <span>{topic.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
