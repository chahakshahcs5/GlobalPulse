'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { getSpecialDesk, listStories } from '../../../lib/api-client';
import { formatDeterministicDate } from '../../../lib/date-utils';
import { SkeletonBone } from '../../../components/StorySkeletons';
import { ArrowLeft, Radio, Pin, TrendingUp, Share2, Newspaper, Star } from 'lucide-react';
import type { SpecialDesk, Story } from '@ai-news/schemas';

interface DeskPageProps {
  params: Promise<{ slug: string }>;
}

export default function SpecialDeskPage({ params }: DeskPageProps) {
  const resolvedParams =
    params && typeof (params as unknown as Promise<{ slug: string }>).then === 'function'
      ? use(params)
      : (params as unknown as { slug: string });
  const slug = resolvedParams?.slug || 'special-desk';
  const [desk, setDesk] = useState<SpecialDesk | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getSpecialDesk(slug), listStories({ limit: 60 })])
      .then(([deskData, allStories]) => {
        if (!isMounted) return;
        setDesk(deskData);

        const deskSlugClean = slug.toLowerCase().replace(/-/g, ' ');
        const matching = allStories.filter((s) => {
          if (s.status !== 'PUBLISHED') return false;
          if (deskData?.pinnedStoryIds?.includes(s.id)) return true;
          const sTitle = (s.title || '').toLowerCase();
          const sSummary = (s.summary || '').toLowerCase();
          return (
            sTitle.includes(deskSlugClean) ||
            sSummary.includes(deskSlugClean) ||
            (s.categories && s.categories.some((c) => c.toLowerCase().includes(deskSlugClean)))
          );
        });

        setStories(matching.length > 0 ? matching : allStories.slice(0, 8));
        setIsLoading(false);
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const themeColor = desk?.themeColor || '#3b82f6';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 sm:space-y-10">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
          <Link
            href="/"
            className="hover:text-blue-600 dark:hover:text-white transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Top Stories</span>
          </Link>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span
            style={{ color: themeColor }}
            className="font-bold tracking-wide uppercase text-[11px]"
          >
            Special Pop-Up Desk
          </span>
        </div>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer shadow-xs"
        >
          <Share2 className="w-3.5 h-3.5 text-slate-400" />
          <span>{copied ? 'Link Copied!' : 'Share Coverage'}</span>
        </button>
      </div>

      {/* Desk Banner Hero */}
      <div
        className="relative overflow-hidden rounded-3xl p-8 sm:p-12 border border-slate-900/10 dark:border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white shadow-xl"
        style={{
          boxShadow: `0 20px 50px -20px ${themeColor}35`,
        }}
      >
        {/* Ambient Glow */}
        <div
          className="absolute -right-20 -top-20 w-96 h-96 rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ backgroundColor: themeColor }}
        />

        <div className="relative z-10 space-y-6 max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs backdrop-blur-xs"
              style={{
                backgroundColor: `${themeColor}25`,
                color: '#ffffff',
                borderColor: `${themeColor}60`,
                borderWidth: '1px',
              }}
            >
              <Radio className="w-3.5 h-3.5 animate-pulse text-rose-400" /> Live Pop-Up News Desk
            </span>

            {desk?.liveTickerSymbol && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-xs text-slate-200 border border-white/15 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ticker: {desk.liveTickerSymbol}</span>
              </span>
            )}

            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-xs text-slate-200 border border-white/15">
              {stories.length} Dispatches Streamed
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            {desk?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            {desk?.description ||
              'Continuous editorial dispatches, real-time wire verification, and expert investigative analysis.'}
          </p>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <SkeletonBone className="h-4 w-48 rounded" />
            <SkeletonBone className="h-5 w-32 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-2xl p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <SkeletonBone className="h-4 w-20 rounded-full" />
                  <SkeletonBone className="h-3 w-16 rounded" />
                </div>
                <div className="space-y-2">
                  <SkeletonBone className="h-5 w-full rounded-md" />
                  <SkeletonBone className="h-5 w-4/5 rounded-md" />
                </div>
                <div className="space-y-1.5 pt-1">
                  <SkeletonBone className="h-3 w-full rounded" />
                  <SkeletonBone className="h-3 w-full rounded" />
                  <SkeletonBone className="h-3 w-2/3 rounded" />
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <SkeletonBone className="h-3 w-24 rounded" />
                  <SkeletonBone className="h-3 w-20 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stories Coverage Grid */}
      {!isLoading && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Desk Dispatches &amp; Updates ({stories.length})</span>
            </h2>
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Auto-updating stream</span>
            </span>
          </div>

          {stories.length === 0 ? (
            <div className="rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40 flex items-center justify-center mx-auto">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No Dispatches In This Desk Stream Yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Autonomous newsroom agents are monitoring breaking sources. Dispatches will stream
                in real time.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer"
              >
                <span>Return to Top Stories</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((story, idx) => {
                const isPinned = desk?.pinnedStoryIds?.includes(story.id) || idx === 0;
                const authorFormatted =
                  story.authorId === 'usr_admin'
                    ? 'GlobalPulse Editorial'
                    : story.authorId === 'usr_spark_agent'
                      ? 'AI Research Bureau'
                      : story.authorId
                          .replace(/^usr_/, '')
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (c) => c.toUpperCase());

                return (
                  <div
                    key={story.id}
                    className={`group rounded-2xl p-6 border flex flex-col justify-between space-y-4 transition-all duration-200 hover:-translate-y-0.5 shadow-xs hover:shadow-md ${
                      isPinned
                        ? 'border-blue-500/30 bg-gradient-to-b from-blue-50/50 via-white to-white dark:from-blue-950/20 dark:via-slate-900 dark:to-slate-900 dark:border-blue-500/40 shadow-blue-500/5'
                        : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          {isPinned ? (
                            <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider">
                              <Pin className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Pinned
                              Lead
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider">
                              {story.articleType.replace('_', ' ')}
                            </span>
                          )}

                          {story.isSubscriberOnly && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                              Exclusive
                            </span>
                          )}
                        </div>

                        <span
                          className="text-slate-400 dark:text-slate-500 text-[11px]"
                          suppressHydrationWarning
                        >
                          {formatDeterministicDate(story.publishedAt || story.createdAt)}
                        </span>
                      </div>

                      <Link href={`/stories/${story.slug}`} className="block">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug line-clamp-2">
                          {story.title}
                        </h3>
                      </Link>

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                        {story.summary}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                        By {authorFormatted}
                      </span>
                      <Link
                        href={`/stories/${story.slug}`}
                        className="text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 font-bold transition flex items-center gap-1"
                      >
                        <span>Read Dispatch</span>
                        <span className="group-hover:translate-x-0.5 transition-transform">
                          &rarr;
                        </span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
