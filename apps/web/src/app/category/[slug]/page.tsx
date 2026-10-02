'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useNewsClusters } from '../../../lib/cluster-builder';
import { useCategoryStories, useTaxonomy } from '../../../lib/news-store';
import { GoogleNewsLeadCard } from '../../../components/GoogleNewsLeadCard';
import { GoogleNewsClusterCard } from '../../../components/GoogleNewsClusterCard';
import { WeatherWidget } from '../../../components/WeatherWidget';
import { TrendingTopicsWidget } from '../../../components/TrendingTopicsWidget';
import { FullCoverageModal } from '../../../components/FullCoverageModal';
import { ArrowLeft, Rss, Newspaper, Filter, Sparkles } from 'lucide-react';
import { CANONICAL_CATEGORIES } from '@ai-news/schemas';

/**
 * Intelligent matcher to match story clusters and dispatches to specific subcategory desks
 */
function matchesSubCategory(
  item: {
    title?: string;
    summary?: string;
    slug?: string;
    topicIds?: string[];
    categories?: string[];
    leadStory?: { headline: string; excerpt?: string };
    relatedArticles?: Array<{ headline: string; publisher?: string }>;
  },
  sub: string
): boolean {
  if (!sub) return true;
  const subNorm = sub.toLowerCase().trim();
  const subSingular = subNorm.endsWith('s') ? subNorm.slice(0, -1) : subNorm;

  // Search tokens including singular and plural
  const searchTerms = [subNorm, subSingular];

  // Specific domain synonym mappings for known editorial desks
  if (subNorm.includes('artificial intelligence') || subNorm === 'ai') {
    searchTerms.push('ai', 'agent', 'model', 'neural', 'machine learning', 'llm');
  }
  if (subNorm.includes('semiconductor')) {
    searchTerms.push('chip', 'lithography', 'wafer', 'foundry', 'tsmc', 'transistor');
  }
  if (subNorm.includes('quantum')) {
    searchTerms.push('qubit', 'quantum computing', 'superconducting');
  }
  if (subNorm.includes('cybersecurity')) {
    searchTerms.push('security', 'vulnerability', 'breach', 'ransomware', 'crypto');
  }
  if (subNorm.includes('digital policy')) {
    searchTerms.push('policy', 'regulation', 'antitrust', 'governance', 'copyright');
  }
  if (subNorm.includes('energy') || subNorm.includes('climate')) {
    searchTerms.push('fusion', 'nuclear', 'reactor', 'solar', 'wind', 'renewable', 'carbon');
  }

  // 1. Check topicIds (e.g. "top_semiconductors")
  if (item.topicIds && item.topicIds.length > 0) {
    for (const t of item.topicIds) {
      const tNorm = t.toLowerCase().replace(/^top_/, '').replace(/[-_]/g, ' ');
      for (const term of searchTerms) {
        if (tNorm.includes(term) || term.includes(tNorm)) return true;
      }
    }
  }

  // 2. Check categories array if present
  if (item.categories && item.categories.length > 0) {
    for (const c of item.categories) {
      const cNorm = c.toLowerCase();
      for (const term of searchTerms) {
        if (cNorm.includes(term) || term.includes(cNorm)) return true;
      }
    }
  }

  // 3. Check combined text fields
  const fullText = [
    item.title || '',
    item.summary || '',
    item.slug || '',
    item.leadStory?.headline || '',
    item.leadStory?.excerpt || '',
    ...(item.relatedArticles?.map((r) => r.headline) || []),
  ]
    .join(' ')
    .toLowerCase();

  for (const term of searchTerms) {
    if (term.length <= 3) {
      const re = new RegExp(`\\b${term}\\b`, 'i');
      if (re.test(fullText)) return true;
    } else {
      if (fullText.includes(term)) return true;
    }
  }

  return false;
}

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

  // Match category clusters strictly
  const categoryClusters = useMemo(() => {
    return allClusters.filter((c) => c.category.toLowerCase() === slug.toLowerCase());
  }, [allClusters, slug]);

  // Filter clusters by selected subcategory / desk
  const displayClusters = useMemo(() => {
    if (!selectedSub) return categoryClusters;
    return categoryClusters.filter((c) => {
      // Find matching underlying story to inspect topics as well
      const underlyingStory = categoryStories.find((s) => s.id === c.mainStoryId);
      const combined = {
        ...c,
        topicIds: underlyingStory?.topicIds || [],
        categories: underlyingStory?.categories || [],
      };
      return matchesSubCategory(combined, selectedSub);
    });
  }, [categoryClusters, selectedSub, categoryStories]);

  const leadCluster = displayClusters[0] || null;
  const secondaryClusters = displayClusters.slice(1);

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
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold transition-all">
              {displayClusters.length} Published
            </span>
            {selectedSub && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3" /> Filtered by {selectedSub}
              </span>
            )}
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
            <Filter className="w-3 h-3 text-blue-500" /> Desks (Sub-sections):
          </span>
          <button
            onClick={() => setSelectedSub(null)}
            className={`px-3 py-1 rounded-full font-bold transition shrink-0 cursor-pointer ${
              selectedSub === null
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All {categoryName}
          </button>
          {subCategories.map((sub) => {
            const isSelected = selectedSub === sub;
            return (
              <button
                key={sub}
                onClick={() => setSelectedSub(isSelected ? null : sub)}
                className={`px-3 py-1 rounded-full font-medium transition shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60'
                }`}
                title={`Filter stories by ${sub}`}
              >
                {sub}
              </button>
            );
          })}
        </div>
      )}

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Category Feed */}
        <div className="lg:col-span-8 space-y-6">
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

          {/* Empty State for Subcategory Desk */}
          {selectedSub && displayClusters.length === 0 && (
            <div className="p-10 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-3">
              <Filter className="w-8 h-8 mx-auto text-blue-500/70" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Stories Found in the &ldquo;{selectedSub}&rdquo; Desk
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                No published stories currently match the {selectedSub} desk in {categoryName}.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setSelectedSub(null)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  Show All {categoryName} Stories
                </button>
              </div>
            </div>
          )}

          {/* Empty State for Entire Category */}
          {!selectedSub && displayClusters.length === 0 && (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-3">
              <Newspaper className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Stories in {categoryName}
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
