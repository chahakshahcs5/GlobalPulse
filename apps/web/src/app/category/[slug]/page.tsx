'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useNewsClusters } from '../../../lib/cluster-builder';
import { useCategoryStories, useTaxonomy } from '../../../lib/news-store';
import { GoogleNewsLeadCard } from '../../../components/GoogleNewsLeadCard';
import { GoogleNewsClusterCard } from '../../../components/GoogleNewsClusterCard';
import { WeatherWidget } from '../../../components/WeatherWidget';
import { TrendingTopicsWidget } from '../../../components/TrendingTopicsWidget';
import { FullCoverageModal } from '../../../components/FullCoverageModal';
import { ArrowLeft, Rss, Clock, ShieldCheck, Newspaper, Filter } from 'lucide-react';
import { formatDeterministicDate } from '../../../lib/date-utils';
import { CANONICAL_CATEGORIES } from '@ai-news/schemas';

export default function CategoryPage() {
  const params = useParams();
  const slug = (params?.slug as string) || '';
  const [activeFullCoverageSlug, setActiveFullCoverageSlug] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);

  // Dynamic API stories and taxonomy for this category
  const { stories: categoryStories } = useCategoryStories(slug);
  const { clusters: allClusters } = useNewsClusters();
  const { categories } = useTaxonomy();

  const currentCategory = categories.find(
    (c) =>
      c.slug.toLowerCase() === slug.toLowerCase() ||
      (c.code && c.code.toLowerCase() === slug.toLowerCase())
  );
  const canonical = CANONICAL_CATEGORIES.find(
    (c) =>
      c.slug.toLowerCase() === slug.toLowerCase() || c.code.toLowerCase() === slug.toLowerCase()
  );

  const categoryName =
    currentCategory?.name ||
    canonical?.name ||
    (slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'Category');

  const subCategories =
    currentCategory?.subCategories && currentCategory.subCategories.length > 0
      ? currentCategory.subCategories
      : canonical?.subCategories || [];

  const filteredStories = selectedSub
    ? categoryStories.filter((s) => {
        if (
          s.categories &&
          s.categories.some((c) => c.toLowerCase() === selectedSub.toLowerCase())
        ) {
          return true;
        }
        const text = `${s.title} ${s.summary} ${s.slug}`.toLowerCase();
        return text.includes(selectedSub.toLowerCase());
      })
    : categoryStories;

  // Match category clusters strictly
  const categoryClusters = allClusters.filter(
    (c) => c.category.toLowerCase() === slug.toLowerCase()
  );
  const leadCluster = categoryClusters[0] || null;
  const secondaryClusters = categoryClusters.slice(1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Category Masthead */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-blue-600 font-bold uppercase tracking-wider">
            <Link href="/" className="hover:underline flex items-center gap-1 text-slate-500">
              <ArrowLeft className="w-3.5 h-3.5" /> Top Stories
            </Link>
            <span>/</span>
            <span>Category Hub</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {categoryName}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold">
              {categoryStories.length} Published
            </span>
          </div>
        </div>

        {/* Category RSS Syndication Link */}
        <div className="flex items-center gap-2">
          <a
            href={`/feeds/${slug}/rss.xml`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/60 transition"
          >
            <Rss className="w-3.5 h-3.5" />
            <span>RSS Feed</span>
          </a>
        </div>
      </div>

      {/* Subcategory Filter Chips */}
      {subCategories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
          <span className="text-slate-400 font-mono text-[11px] uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3 text-blue-500" /> Desks:
          </span>
          <button
            onClick={() => setSelectedSub(null)}
            className={`px-3 py-1 rounded-full font-bold transition shrink-0 ${
              selectedSub === null
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All {categoryName}
          </button>
          {subCategories.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSub(selectedSub === sub ? null : sub)}
              className={`px-3 py-1 rounded-full font-medium transition shrink-0 ${
                selectedSub === sub
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Category Feed */}
        <div className="lg:col-span-8 space-y-6">
          {/* Dynamic Category Stories from Database / API */}
          {filteredStories.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-blue-600" />
                  <span>
                    {selectedSub
                      ? `${selectedSub} Dispatches`
                      : `Live Dispatches in ${categoryName}`}
                  </span>
                </div>
                <span className="font-mono text-[11px]">
                  {filteredStories.length}{' '}
                  {filteredStories.length === 1 ? 'Dispatch' : 'Dispatches'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStories.slice(0, 8).map((story) => (
                  <Link
                    key={story.id}
                    href={`/stories/${story.slug}`}
                    className="group p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide text-[10px]">
                          {story.articleType.replace('_', ' ')}
                        </span>
                        <span
                          className="flex items-center gap-1 text-[11px]"
                          suppressHydrationWarning
                        >
                          <Clock className="w-3 h-3" />
                          {formatDeterministicDate(story.publishedAt)}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition leading-snug">
                        {story.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {story.summary}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </span>
                      <span>Read Story &rarr;</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {leadCluster && (
            <GoogleNewsLeadCard
              cluster={leadCluster}
              onOpenFullCoverage={(s) => setActiveFullCoverageSlug(s)}
            />
          )}

          <div className="space-y-4">
            {secondaryClusters.map((cluster) => (
              <GoogleNewsClusterCard
                key={cluster.id}
                cluster={cluster}
                onOpenFullCoverage={(s) => setActiveFullCoverageSlug(s)}
              />
            ))}
          </div>

          {categoryStories.length === 0 && !leadCluster && (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-3">
              <Newspaper className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Dispatches in {categoryName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                There are currently no published stories categorized under {categoryName}. Check
                back shortly or browse other categories.
              </p>
              <div className="pt-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Top Stories</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <WeatherWidget />
          <TrendingTopicsWidget />
        </div>
      </div>

      {/* Full Coverage Modal */}
      <FullCoverageModal
        slug={activeFullCoverageSlug}
        onClose={() => setActiveFullCoverageSlug(null)}
      />
    </div>
  );
}
