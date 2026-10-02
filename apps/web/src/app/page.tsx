'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
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
import { useAllStories, useBookmarks, toggleBookmark, useTaxonomy } from '../lib/news-store';
import {
  Sparkles,
  Bookmark,
  ArrowRight,
  BookmarkCheck,
  History,
  Globe2,
  ChevronDown,
  Check,
  Plus,
  X as XIcon,
  Newspaper,
  Building2,
  Layers,
  Star,
} from 'lucide-react';
import { DEMO_PUBLISHERS } from '../lib/demo-data';
import { formatDeterministicDate, formatDeterministicDateTime } from '../lib/date-utils';

export type FeedMode = 'top' | 'for-you' | 'following' | 'history';
export type RegionalEdition = 'global' | 'india' | 'us' | 'europe' | 'asia' | 'mideast';

function matchesRegion(
  c: {
    title: string;
    summary: string;
    category: string;
    relatedArticles?: Array<{ headline: string; publisher: string }>;
  },
  region: RegionalEdition
): boolean {
  if (region === 'global') return true;
  const relatedText = (c.relatedArticles || [])
    .map((a) => `${a.headline} ${a.publisher}`)
    .join(' ');
  const text = `${c.title} ${c.summary} ${c.category} ${relatedText}`.toLowerCase();

  switch (region) {
    case 'india':
      return (
        c.category.toLowerCase() === 'india' ||
        text.includes('india') ||
        text.includes('delhi') ||
        text.includes('mumbai') ||
        text.includes('bengaluru') ||
        text.includes('isro') ||
        text.includes('rbi')
      );
    case 'us':
      return (
        text.includes('united states') ||
        text.includes('u.s.') ||
        text.includes('washington') ||
        text.includes('new york') ||
        text.includes('federal reserve') ||
        text.includes('white house') ||
        text.includes('silicon valley') ||
        text.includes('america') ||
        c.category.toLowerCase() === 'business'
      );
    case 'europe':
      return (
        text.includes('europe') ||
        text.includes('european') ||
        text.includes('eu') ||
        text.includes('uk') ||
        text.includes('london') ||
        text.includes('britain') ||
        text.includes('germany') ||
        text.includes('berlin') ||
        text.includes('france') ||
        text.includes('paris') ||
        text.includes('brussels') ||
        text.includes('nato')
      );
    case 'asia':
      return (
        text.includes('asia') ||
        text.includes('china') ||
        text.includes('beijing') ||
        text.includes('japan') ||
        text.includes('tokyo') ||
        text.includes('singapore') ||
        text.includes('taiwan') ||
        text.includes('seoul') ||
        text.includes('korea')
      );
    case 'mideast':
      return (
        text.includes('middle east') ||
        text.includes('gulf') ||
        text.includes('dubai') ||
        text.includes('uae') ||
        text.includes('saudi') ||
        text.includes('riyadh') ||
        text.includes('qatar')
      );
    default:
      return true;
  }
}

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
  const [followedCategories, setFollowedCategories] = useState<string[]>([]);
  const [followedTopics, setFollowedTopics] = useState<string[]>([]);
  const [followedSources, setFollowedSources] = useState<string[]>([]);

  const { stories: userStories } = useAllStories();
  const { clusters, leadCluster, secondaryClusters } = useNewsClusters();
  const { topics: taxonomyTopics, categories: taxonomyCategories } = useTaxonomy();
  const bookmarks = useBookmarks();

  const availableCategories = Array.from(new Set(taxonomyCategories.map((c) => c.name))).filter(
    Boolean
  );

  const availableTopics = Array.from(
    new Set([
      ...taxonomyTopics.map((t) => t.name),
      'Global Geopolitics',
      'Nuclear Fusion Energy',
      'BRICS Summit 2026',
      'Autonomous AI Agents',
      'Semiconductors',
      'Quantum Computing',
    ])
  ).filter((top) => !availableCategories.includes(top));

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

  // Load reading history, followed categories, followed topics, and regional edition from localStorage
  useEffect(() => {
    try {
      const histRaw = localStorage.getItem('globalpulse_reading_history');
      if (histRaw) setReadingHistory(JSON.parse(histRaw));

      const catRaw = localStorage.getItem('globalpulse_followed_categories');
      if (catRaw) {
        setFollowedCategories(JSON.parse(catRaw));
      } else if (taxonomyCategories.length > 0) {
        setFollowedCategories(taxonomyCategories.slice(0, 4).map((c) => c.name));
      }

      const followRaw = localStorage.getItem('globalpulse_following');
      if (followRaw) {
        setFollowedTopics(JSON.parse(followRaw));
      } else if (taxonomyTopics.length > 0) {
        setFollowedTopics(taxonomyTopics.slice(0, 3).map((t) => t.name));
      }
      const savedEd = localStorage.getItem('globalpulse_edition') as RegionalEdition | null;
      if (savedEd) setEdition(savedEd);

      const sourcesRaw = localStorage.getItem('globalpulse_followed_sources');
      if (sourcesRaw) {
        setFollowedSources(JSON.parse(sourcesRaw));
      } else {
        setFollowedSources(['the-hindu', 'reuters']);
      }
    } catch {
      // Safe fallback
    }

    const handleCategoriesUpdate = () => {
      try {
        const stored = localStorage.getItem('globalpulse_followed_categories');
        if (stored) setFollowedCategories(JSON.parse(stored));
      } catch {}
    };

    const handleTopicsUpdate = () => {
      try {
        const stored = localStorage.getItem('globalpulse_following');
        if (stored) setFollowedTopics(JSON.parse(stored));
      } catch {}
    };

    const handleSourcesUpdate = () => {
      try {
        const stored = localStorage.getItem('globalpulse_followed_sources');
        if (stored) setFollowedSources(JSON.parse(stored));
      } catch {}
    };

    window.addEventListener('globalpulse_categories_updated', handleCategoriesUpdate);
    window.addEventListener('globalpulse_following_updated', handleTopicsUpdate);
    window.addEventListener('globalpulse_sources_updated', handleSourcesUpdate);
    return () => {
      window.removeEventListener('globalpulse_categories_updated', handleCategoriesUpdate);
      window.removeEventListener('globalpulse_following_updated', handleTopicsUpdate);
      window.removeEventListener('globalpulse_sources_updated', handleSourcesUpdate);
    };
  }, [taxonomyCategories, taxonomyTopics]);

  // Switch tab and synchronize URL
  const switchFeedMode = (mode: FeedMode) => {
    setFeedMode(mode);
    setSelectedTopic(null);
    const target = mode === 'top' ? '/' : `/?tab=${mode}`;
    router.push(target, { scroll: false });
  };

  // Toggle category follow
  const toggleFollowCategory = (category: string) => {
    setFollowedCategories((prev) => {
      const exists = prev.includes(category);
      const next = exists ? prev.filter((c) => c !== category) : [...prev, category];
      try {
        localStorage.setItem('globalpulse_followed_categories', JSON.stringify(next));
        window.dispatchEvent(new Event('globalpulse_categories_updated'));
      } catch {
        // Safe fallback
      }
      return next;
    });
  };

  // Toggle topic follow
  const toggleFollowTopic = (topic: string) => {
    setFollowedTopics((prev) => {
      const exists = prev.includes(topic);
      const next = exists ? prev.filter((t) => t !== topic) : [...prev, topic];
      try {
        localStorage.setItem('globalpulse_following', JSON.stringify(next));
        window.dispatchEvent(new Event('globalpulse_following_updated'));
      } catch {
        // Safe fallback
      }
      return next;
    });
  };

  // Handle edition change with persistent preference
  const handleEditionChange = (newEdition: RegionalEdition) => {
    setEdition(newEdition);
    try {
      localStorage.setItem('globalpulse_edition', newEdition);
      window.dispatchEvent(new CustomEvent('globalpulse_edition_updated', { detail: newEdition }));
    } catch {}
  };

  // Today's formatted date
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  // Regional filtering: applies across all clusters so lead and secondary are coherent
  const regionalClusters = clusters.filter((c) => matchesRegion(c, edition));

  const effectiveLeadCluster =
    edition === 'global' ? leadCluster : regionalClusters[0] || leadCluster;

  const candidateSecondary =
    edition === 'global'
      ? secondaryClusters
      : regionalClusters.length > 0
        ? regionalClusters.slice(1)
        : secondaryClusters;

  // Filter clusters if a topic is selected
  const displayClusters = selectedTopic
    ? candidateSecondary.filter(
        (c) =>
          c.title.toLowerCase().includes(selectedTopic.toLowerCase()) ||
          c.category.toLowerCase().includes(selectedTopic.toLowerCase()) ||
          c.summary.toLowerCase().includes(selectedTopic.toLowerCase())
      )
    : candidateSecondary;

  // Sliced for pagination (F17: Infinite Scroll / Load More)
  const paginatedClusters = displayClusters.slice(0, visibleCount);
  const hasMore = displayClusters.length > visibleCount;

  // Personalized clusters for "For You"
  const forYouClusters = [...clusters].sort((a, b) => {
    const aMatch =
      followedCategories.some(
        (cat) =>
          a.category?.toLowerCase() === cat.toLowerCase() ||
          a.category?.toLowerCase().includes(cat.toLowerCase())
      ) ||
      followedTopics.some(
        (t) =>
          a.title.toLowerCase().includes(t.toLowerCase()) ||
          a.category.toLowerCase().includes(t.toLowerCase())
      );
    const bMatch =
      followedCategories.some(
        (cat) =>
          b.category?.toLowerCase() === cat.toLowerCase() ||
          b.category?.toLowerCase().includes(cat.toLowerCase())
      ) ||
      followedTopics.some(
        (t) =>
          b.title.toLowerCase().includes(t.toLowerCase()) ||
          b.category.toLowerCase().includes(t.toLowerCase())
      );
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return 0;
  });

  // Curated picks for the right-hand "Picks for you" module
  const picksForYou = useMemo(() => {
    // Prioritize personalized recommendations from forYouClusters, fallback to all clusters
    const candidates = forYouClusters.length > 0 ? forYouClusters : clusters;
    if (candidates.length === 0) return [];

    // In 'top' mode with multiple clusters, avoid duplicating the main lead hero story
    if (feedMode === 'top' && candidates.length > 1) {
      return candidates.slice(1, 5);
    }

    // In 'for-you', 'following', or when few stories exist, show up to 4 personalized recommendations
    return candidates.slice(0, 4);
  }, [clusters, forYouClusters, feedMode]);

  // Clusters matching followed categories, followed topics, and followed sources for "Following"
  const followedClusters = clusters.filter((c) => {
    if (
      followedCategories.length === 0 &&
      followedTopics.length === 0 &&
      followedSources.length === 0
    ) {
      return true;
    }
    const matchesCategory = followedCategories.some((cat) => {
      const catLow = cat.toLowerCase();
      const cCatLow = (c.category || '').toLowerCase();
      return cCatLow === catLow || cCatLow.includes(catLow) || catLow.includes(cCatLow);
    });
    const matchesTopic = followedTopics.some(
      (t) =>
        c.title.toLowerCase().includes(t.toLowerCase()) ||
        c.category.toLowerCase().includes(t.toLowerCase()) ||
        c.summary.toLowerCase().includes(t.toLowerCase())
    );
    const matchesSource = followedSources.some((s) => {
      const sLow = s.toLowerCase();
      return (
        c.leadStory?.publisher?.toLowerCase().includes(sLow) ||
        c.leadStory?.slug?.toLowerCase().includes(sLow) ||
        c.relatedArticles?.some(
          (art) =>
            art.publisher.toLowerCase().includes(sLow) ||
            (art.url && art.url.toLowerCase().includes(sLow))
        )
      );
    });
    return matchesCategory || matchesTopic || matchesSource;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Real-time Breaking News Ticker */}
      <BreakingTicker />

      {/* Google News 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Top Stories Stream (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {feedMode === 'top' && 'Top stories'}
                {feedMode === 'for-you' && 'Personalized for you'}
                {feedMode === 'following' && 'Your followed categories, topics & sources'}
                {feedMode === 'history' && 'Reading history'}
              </h1>
              <p
                className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5"
                suppressHydrationWarning
              >
                {todayFormatted} • {edition.toUpperCase()} REGION
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {selectedTopic && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Filtered by:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">
                    #{selectedTopic}
                  </span>
                  <button
                    onClick={() => setSelectedTopic(null)}
                    className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              )}

              <button
                onClick={() => switchFeedMode(feedMode === 'history' ? 'top' : 'history')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                  feedMode === 'history'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60'
                }`}
                title="View reading history"
              >
                <History className="w-3.5 h-3.5" />
                <span>Recently Read</span>
              </button>

              {/* Regional Edition Selector (F14) */}
              <div className="flex items-center gap-1.5 text-xs">
                <Globe2 className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={edition}
                  onChange={(e) => handleEditionChange(e.target.value as RegionalEdition)}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="global">Global Edition</option>
                  <option value="india">India Edition</option>
                  <option value="us">United States</option>
                  <option value="europe">Europe</option>
                  <option value="asia">Asia-Pacific</option>
                  <option value="mideast">Middle East &amp; Gulf</option>
                </select>
              </div>
            </div>
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
              {/* Followed & Suggested Categories Control Panel */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-600" /> Followed Categories (
                      {followedCategories.length})
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      News dispatches across your followed categories are prioritized in your feed.
                    </p>
                  </div>
                  <Link
                    href="/categories"
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0"
                  >
                    <span>Explore All Categories</span>
                    <span>→</span>
                  </Link>
                </div>

                {/* Followed Categories Chips */}
                <div className="flex flex-wrap gap-2">
                  {followedCategories.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">
                      No categories followed yet. Choose suggestions below:
                    </span>
                  ) : (
                    followedCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => toggleFollowCategory(cat)}
                        className="group px-3 py-1.5 rounded-full bg-blue-50 hover:bg-rose-50 dark:bg-blue-950/60 dark:hover:bg-rose-950/50 text-blue-700 hover:text-rose-600 dark:text-blue-300 dark:hover:text-rose-300 border border-blue-200 hover:border-rose-200 dark:border-blue-900 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        title={`Click to unfollow ${cat}`}
                      >
                        <Check className="w-3.5 h-3.5 text-blue-600 group-hover:hidden" />
                        <XIcon className="w-3.5 h-3.5 text-rose-500 hidden group-hover:inline" />
                        <span>{cat}</span>
                      </button>
                    ))
                  )}
                </div>

                {/* Suggested Categories to Follow */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Recommended Categories:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableCategories
                      .filter((c) => !followedCategories.includes(c))
                      .map((cat) => (
                        <button
                          key={cat}
                          onClick={() => toggleFollowCategory(cat)}
                          className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/60 text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-slate-400" />
                          <span>{cat}</span>
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              {/* Followed & Suggested Topics Control Panel */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
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
                  <Link
                    href="/topic"
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0"
                  >
                    <span>Explore All Topics</span>
                    <span>→</span>
                  </Link>
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
                    Recommended Topics:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableTopics
                      .filter((t) => !followedTopics.includes(t))
                      .map((top) => (
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

              {/* Followed Sources Shelf */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600" /> Followed Sources & Publishers
                      ({followedSources.length})
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Stories citing or published by these news sources are prioritized in your
                      feed.
                    </p>
                  </div>
                  <Link
                    href="/sources"
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0"
                  >
                    <span>Explore All Sources</span>
                    <span>→</span>
                  </Link>
                </div>

                <div className="flex flex-wrap gap-2">
                  {followedSources.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">
                      No sources followed yet.{' '}
                      <Link href="/sources" className="text-blue-500 underline font-semibold">
                        Explore sources to follow
                      </Link>
                      .
                    </span>
                  ) : (
                    followedSources.map((srcSlug) => {
                      const pub = Object.values(DEMO_PUBLISHERS).find(
                        (p) => p.slug === srcSlug || p.id === srcSlug
                      );
                      const name = pub?.name || srcSlug.replace(/-/g, ' ');
                      return (
                        <Link
                          key={srcSlug}
                          href={`/sources/${srcSlug}`}
                          className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-2 transition"
                        >
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="capitalize">{name}</span>
                        </Link>
                      );
                    })
                  )}
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
              {!selectedTopic && effectiveLeadCluster && (
                <GoogleNewsLeadCard
                  cluster={effectiveLeadCluster}
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

              {clusters.length === 0 && (
                <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-3">
                  <Newspaper className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    No Published Stories Yet
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Dispatches drafted in the Editorial CMS or published by autonomous AI agents
                    will appear here in real time.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/admin"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Open Editorial CMS</span>
                    </Link>
                  </div>
                </div>
              )}

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
                            <div className="flex items-center gap-1.5">
                              {story.isSubscriberOnly && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                  Subscriber Exclusive
                                </span>
                              )}
                              <span className="font-extrabold text-blue-600 dark:text-blue-400">
                                {story.articleType.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
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
              {picksForYou.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  <p>No personalized picks available yet.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Follow topics or read stories to populate your feed.
                  </p>
                </div>
              ) : (
                picksForYou.map((c) => {
                  const isBookmarked = bookmarks.includes(c.leadStory.slug);
                  return (
                    <div key={c.id} className="py-2.5 first:pt-1 last:pb-1 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5">
                          {c.leadStory.isSubscriberOnly && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                              Exclusive
                            </span>
                          )}
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {c.leadStory.publisher}
                          </span>
                        </div>
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
                })
              )}
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
