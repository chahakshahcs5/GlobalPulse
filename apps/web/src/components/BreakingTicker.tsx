'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { listNotifications, listStories } from '../lib/api-client';
import type { Story } from '@ai-news/schemas';

interface TickerItem {
  id: string;
  topic: string;
  headline: string;
  slug: string;
  timeAgo: string;
}

export const BreakingTicker: React.FC<{ items?: TickerItem[] }> = ({ items: initialItems }) => {
  const [items, setItems] = useState<TickerItem[]>(initialItems || []);

  useEffect(() => {
    let isMounted = true;

    async function loadTickerData() {
      try {
        const notifs = await listNotifications(5);
        if (isMounted && Array.isArray(notifs) && notifs.length > 0) {
          const liveItems: TickerItem[] = notifs.map((n) => ({
            id: n.id,
            topic: n.type === 'breaking_news' ? 'ALERT' : 'WIRE',
            headline: n.message || n.title,
            slug: n.storyId || '',
            timeAgo: 'LIVE',
          }));
          setItems(liveItems);
          return;
        }

        // If no urgent notifications, use latest published stories from the database
        const stories = await listStories({ status: 'PUBLISHED', limit: 4 });
        if (isMounted && Array.isArray(stories) && stories.length > 0) {
          const storyItems: TickerItem[] = stories.map((s: Story) => ({
            id: s.id,
            topic: (s.articleType || 'DISPATCH').replace('_', ' ').toUpperCase(),
            headline: s.title,
            slug: s.slug,
            timeAgo: 'LATEST',
          }));
          setItems(storyItems);
          return;
        }

        if (isMounted) {
          setItems([]);
        }
      } catch {
        if (isMounted) {
          setItems([]);
        }
      }
    }

    loadTickerData();

    return () => {
      isMounted = false;
    };
  }, []);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-950 border-b border-slate-800/80 overflow-hidden h-9 flex items-center select-none text-xs">
      {/* Fixed Breaking Badge */}
      <div className="z-10 bg-rose-600 text-white font-extrabold px-3 py-1 uppercase tracking-wider flex items-center gap-1.5 h-full shrink-0 shadow-md">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
        BREAKING
      </div>

      {/* Marquee Ticker Track */}
      <div className="overflow-hidden whitespace-nowrap flex-1">
        <div className="ticker-track breaking-marquee-track">
          {[...items, ...items].map((item, idx) => (
            <Link
              key={`${item.id}-${idx}`}
              href={item.slug ? `/stories/${item.slug}` : '/'}
              className="inline-flex items-center gap-2 mx-6 text-slate-300 hover:text-blue-400 transition cursor-pointer"
            >
              <span className="font-bold text-slate-400 font-mono uppercase tracking-wider text-[11px]">
                [{item.topic}]
              </span>
              <span className="font-medium hover:underline">{item.headline}</span>
              <span className="text-slate-500 font-mono text-[10px]">({item.timeAgo})</span>
              <span className="text-slate-700 ml-4">•</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
