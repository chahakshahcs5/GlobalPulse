'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Plus,
  X as XIcon,
} from 'lucide-react';
import { formatDeterministicDate, formatDeterministicDateTime } from '../lib/date-utils';

export type FeedMode = 'top' | 'for-you' | 'following' | 'history';
export type RegionalEdition = 'global' | 'india' | 'us' | 'europe';

const ALL_AVAILABLE_TOPICS = [
  'AI Breakthroughs',
  'Geopolitics',
  'Clean Energy',
  'Semiconductors',
  'Space Exploration',
  'Quantum Computing',
  'Global Markets',
  'Health Science',
];

function GoogleNewsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');

  const [activeFullCoverageSlug, setActiveFullCoverageSlug] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [feedMode, setFeedMode] = useState<FeedMode>('top');
  const [edition, setEdition] = useState<RegionalEdition>('global');
  const [visibleCount, setVisibleCount] = useState<number>(4);
  const [readingHistory, setReadingHistory] = useState<
    Array<{ slug: string; title: string; category?: string; readAt: string }>
  >([]);
  const [followedTopics, setFollowedTopics] = useState<string[]>([
    'AI Breakthroughs',
    'Geopolitics',
    'Clean Energy',
  ]);

  const { stories: userStories } = useAllStories();
  const { clusters, leadCluster, secondaryClusters } = useNewsClusters();
  const bookmarks = useBookmarks();

  // Synchronize feedMode with URL tab parameter or window hash
  useEffect(() => {
    if (tabParam === 'for-you') {
      setFeedMode('for-you');
    } else if (tabParam === 'following') {
      setFeedMode('following');
    } else if (tabParam === 'history') {
      setFeedMode('history');
    } else if (tabParam === 'top') {
      setFeedMode('top');
    } else if (!tabParam) {
      if (typeof window !== 'undefined' && window.location.hash) {
        const hash = window.location.hash.replace('#', '');
        if (hash === 'for-you') setFeedMode('for-you');
        else if (hash === 'following') setFeedMode('following');
        else if (hash === 'history') setFeedMode('history');
        else setFeedMode('top');
      } else {
        setFeedMode('top');
      }
    }
  }, [tabParam]);

  // Listen to hash changes in real time
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'for-you') setFeedMode('for-you');
      else if (hash === 'following') setFeedMode('following');
      else if (hash === 'history') setFeedMode('history');
      else if (hash === 'top') setFeedMode('top');
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

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

  // Switch tab and synchronize URL
  const switchFeedMode = (mode: FeedMode) => {
    setFeedMode(mode);
    setSelectedTopic(null);
    const target = mode === 'top' ? '/' : `/?tab=${mode}`;
    router.push(target, { scroll: false });
  };

  // Toggle topic follow
  const toggleFollowTopic = (topic: string) => {
    setFollowedTopics((prev) => {
      const exists = prev.includes(topic);
      const next = exists ? prev.filter((t) => t !== topic) : [...prev, topic];
      try {
        localStorage.setItem('globalpulse_following', JSON.stringify(next));
      } catch {
        // Safe fallback
      }
      return next;
    });
  };

  // Today's formatted date
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  // Filter clusters by edition/region
  const editionClusters = secondaryClusters.filter((c) => {
    if (edition === 'global') return true;
    if (edition === 'india')
      return (
        c.category === 'India' ||
        c.title.toLowerCase().includes('india') ||
        c.title.toLowerCase().includes('delhi')
      );
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

  // Personalized clusters for "For You"
  const forYouClusters = [...clusters].sort((a, b) => {
    const aMatch = followedTopics.some(
      (t) =>
        a.title.toLowerCase().includes(t.toLowerCase()) ||
        a.category.toLowerCase().includes(t.toLowerCase())
    );
    const bMatch = followedTopics.some(
      (t) =>
        b.title.toLowerCase().includes(t.toLowerCase()) ||
        b.category.toLowerCase().includes(t.toLowerCase())
    );
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return 0;
  });

  // Clusters matching followed topics for "Following"
  const followedClusters = clusters.filter((c) => {
    if (followedTopics.length === 0) return true;
    return followedTopics.some(
      (t) =>
        c.title.toLowerCase().includes(t.toLowerCase()) ||
        c.category.toLowerCase().includes(t.toLowerCase()) ||
        c.summary.toLowerCase().includes(t.toLowerCase())
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Real-time Breaking News Ticker */}
      <BreakingTicker />

      {/* Google News Feed Mode Tabs (Top Stories, For You, Following, Reading History) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          <button
            onClick={() => switchFeedMode('top')}
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
            onClick={() => switchFeedMode('for-you')}
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
            onClick={() => switchFeedMode('following')}
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
            onClick={() => switchFeedMode('history')}
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
              <p
                className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium"
                suppressHydrationWarning
              >
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
                    <div
                      key={idx}
                      className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-blue-600 uppercase">
                          {item.category?.replace('_', ' ') || 'Dispatch'}
                        </span>
                        <Link
                          href={`/stories/${item.slug}`}
                          className="block font-bold text-sm text-slate-900 dark:text-white hover:text-blue-600 transition"
                        >
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
              {/* Personalized Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-sky-500/10 border border-blue-200/60 dark:border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Curated For Your Reading Habits
                    </h3>
                    <p className="text-xs text-slate-500">
                      Intelligence ranked by your interests in{' '}
                      {followedTopics.slice(0, 3).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {followedTopics.map((top) => (
                    <span
                      key={top}
                      className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 text-[11px] font-bold"
                    >
                      {top}
                    </span>
                  ))}
                </div>
              </div>

              {forYouClusters.map((cluster) => (
                <div key={cluster.id} className="relative">
                  <GoogleNewsClusterCard
                    cluster={cluster}
                    onOpenFullCoverage={(slug) => setActiveFullCoverageSlug(slug)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* VIEW: FOLLOWING (F11) */}
          {feedMode === 'following' && (
            <div className="space-y-5">
              {/* Followed & Suggested Topics Control Panel */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-xs">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <BookmarkCheck className="w-4 h-4 text-blue-600" /> Followed Topics (
                    {followedTopics.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click any tag to toggle following or unfollowing. Stories below filter
                    dynamically.
                  </p>
                </div>

                {/* Followed Topics Chips */}
                <div className="flex flex-wrap gap-2">
                  {followedTopics.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">
                      No topics followed yet. Choose suggestions below:
                    </span>
                  ) : (
                    followedTopics.map((top) => (
                      <button
                        key={top}
                        onClick={() => toggleFollowTopic(top)}
                        className="group px-3 py-1.5 rounded-full bg-blue-50 hover:bg-rose-50 dark:bg-blue-950/60 dark:hover:bg-rose-950/50 text-blue-700 hover:text-rose-600 dark:text-blue-300 dark:hover:text-rose-300 border border-blue-200 hover:border-rose-200 dark:border-blue-900 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        title={`Click to unfollow ${top}`}
                      >
                        <Check className="w-3.5 h-3.5 text-blue-600 group-hover:hidden" />
                        <XIcon className="w-3.5 h-3.5 text-rose-500 hidden group-hover:inline" />
                        <span>{top}</span>
                      </button>
                    ))
                  )}
                </div>

                {/* Suggested Topics to Follow */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Recommended to Follow:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ALL_AVAILABLE_TOPICS.filter((t) => !followedTopics.includes(t)).map((top) => (
                      <button
                        key={top}
                        onClick={() => toggleFollowTopic(top)}
                        className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/60 text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Plus className="w-3 h-3 text-slate-400" />
                        <span>{top}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Followed Feed Story Results */}
              {followedClusters.length > 0 ? (
                <div className="space-y-4">
                  <div className="text-xs text-slate-500 font-semibold px-1">
                    Showing {followedClusters.length} dispatches matching your followed topics
                  </div>
                  {followedClusters.map((cluster) => (
                    <GoogleNewsClusterCard
                      key={cluster.id}
                      cluster={cluster}
                      onOpenFullCoverage={(slug) => setActiveFullCoverageSlug(slug)}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 space-y-2">
                  <BookmarkCheck className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold">
                    No dispatches match your current followed topics
                  </p>
                  <p className="text-xs">
                    Follow more topics from the recommended panel above to populate your stream.
                  </p>
                </div>
              )}
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

              {/* User Stories / AI Agent Generated Dispatches Carousel Section */}
              {userStories.length > 0 && (
                <div className="pt-6 space-y-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        Live Multi-Agent Newsroom Dispatches
                      </h2>
                      <p className="text-xs text-slate-500">
                        Stories drafted, verified, and published via MCP and Editorial Studio
                      </p>
                    </div>
                    <Link
                      href="/admin"
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <span>Studio Dashboard</span>
                      <ArrowRight className="w-3 h-3" />
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
                            <span
                              className="text-[11px] text-slate-400 font-mono"
                              suppressHydrationWarning
                            >
                              {formatDeterministicDate(story.publishedAt)}
                            </span>
                          </div>

                          <Link href={`/stories/${story.slug}`} className="block group">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-2">
                              {story.title}
                            </h3>
                          </Link>

                          <p className="text-xs text-slate-500 line-clamp-2">{story.summary}</p>

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
                        <Bookmark
                          className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-blue-600' : ''}`}
                        />
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

export default function GoogleNewsHomePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-slate-400">
          Loading GlobalPulse News...
        </div>
      }
    >
      <GoogleNewsContent />
    </Suspense>
  );
}
