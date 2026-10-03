'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listSpecialDesks, listStories } from '../../lib/api-client';
import { useTaxonomy } from '../../lib/news-store';
import { CANONICAL_CATEGORIES, type SpecialDesk, type Story } from '@ai-news/schemas';
import { DynamicIcon } from '../../components/DynamicIcon';
import {
  ArrowLeft,
  Layers,
  Radio,
  Compass,
  Search,
  Check,
  Plus,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export default function CategoriesDirectoryPage() {
  const { categories: dbCategories } = useTaxonomy();
  const [desks, setDesks] = useState<SpecialDesk[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [followedCategories, setFollowedCategories] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const categories = (dbCategories.length > 0 ? dbCategories : CANONICAL_CATEGORIES) as Array<{
    id?: string;
    name: string;
    slug: string;
    code?: string;
    description?: string;
    icon?: string;
    storyCount?: number;
    subCategories?: string[];
  }>;

  useEffect(() => {
    let isMounted = true;
    Promise.all([listSpecialDesks(true), listStories({ limit: 100 })])
      .then(([deskList, storyList]) => {
        if (!isMounted) return;
        setDesks(deskList);
        setStories(storyList);
        setIsLoading(false);
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    try {
      const stored = localStorage.getItem('globalpulse_followed_categories');
      if (stored) {
        setFollowedCategories(JSON.parse(stored));
      } else if (categories.length > 0) {
        setFollowedCategories(categories.slice(0, 4).map((c) => c.name));
      }
    } catch {}

    const handleUpdate = () => {
      try {
        const stored = localStorage.getItem('globalpulse_followed_categories');
        if (stored) setFollowedCategories(JSON.parse(stored));
      } catch {}
    };
    window.addEventListener('globalpulse_categories_updated', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('globalpulse_categories_updated', handleUpdate);
    };
  }, [categories]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const toggleFollow = (categoryName: string) => {
    setFollowedCategories((prev) => {
      const exists = prev.includes(categoryName);
      const updated = exists ? prev.filter((c) => c !== categoryName) : [...prev, categoryName];
      try {
        localStorage.setItem('globalpulse_followed_categories', JSON.stringify(updated));
        window.dispatchEvent(new Event('globalpulse_categories_updated'));
      } catch {}
      showToast(
        exists ? `Unfollowed category: ${categoryName}` : `Following category: ${categoryName}`
      );
      return updated;
    });
  };

  const getStoryCount = (categoryCode: string, slug: string) => {
    return stories.filter(
      (s) =>
        s.articleType === categoryCode ||
        s.articleType === slug ||
        (s.categories && (s.categories.includes(categoryCode) || s.categories.includes(slug)))
    ).length;
  };

  const query = searchQuery.trim().toLowerCase();
  const filteredCategories = categories.filter((c) => {
    if (!query) return true;
    return (
      c.name.toLowerCase().includes(query) ||
      (c.description && c.description.toLowerCase().includes(query)) ||
      c.slug.toLowerCase().includes(query)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header Breadcrumb */}
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-blue-500 font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hover:text-blue-700 dark:hover:text-white transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Newsroom Home
            </Link>
            <span>/</span>
            <Link href="/explore" className="hover:underline">
              Explore
            </Link>
            <span>/</span>
            <span>Categories Only</span>
          </div>

          <Link
            href="/explore"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-sans normal-case"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Explore All (Categories, Topics & Sources)</span>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <Layers className="w-8 h-8 text-blue-500" />
              <span>Editorial News Categories</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Hierarchical news categories, specialized subject verticals, and active pop-up
              coverage desks served dynamically from your newsroom database.
            </p>
          </div>

          {/* Quick Search */}
          <div className="w-full sm:w-72 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter categories..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs placeholder:text-slate-400 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-3"
            >
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800/60 rounded w-3/4" />
              <div className="h-10 bg-slate-200 dark:bg-slate-800/40 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Pop-Up Special Desks Section */}
      {!isLoading && desks.length > 0 && !searchQuery && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
              <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-900 dark:text-white">
                Active Pop-Up Coverage Desks
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {desks.length} Pop-Up Operations Live
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {desks.map((desk) => (
              <Link
                key={desk.id}
                href={`/desks/${desk.slug}`}
                className="group relative overflow-hidden rounded-2xl p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between space-y-4"
                style={{
                  boxShadow: `0 10px 30px -15px ${desk.themeColor || '#3b82f6'}20`,
                }}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5"
                      style={{
                        backgroundColor: `${desk.themeColor || '#3b82f6'}20`,
                        color: desk.themeColor || '#3b82f6',
                        borderColor: `${desk.themeColor || '#3b82f6'}40`,
                        borderWidth: '1px',
                      }}
                    >
                      <Radio className="w-3 h-3 animate-ping" /> Live Desk
                    </span>
                    {desk.liveTickerSymbol && (
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                        {desk.liveTickerSymbol}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition leading-snug">
                    {desk.name}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {desk.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                  <span>Enter Pop-Up Desk</span>
                  <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Categories Grid */}
      {!isLoading && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-900 dark:text-white">
                Primary Newsroom Categories ({filteredCategories.length})
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                {filteredCategories.reduce((acc, c) => acc + (c.subCategories?.length || 0), 0)}{' '}
                Total Editorial Desks
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {followedCategories.length} Categories Followed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((cat) => {
              const code = cat.code || cat.slug;
              const count = cat.storyCount ?? getStoryCount(code, cat.slug);
              const isFollowed = followedCategories.includes(cat.name);
              const deskCount = cat.subCategories?.length || 0;
              return (
                <div
                  key={cat.id || cat.slug}
                  className="rounded-2xl p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 flex flex-col justify-between space-y-5 hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        href={`/category/${cat.slug}`}
                        className="flex items-center gap-3 group-hover:text-blue-600 transition min-w-0"
                      >
                        <span className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60 transition">
                          <DynamicIcon
                            name={cat.icon || cat.slug}
                            fallback="Folder"
                            className="w-5 h-5 text-blue-600 dark:text-blue-400"
                          />
                        </span>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition leading-tight truncate">
                          {cat.name}
                        </h3>
                      </Link>

                      <button
                        onClick={() => toggleFollow(cat.name)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer shrink-0 ${
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

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                      {cat.description}
                    </p>

                    {/* Subcategories / Desks */}
                    {cat.subCategories && cat.subCategories.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                          {cat.subCategories.length} Editorial Desks (Sub-sections)
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {cat.subCategories.map((sub) => (
                            <Link
                              key={sub}
                              href={`/category/${cat.slug}`}
                              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-white text-[11px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 transition"
                            >
                              {sub}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-medium font-mono">
                      {deskCount > 0 && (
                        <span>
                          <strong className="text-slate-700 dark:text-slate-300">
                            {deskCount}
                          </strong>{' '}
                          {deskCount === 1 ? 'desk' : 'desks'}
                        </span>
                      )}
                      {deskCount > 0 && <span>•</span>}
                      <span>
                        <strong className="text-slate-700 dark:text-slate-300">{count || 0}</strong>{' '}
                        {count === 1 ? 'story' : 'stories'}
                      </span>
                    </div>
                    <Link
                      href={`/category/${cat.slug}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-bold transition flex items-center gap-1"
                    >
                      <span>Open Category Hub</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCategories.length === 0 && (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 space-y-2">
              <Layers className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-sm font-semibold">No categories found</p>
              <p className="text-xs">Try clearing your search query.</p>
            </div>
          )}
        </div>
      )}

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
