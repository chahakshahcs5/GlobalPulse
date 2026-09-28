'use client';

import { useState } from 'react';
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
import { Sparkles, Bookmark, ArrowRight } from 'lucide-react';


export default function GoogleNewsHomePage() {
  const [activeFullCoverageSlug, setActiveFullCoverageSlug] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const { stories: userStories } = useAllStories();
  const { clusters, leadCluster, secondaryClusters } = useNewsClusters();
  const bookmarks = useBookmarks();

  // Today's formatted date
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  // Filter clusters if a topic is selected
  const displayClusters = selectedTopic
    ? secondaryClusters.filter(
        (c) =>
          c.title.toLowerCase().includes(selectedTopic.toLowerCase()) ||
          c.category.toLowerCase().includes(selectedTopic.toLowerCase())
      )
    : secondaryClusters;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Real-time Breaking News Ticker */}
      <BreakingTicker />

      {/* Google News 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Top Stories Stream (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Top stories
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                {todayFormatted}
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

          {/* Lead Story with Multi-Source Perspectives & Full Coverage */}
          {!selectedTopic && (
            <GoogleNewsLeadCard
              cluster={leadCluster}
              onOpenFullCoverage={(slug) => setActiveFullCoverageSlug(slug)}
            />
          )}

          {/* Secondary Story Clusters */}
          <div className="space-y-4">
            {displayClusters.map((cluster) => (
              <GoogleNewsClusterCard
                key={cluster.id}
                cluster={cluster}
                onOpenFullCoverage={(slug) => setActiveFullCoverageSlug(slug)}
              />
            ))}
          </div>

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
                        <span className="text-[11px] text-slate-400 font-mono">
                          {story.publishedAt ? new Date(story.publishedAt).toLocaleDateString() : 'Just now'}
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
                        className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${
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
