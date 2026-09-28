'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass,
  Search,
  Layers,
  Tag,
  ArrowRight,
  Check,
  Plus,
  Sparkles,
  Filter,
} from 'lucide-react';
import { useTaxonomy } from '../../lib/news-store';

export default function ExploreTopicsAndCategoriesPage() {
  const { categories, topics } = useTaxonomy();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParentCategory, setSelectedParentCategory] = useState<string>('ALL');
  const [followedTopics, setFollowedTopics] = useState<string[]>([]);
  const [justToggled, setJustToggled] = useState<string | null>(null);

  // Load followed topics from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('globalpulse_following');
      if (stored) {
        setFollowedTopics(JSON.parse(stored));
      } else {
        setFollowedTopics(['AI Breakthroughs', 'Geopolitics', 'Clean Energy']);
      }
    } catch {
      // Safe fallback
    }
  }, []);

  // Toggle follow/unfollow
  const toggleFollow = (name: string) => {
    setFollowedTopics((prev) => {
      const exists = prev.includes(name);
      const updated = exists ? prev.filter((t) => t !== name) : [...prev, name];
      try {
        localStorage.setItem('globalpulse_following', JSON.stringify(updated));
        window.dispatchEvent(new Event('globalpulse_following_updated'));
      } catch {
        // Safe fallback
      }
      return updated;
    });

    setJustToggled(name);
    setTimeout(() => setJustToggled(null), 2000);
  };

  // Filter categories by search
  const filteredCategories = categories.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
  });

  // Filter topics by parent category and search
  const filteredTopics = topics.filter((t) => {
    const matchesCategory =
      selectedParentCategory === 'ALL' || t.parentCategory === selectedParentCategory;
    if (!matchesCategory) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      (t.parentCategory && t.parentCategory.toLowerCase().includes(q))
    );
  });

  const parentCategoriesList = [
    'ALL',
    ...Array.from(new Set(topics.map((t) => t.parentCategory || 'General'))),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Hero Header & Search */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 text-xs font-bold uppercase tracking-wider">
          <Compass className="w-4 h-4 animate-spin-slow" />
          <span>Taxonomy & Discovery Directory</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          Explore All Topics & Categories
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
          Follow beats, discover emerging intelligence clusters, and curate your personalized
          GlobalPulse newsroom feed. Followed topics dynamically customize your{' '}
          <Link href="/?tab=following" className="text-blue-600 hover:underline font-semibold">
            Following
          </Link>{' '}
          and{' '}
          <Link href="/?tab=for-you" className="text-blue-600 hover:underline font-semibold">
            For You
          </Link>{' '}
          streams.
        </p>

        {/* Live Directory Search Bar */}
        <div className="pt-2 max-w-xl mx-auto">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics, beats, categories (e.g. Semiconductors, Fusion, Geopolitics)..."
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm placeholder:text-slate-400 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 1: ALL NEWS CATEGORIES */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <span>News Categories ({filteredCategories.length})</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Primary editorial departments and regional bureaus publishing 24/7 dispatches.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCategories.map((cat) => {
            const isFollowed = followedTopics.includes(cat.name);
            return (
              <div
                key={cat.id}
                className="group p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
                      {cat.icon || '📁'}
                    </span>
                    <button
                      onClick={() => toggleFollow(cat.name)}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                        isFollowed
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {isFollowed ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  </div>

                  <Link
                    href={`/category/${cat.slug}`}
                    className="block group-hover:text-blue-600 transition"
                  >
                    <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                      {cat.name}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400 text-[11px]">
                    {cat.storyCount ? `${cat.storyCount} active dispatches` : 'Live bureau stream'}
                  </span>
                  <Link
                    href={`/category/${cat.slug}`}
                    className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                  >
                    <span>Browse</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: ALL DEEP-DIVE TOPICS */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Tag className="w-5 h-5 text-purple-600" />
              <span>Specialized Topic Index ({filteredTopics.length})</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Aggregated topics indexed by AI agent pipelines, semantic embeddings, and editorial
              curators.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            {parentCategoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedParentCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedParentCategory === cat
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Topics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTopics.map((top) => {
            const isFollowed = followedTopics.includes(top.name);
            return (
              <div
                key={top.id}
                className="group p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:shadow-md hover:border-purple-400 dark:hover:border-purple-500 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/40">
                      {top.parentCategory || 'General'}
                    </span>

                    <button
                      onClick={() => toggleFollow(top.name)}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                        isFollowed
                          ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {isFollowed ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  </div>

                  <Link
                    href={`/topics/${top.slug}`}
                    className="block group-hover:text-purple-600 transition"
                  >
                    <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                      {top.name}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
                    {top.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400 text-[11px]">
                    {top.storyCount
                      ? `${top.storyCount} indexed articles`
                      : 'Continuous monitoring'}
                  </span>
                  <Link
                    href={`/topics/${top.slug}`}
                    className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:underline"
                  >
                    <span>View Dispatches</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTopics.length === 0 && (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 space-y-2">
            <Tag className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-semibold">No topics found matching your query</p>
            <p className="text-xs">
              Try searching for other keywords or select 'ALL' category above.
            </p>
          </div>
        )}
      </section>

      {/* Toast Notification */}
      {justToggled && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-slate-900 text-white border border-slate-700 shadow-xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-3">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>
            {followedTopics.includes(justToggled)
              ? `Following ${justToggled}`
              : `Unfollowed ${justToggled}`}
          </span>
        </div>
      )}
    </div>
  );
}
