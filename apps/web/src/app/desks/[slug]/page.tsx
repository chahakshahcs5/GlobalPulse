'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { getSpecialDesk, listStories } from '../../../lib/api-client';
import { formatDeterministicDate } from '../../../lib/date-utils';
import { ArrowLeft, Radio, Pin, TrendingUp, Share2, Newspaper } from 'lucide-react';
import type { SpecialDesk, Story } from '@ai-news/schemas';

interface DeskPageProps {
  params: Promise<{ slug: string }>;
}

export default function SpecialDeskPage({ params }: DeskPageProps) {
  const { slug } = use(params);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-400 uppercase tracking-wider">
          <Link href="/" className="hover:text-white transition flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Newsroom Wire
          </Link>
          <span>/</span>
          <span style={{ color: themeColor }} className="font-bold">
            Special Pop-Up Desk
          </span>
        </div>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs transition"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{copied ? 'Link Copied!' : 'Share Coverage'}</span>
        </button>
      </div>

      {/* Desk Banner Hero */}
      <div
        className="relative overflow-hidden rounded-3xl p-8 sm:p-12 border border-slate-800 bg-slate-950"
        style={{
          boxShadow: `0 20px 50px -20px ${themeColor}25`,
        }}
      >
        {/* Ambient Glow */}
        <div
          className="absolute -right-20 -top-20 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: themeColor }}
        />

        <div className="relative z-10 space-y-6 max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs"
              style={{
                backgroundColor: `${themeColor}20`,
                color: themeColor,
                borderColor: `${themeColor}40`,
                borderWidth: '1px',
              }}
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" /> Live Pop-Up News Desk
            </span>

            {desk?.liveTickerSymbol && (
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ticker: {desk.liveTickerSymbol}</span>
              </span>
            )}

            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-900 text-slate-300 border border-slate-800">
              {stories.length} Dispatches Streamed
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            {desk?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            {desk?.description ||
              'Continuous editorial dispatches, real-time wire verification, and expert investigative analysis.'}
          </p>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
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

      {/* Stories Coverage Grid */}
      {!isLoading && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-blue-400" />
              <span>Desk Dispatches & Updates ({stories.length})</span>
            </h2>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Auto-updating stream</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story, idx) => {
              const isPinned = desk?.pinnedStoryIds?.includes(story.id) || idx === 0;
              return (
                <div
                  key={story.id}
                  className={`glass-card rounded-2xl p-6 border flex flex-col justify-between space-y-4 transition ${
                    isPinned
                      ? 'border-blue-500/40 bg-gradient-to-b from-blue-950/20 to-slate-900/60 shadow-lg'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      {isPinned ? (
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1 font-bold text-[10px] uppercase">
                          <Pin className="w-3 h-3" /> Pinned Lead
                        </span>
                      ) : (
                        <span className="text-slate-400 uppercase text-[10px]">
                          {story.articleType.replace('_', ' ')}
                        </span>
                      )}
                      <span className="text-slate-500 text-[11px]" suppressHydrationWarning>
                        {formatDeterministicDate(story.publishedAt || story.createdAt)}
                      </span>
                    </div>

                    <Link href={`/stories/${story.slug}`} className="block group">
                      <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition leading-snug line-clamp-2">
                        {story.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {story.summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">By {story.authorId}</span>
                    <Link
                      href={`/stories/${story.slug}`}
                      className="text-blue-400 hover:text-blue-300 font-bold transition flex items-center gap-1"
                    >
                      <span>Read Dispatch</span> &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
