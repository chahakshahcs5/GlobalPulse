'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useNewsClusters } from '../lib/cluster-builder';
import { BreakingTicker } from '../components/BreakingTicker';
import { GoogleNewsLeadCard } from '../components/GoogleNewsLeadCard';
import { GoogleNewsClusterCard } from '../components/GoogleNewsClusterCard';
import { WeatherWidget } from '../components/WeatherWidget';
import { FactCheckWidget } from '../components/FactCheckWidget';
import { TrendingTopicsWidget } from '../components/TrendingTopicsWidget';
import { FullCoverageModal } from '../components/FullCoverageModal';
import { useAllStories, useBookmarks, toggleBookmark } from '../lib/news-store';
import {
  Sparkles,
  Bookmark,
  ArrowRight,
  Star,
  BookmarkCheck,
  History,
  Globe2,
  ChevronDown,
  Check,
} from 'lucide-react';
import { formatDeterministicDate, formatDeterministicDateTime } from '../lib/date-utils';

export type FeedMode = 'top' | 'for-you' | 'following' | 'history';
export type RegionalEdition = 'global' | 'india' | 'us' | 'europe';

export default function GoogleNewsHomePage() {
  const [activeFullCoverageSlug, setActiveFullCoverageSlug] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [feedMode, setFeedMode] = useState<FeedMode>('top');
  const [edition, setEdition] = useState<RegionalEdition>('global');
  const [visibleCount, setVisibleCount] = useState<number>(4);
  const [readingHistory, setReadingHistory] = useState<Array<{ slug: string; title: string; category?: string; readAt: string }>>([]);
  const [followedTopics, setFollowedTopics] = useState<string[]>(['AI Breakthroughs', 'Geopolitics', 'Clean Energy']);

  const { stories: userStories } = useAllStories();
  const { clusters, leadCluster, secondaryClusters } = useNewsClusters();
  const bookmarks = useBookmarks();

  // Load reading history and followed topics from localStorage
  useEffect(() => {
    try {
      const histRaw = localStorage.getItem('globalpulse_reading_history');
      if (histRaw) setReadingHistory(JSON.parse(histRaw));
      const followRaw = localStorage.getItem('globalpulse_following');
      if (followRaw) setFollowedTopics(JSON.parse(followRaw));
    } catch {
      // Safe fallback
    }
  }, []);

  // Today's formatted date
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  // Filter clusters by edition/region
  const editionClusters = secondaryClusters.filter((c) => {
    if (edition === 'global') return true;
    if (edition === 'india') return c.category === 'India' || c.title.toLowerCase().includes('india') || c.title.toLowerCase().includes('delhi');
    if (edition === 'us') return c.category === 'World' || c.category === 'Business';
    if (edition === 'europe') return c.category === 'World' || c.category === 'Science';
    return true;
  });

  // Filter clusters if a topic is selected
  const displayClusters = selectedTopic
    ? editionClusters.filter(
        (c) =>
          c.title.toLowerCase().includes(selectedTopic.toLowerCase()) ||
          c.category.toLowerCase().includes(selectedTopic.toLowerCase())
      )
    : editionClusters;

  // Sliced for pagination (F17: Infinite Scroll / Load More)
  const paginatedClusters = displayClusters.slice(0, visibleCount);
  const hasMore = displayClusters.length > visibleCount;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Real-time Breaking News Ticker */}
      <BreakingTicker />

      {/* Google News Feed Mode Tabs (Top Stories, For You, Following, Reading History) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          <button
            onClick={() => { setFeedMode('top'); setSelectedTopic(null); }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              feedMode === 'top'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Top Stories</span>
          </button>

          <button
            onClick={() => setFeedMode('for-you')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              feedMode === 'for-you'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>For You</span>
          </button>

          <button
            onClick={() => setFeedMode('following')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              feedMode === 'following'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>Following</span>
          </button>

          <button
            onClick={() => setFeedMode('history')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              feedMode === 'history'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Recently Read</span>
          </button>
        </div>

        {/* Regional Edition Selector (F14) */}
        <div className="flex items-center gap-2 text-xs">
          <Globe2 className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 hidden sm:inline">Edition:</span>
          <select
            value={edition}
            onChange={(e) => setEdition(e.target.value as RegionalEdition)}
            className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-none rounded-lg px-2.5 py-1 text-xs font-semibold focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="global">Global Edition</option>
            <option value="india">India Edition</option>
            <option value="us">United States</option>
            <option value="europe">Europe</option>
          </select>
        </div>
      </div>

      {/* Google News 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Top Stories Stream (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {feedMode === 'top' && 'Top stories'}
                {feedMode === 'for-you' && 'Personalized for you'}
                {feedMode === 'following' && 'Your followed topics & sources'}
                {feedMode === 'history' && 'Reading history'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium" suppressHydrationWarning>
                {todayFormatted} • {edition.toUpperCase()} REGION
              </p>
            </div>

            {selectedTopic && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Filtered by:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">
                  #{selectedTopic}
                </span>
                <button
                  onClick={() => setSelectedTopic(null)}
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* VIEW: READING HISTORY (F12) */}
          {feedMode === 'history' && (
            <div className="space-y-3">
              {readingHistory.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 space-y-2">
                  <History className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold">No reading history yet</p>
                  <p className="text-xs">Articles you read will appear here automatically.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                  {readingHistory.map((item, idx) => (
                    <div key={idx} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-blue-600 uppercase">
                          {item.category?.replace('_', ' ') || 'Dispatch'}
                        </span>
                        <Link href={`/stories/${item.slug}`} className="block font-bold text-sm text-slate-900 dark:text-white hover:text-blue-600 transition">
                          {item.title}
                        </Link>
                        <span className="text-[10px] text-slate-400" suppressHydrationWarning>
                          Read {formatDeterministicDateTime(item.readAt)}
                        </span>
                      </div>
                      <Link
                        href={`/stories/${item.slug}`}
                        className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold text-xs shrink-0 hover:bg-blue-50 transition"
                      >
                        Re-read
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW: FOR YOU (F10) */}
          {feedMode === 'for-you' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-sky-500/10 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Curated For Your Reading Habits
                    </h3>
                    <p className="text-xs text-slate-500">
                      Based on your interest in AI Breakthroughs, Global Economy, and Tech Innovation
                    </p>
                  </div>
                </div>
              </div>

              {clusters.map((cluster) => (
                <GoogleNewsClusterCard
                  key={cluster.id}
                  cluster={cluster}
                  onOpenFullCoverage={(slug) => setActiveFullCoverageSlug(slug)}
                />
              ))}
            </div>
          )}

          {/* VIEW: FOLLOWING (F11) */}
          {feedMode === 'following' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <BookmarkCheck className="w-4 h-4 text-blue-600" /> Followed Topics
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {followedTopics.map((top) => (
                    <span
                      key={top}
                      className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-blue-600" /> {top}
                    </span>
                  ))}
                </div>
              </div>

              {clusters.slice(0, 3).map((cluster) => (
                <GoogleNewsClusterCard
                  key={cluster.id}
                  cluster={cluster}
                  onOpenFullCoverage={(slug) => setActiveFullCoverageSlug(slug)}
                />
              ))}
            </div>
          )}

          {/* VIEW: TOP STORIES (DEFAULT) */}
          {feedMode === 'top' && (
            <>
              {/* Lead Story with Multi-Source Perspectives & Full Coverage */}
              {!selectedTopic && (
                <GoogleNewsLeadCard
                  cluster={leadCluster}
                  onOpenFullCoverage={(slug) => setActiveFullCoverageSlug(slug)}
                />
              )}

              {/* Secondary Story Clusters */}
              <div className="space-y-4">
                {paginatedClusters.map((cluster) => (
                  <GoogleNewsClusterCard
                    key={cluster.id}
                    cluster={cluster}
                    onOpenFullCoverage={(slug) => setActiveFullCoverageSlug(slug)}
                  />
                ))}
              </div>

              {/* F17: Infinite Scroll / Load More Dispatches */}
              {hasMore && (
                <div className="pt-2 text-center">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 4)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <span>Load More Stories</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* User-Published Stories from Human Newsroom / CMS */}
              {userStories.filter((s) => s.createdVia === 'admin' || s.createdVia === 'web').length > 0 && (
                <div className="pt-6 space-y-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      <span>Dispatches from GlobalPulse Newsroom</span>
                    </h2>
                    <Link
                      href="/admin"
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Manage in CMS →
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {userStories
                      .filter((s) => s.createdVia === 'admin' || s.createdVia === 'web')
                      .slice(0, 4)
                      .map((story) => (
                        <div
                          key={story.id}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2 hover:shadow-md transition"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-blue-600 dark:text-blue-400">
                              {story.articleType.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono" suppressHydrationWarning>
                              {formatDeterministicDate(story.publishedAt)}
                            </span>
                          </div>

                          <Link href={`/stories/${story.slug}`} className="block group">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-2">
                              {story.title}
                            </h3>
                          </Link>

                          <p className="text-xs text-slate-500 line-clamp-2">
                            {story.summary}
                          </p>

                          <div className="pt-1 flex items-center justify-between text-xs">
                            <span className="text-slate-400 text-[11px]">
                              By {story.authorId.replace('usr_', '').replace('_', ' ')}
                            </span>
                            <Link
                              href={`/stories/${story.slug}`}
                              className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                            >
                              Read <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Column: Google News Sidebar (Weather, Picks for you, Fact Check, In the news) (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Local Weather Widget */}
          <WeatherWidget />

          {/* "Picks for you" Curated Module */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Picks for you</span>
              </div>
              <span className="text-[11px] text-slate-400">Personalized</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {clusters.slice(1, 4).map((c) => {
                const isBookmarked = bookmarks.includes(c.leadStory.slug);
                return (
                  <div key={c.id} className="py-2.5 first:pt-1 last:pb-1 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {c.leadStory.publisher}
                      </span>
                      <button
                        onClick={() => toggleBookmark(c.leadStory.slug)}
                        className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
                          isBookmarked ? 'text-blue-600' : 'text-slate-400'
                        }`}
                        title={isBookmarked ? 'Saved' : 'Save for later'}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-blue-600' : ''}`} />
                      </button>
                    </div>

                    <Link
                      href={`/stories/${c.leadStory.slug}`}
                      className="block text-xs font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2 leading-snug"
                    >
                      {c.leadStory.headline}
                    </Link>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{c.leadStory.timeAgo}</span>
                      <span>•</span>
                      <span>{c.category}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* In the News Trending Pills */}
          <TrendingTopicsWidget onSelectTopic={(topic) => setSelectedTopic(topic)} />

          {/* Fact Check Widget */}
          <FactCheckWidget />
        </div>
      </div>

      {/* Google News Full Coverage Modal */}
      <FullCoverageModal
        slug={activeFullCoverageSlug}
        onClose={() => setActiveFullCoverageSlug(null)}
      />
    </div>
  );
}
