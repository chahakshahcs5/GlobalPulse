'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { listStories } from '../../../lib/api-client';
import { formatDeterministicDate } from '../../../lib/date-utils';
import { ArrowLeft, Newspaper } from 'lucide-react';
import type { Story } from '@ai-news/schemas';

interface TopicPageProps {
  params: Promise<{ slug: string }>;
}

export default function TopicPage({ params }: TopicPageProps) {
  const { slug } = use(params);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const topicName = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  useEffect(() => {
    let isMounted = true;
    listStories({ limit: 50 })
      .then((allStories) => {
        if (!isMounted) return;
        const normalized = slug.toLowerCase().replace(/-/g, '_');
        const slugClean = slug.toLowerCase();
        const matching = allStories.filter(
          (s) =>
            s.status === 'PUBLISHED' &&
            (s.slug.toLowerCase().includes(slugClean) ||
              (s.topicIds || []).some(
                (t) => t.toLowerCase().includes(normalized) || t.toLowerCase().includes(slugClean)
              ) ||
              (s.title || '').toLowerCase().includes(slugClean))
        );
        setStories(matching);
        setIsLoading(false);
      })
      .catch(() => {
        if (isMounted) {
          setStories([]);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Topic Header */}
      <div className="pb-6 border-b border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-blue-400 font-bold uppercase tracking-wider">
          <Link href="/" className="hover:text-white transition flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Live Feed
          </Link>
          <span>/</span>
          <span>TOPIC DASHBOARD</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight flex items-center gap-3">
              <span className="text-blue-500">#</span>
              <span>{topicName}</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-2xl">
              Real-time editorial monitoring, timeline milestones, and data analytics on {topicName}
              .
            </p>
          </div>
          <span className="self-start sm:self-center px-3.5 py-1.5 rounded-full text-xs font-bold font-mono uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30">
            {stories.length} Covered Stories
          </span>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="glass-card rounded-2xl p-6 border border-slate-800 animate-pulse space-y-4"
            >
              <div className="h-4 bg-slate-800 rounded w-1/4" />
              <div className="h-6 bg-slate-800 rounded w-3/4" />
              <div className="h-16 bg-slate-800/60 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && stories.length === 0 && (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 space-y-3">
          <Newspaper className="w-10 h-10 mx-auto text-slate-500" />
          <h3 className="text-base font-bold text-white">No Dispatches in #{topicName} Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Dispatches tagged with this topic will appear here as they are published by newsroom
            editors or autonomous AI agents.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Top Stories</span>
            </Link>
          </div>
        </div>
      )}

      {/* Stories Grid */}
      {!isLoading && stories.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-slate-400">
            Published Topic Coverage
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stories.map((story) => (
              <div
                key={story.id}
                className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span className="uppercase text-blue-400 font-bold">
                      {story.articleType.replace('_', ' ')}
                    </span>
                    <span suppressHydrationWarning>
                      {formatDeterministicDate(story.publishedAt || story.createdAt)}
                    </span>
                  </div>

                  <Link href={`/stories/${story.slug}`} className="block group">
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition leading-snug">
                      {story.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    {story.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">By {story.authorId}</span>
                  <Link
                    href={`/stories/${story.slug}`}
                    className="text-blue-400 hover:text-blue-300 font-bold transition"
                  >
                    Read Full Dispatch &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
