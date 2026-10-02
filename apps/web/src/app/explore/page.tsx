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
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { useTaxonomy } from '../../lib/news-store';
import { listPublishers } from '../../lib/api-client';
import { DEMO_PUBLISHERS } from '../../lib/demo-data';
import type { Publisher } from '@ai-news/schemas';

type ExploreTab = 'all' | 'categories' | 'topics' | 'sources';

export default function ExploreHubPage() {
  const { categories, topics } = useTaxonomy();
  const [publishers, setPublishers] = useState<Publisher[]>([]);

  const [activeTab, setActiveTab] = useState<ExploreTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParentCategory, setSelectedParentCategory] = useState<string>('ALL');

  // Follow states
  const [followedCategories, setFollowedCategories] = useState<string[]>([]);
  const [followedTopics, setFollowedTopics] = useState<string[]>([]);
  const [followedSources, setFollowedSources] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load publishers and local follow states
  useEffect(() => {
    let isMounted = true;
    listPublishers()
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          setPublishers(data);
        } else {
          setPublishers(Object.values(DEMO_PUBLISHERS));
        }
      })
      .catch(() => {
        if (isMounted) setPublishers(Object.values(DEMO_PUBLISHERS));
      });

    try {
      const storedCats = localStorage.getItem('globalpulse_followed_categories');
      if (storedCats) setFollowedCategories(JSON.parse(storedCats));
      else if (categories.length > 0)
        setFollowedCategories(categories.slice(0, 4).map((c) => c.name));

      const storedTopics = localStorage.getItem('globalpulse_following');
      if (storedTopics) setFollowedTopics(JSON.parse(storedTopics));
      else if (topics.length > 0) setFollowedTopics(topics.slice(0, 3).map((t) => t.name));

      const storedSources = localStorage.getItem('globalpulse_followed_sources');
      if (storedSources) setFollowedSources(JSON.parse(storedSources));
      else setFollowedSources(['the-hindu', 'reuters']);
    } catch {}

    return () => {
      isMounted = false;
    };
  }, [categories, topics]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Toggle Category Follow
  const toggleFollowCategory = (name: string) => {
    setFollowedCategories((prev) => {
      const exists = prev.includes(name);
      const updated = exists ? prev.filter((c) => c !== name) : [...prev, name];
      try {
        localStorage.setItem('globalpulse_followed_categories', JSON.stringify(updated));
        window.dispatchEvent(new Event('globalpulse_categories_updated'));
      } catch {}
      showToast(exists ? `Unfollowed category: ${name}` : `Following category: ${name}`);
      return updated;
    });
  };

  // Toggle Topic Follow
  const toggleFollowTopic = (name: string) => {
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

  // Toggle Source Follow
  const toggleFollowSource = (slugOrId: string, name: string) => {
    setFollowedSources((prev) => {
      const exists = prev.includes(slugOrId);
      const updated = exists ? prev.filter((s) => s !== slugOrId) : [...prev, slugOrId];
      try {
        localStorage.setItem('globalpulse_followed_sources', JSON.stringify(updated));
        window.dispatchEvent(new Event('globalpulse_sources_updated'));
      } catch {}
      showToast(exists ? `Unfollowed source: ${name}` : `Following source: ${name}`);
      return updated;
    });
  };

  const query = searchQuery.trim().toLowerCase();

  // Filter Categories
  const filteredCategories = categories.filter((c) => {
    if (!query) return true;
    return (
      c.name.toLowerCase().includes(query) ||
      (c.description && c.description.toLowerCase().includes(query)) ||
      c.slug.toLowerCase().includes(query)
    );
  });

  // Filter Topics
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

  // Filter Sources
  const filteredPublishers = publishers.filter((p) => {
    if (!query) return true;
    return (
      p.name.toLowerCase().includes(query) ||
      (p.description && p.description.toLowerCase().includes(query)) ||
      (p.country && p.country.toLowerCase().includes(query)) ||
      (p.category && p.category.toLowerCase().includes(query))
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
          <Compass className="w-4 h-4" />
          <span>Explore Directory</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          Explore Categories, Topics & Sources
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
          Discover verified editorial categories, emerging AI news beats, and trusted global news
          publishers to customize your{' '}
          <Link href="/?tab=following" className="text-blue-600 hover:underline font-semibold">
            Following feed
          </Link>
          .
        </p>

        {/* Global Search Bar */}
        <div className="pt-2 max-w-xl mx-auto">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories, topics, or publishers..."
              className="w-full pl-11 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm placeholder:text-slate-400 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
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

        {/* Section View Tabs */}
        <div className="flex items-center justify-center gap-2 pt-2">
          {(
            [
              {
                id: 'all',
                label: 'All Explorer',
                count: categories.length + topics.length + publishers.length,
              },
              { id: 'categories', label: 'Categories', count: categories.length },
              { id: 'topics', label: 'Topics', count: topics.length },
              { id: 'sources', label: 'Sources', count: publishers.length },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 1: NEWS CATEGORIES */}
      {(activeTab === 'all' || activeTab === 'categories') && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <span>Categories ({filteredCategories.length})</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Core news verticals and editorial bureaus loaded dynamically from the newsroom
                database.
              </p>
            </div>
            <Link
              href="/categories"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View Categories Directory</span>
              <span>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCategories.map((cat) => {
              const isFollowed = followedCategories.includes(cat.name);
              return (
                <div
                  key={cat.id || cat.slug}
                  className="group p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xl px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
                        {cat.icon || '📁'}
                      </span>
                      <button
                        onClick={() => toggleFollowCategory(cat.name)}
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
                      {cat.description || 'Verified news bureau dispatches and breaking reporting.'}
                    </p>

                    {cat.subCategories && cat.subCategories.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {(cat.subCategories as string[]).slice(0, 3).map((sub: string) => (
                          <span
                            key={sub}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-400 text-[11px]">
                      {cat.storyCount ? `${cat.storyCount} dispatches` : 'Live bureau'}
                    </span>
                    <Link
                      href={`/category/${cat.slug}`}
                      className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                    >
                      <span>Browse Stories</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION 2: SPECIALIZED TOPICS */}
      {(activeTab === 'all' || activeTab === 'topics') && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-purple-600" />
                <span>Topics ({filteredTopics.length})</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Specialized news topics, AI cluster entities, and developing geopolitical beats.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                {parentCategoriesList.slice(0, 6).map((cat) => (
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

              <Link
                href="/topic"
                className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 shrink-0"
              >
                <span>All Topics</span>
                <span>→</span>
              </Link>
            </div>
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
                        onClick={() => toggleFollowTopic(top.name)}
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
                      {top.storyCount ? `${top.storyCount} articles` : 'Continuous monitoring'}
                    </span>
                    <Link
                      href={`/topics/${top.slug}`}
                      className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:underline"
                    >
                      <span>View Dossier</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION 3: SOURCES & PUBLISHERS */}
      {(activeTab === 'all' || activeTab === 'sources') && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <span>Sources & Publishers ({filteredPublishers.length})</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Verified international news wire services, investigative agencies, and regional
                publishers.
              </p>
            </div>
            <Link
              href="/sources"
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>View All Sources</span>
              <span>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPublishers.map((pub) => {
              const isFollowed =
                followedSources.includes(pub.slug) || followedSources.includes(pub.id);
              return (
                <div
                  key={pub.id}
                  className="group p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-500 transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-sm overflow-hidden border border-slate-200 dark:border-slate-700">
                          {pub.logoUrl ? (
                            <img
                              src={pub.logoUrl}
                              alt={pub.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            pub.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase font-bold">
                            {pub.category || 'General'}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                            {pub.name}
                          </h4>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleFollowSource(pub.slug || pub.id, pub.name)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                          isFollowed
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
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

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
                      {pub.description}
                    </p>

                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        <span>{pub.credibilityScore ?? 95}% Credibility</span>
                      </span>
                      <span>•</span>
                      <span>{pub.country || 'Global'}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-400 text-[11px]">
                      {pub.followerCount
                        ? `${pub.followerCount.toLocaleString()} followers`
                        : 'Verified wire'}
                    </span>
                    <Link
                      href={`/sources/${pub.slug}`}
                      className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
                    >
                      <span>Source Profile</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION 4: FACT CHECK & VERIFICATION BUREAU */}
      <section className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-linear-to-r from-emerald-500/10 via-slate-50 to-indigo-500/10 dark:from-emerald-950/20 dark:via-slate-900 dark:to-indigo-950/20 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-4 h-4" />
            <span>Independent Verification Desk</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Explore All Fact-Checked Dispatches & Debunks
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl">
            Audit our full ledger of evaluated claims, scientific verifications, and viral social
            media debunks complete with primary source evidence.
          </p>
        </div>

        <Link
          href="/fact-checks"
          className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
        >
          <span>Explore Fact Checks</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-slate-900 text-white border border-slate-700 shadow-xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-3">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
