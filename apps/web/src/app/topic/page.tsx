'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Tag,
  Search,
  Filter,
  Check,
  Plus,
  ArrowRight,
  Sparkles,
  ArrowLeft,
  Compass,
} from 'lucide-react';
import { useTaxonomy } from '../../lib/news-store';

export default function TopicsOnlyPage() {
  const { topics } = useTaxonomy();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParentCategory, setSelectedParentCategory] = useState<string>('ALL');
  const [followedTopics, setFollowedTopics] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load followed topics from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('globalpulse_following');
      if (stored) {
        setFollowedTopics(JSON.parse(stored));
      } else if (topics.length > 0) {
        setFollowedTopics(topics.slice(0, 3).map((t) => t.name));
      }
    } catch {}
  }, [topics]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Toggle follow/unfollow
  const toggleFollow = (name: string) => {
    setFollowedTopics((prev) => {
      const exists = prev.includes(name);
      const updated = exists ? prev.filter((t) => t !== name) : [...prev, name];
      try {
        localStorage.setItem('globalpulse_following', JSON.stringify(updated));
        window.dispatchEvent(new Event('globalpulse_following_updated'));
      } catch {}
      showToast(exists ? `Unfollowed topic: ${name}` : `Following topic: ${name}`);
      return updated;
    });
  };

  const query = searchQuery.trim().toLowerCase();

  // Filter topics by parent category and search query
  const filteredTopics = topics.filter((t) => {
    const matchesCategory =
      selectedParentCategory === 'ALL' || t.parentCategory === selectedParentCategory;
    if (!matchesCategory) return false;
    if (!query) return true;
    return (
      t.name.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query) ||
      (t.parentCategory && t.parentCategory.toLowerCase().includes(query))
    );
  });

  const parentCategoriesList = [
    'ALL',
    ...Array.from(new Set(topics.map((t) => t.parentCategory || 'General'))),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-500 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="hover:text-blue-600 transition flex items-center gap-1 font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Newsroom Home
          </Link>
          <span>/</span>
          <Link href="/explore" className="hover:text-blue-600 transition">
            Explore
          </Link>
          <span>/</span>
          <span className="text-purple-600 font-bold">Topics Only</span>
        </div>

        <Link
          href="/explore"
          className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Explore All (Categories, Topics & Sources)</span>
        </Link>
      </div>

      {/* Hero Header & Search */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900 text-xs font-bold uppercase tracking-wider">
          <Tag className="w-4 h-4" />
          <span>Topics Directory</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          News Topics & Intelligence Beats
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
          Follow granular beats, emerging technology clusters, and geopolitical topic hubs. Followed
          topics dynamically customize your{' '}
          <Link href="/?tab=following" className="text-purple-600 hover:underline font-semibold">
            Following stream
          </Link>
          .
        </p>

        {/* Search Bar */}
        <div className="pt-2 max-w-xl mx-auto">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics, keywords, or parent verticals..."
              className="w-full pl-11 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm placeholder:text-slate-400 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
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

        {/* Parent Category Filter Chips */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
          {parentCategoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedParentCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
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
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="text-sm font-bold text-slate-500">
            Showing <span className="text-slate-900 dark:text-white">{filteredTopics.length}</span>{' '}
            topics
            {selectedParentCategory !== 'ALL' && ` in ${selectedParentCategory}`}
          </div>
          <div className="text-xs text-slate-400">{followedTopics.length} topics followed</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTopics.map((top) => {
            const isFollowed = followedTopics.includes(top.name);
            return (
              <div
                key={top.id || top.slug}
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

                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed font-normal">
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
                    className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>Explore Topic</span>
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
            <p className="text-sm font-semibold">No topics found matching your search</p>
            <p className="text-xs">
              Try searching with different terms or reset your parent category filter.
            </p>
          </div>
        )}
      </section>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-slate-900 text-white border border-slate-700 shadow-xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-3">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
