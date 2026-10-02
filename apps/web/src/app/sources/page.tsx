'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { listPublishers, listSources, listFollowing } from '../../lib/api-client';
import { DEMO_PUBLISHERS, DEMO_SOURCES } from '../../lib/demo-data';
import { PublisherCard } from '../../components/PublisherCard';
import { formatDeterministicDate } from '../../lib/date-utils';
import {
  FileText,
  ExternalLink,
  ArrowLeft,
  Search,
  SlidersHorizontal,
  Building2,
} from 'lucide-react';
import type { Publisher, Source } from '@ai-news/schemas';

const CATEGORIES = [
  { id: 'all', label: 'All Publications' },
  { id: 'general', label: 'National & General' },
  { id: 'world', label: 'Global Wires' },
  { id: 'business', label: 'Business & Markets' },
  { id: 'technology', label: 'Technology & AI' },
  { id: 'science', label: 'Science & Research' },
];

export default function SourcesPage() {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showRawArticles, setShowRawArticles] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load publishers, sources, and following state
  useEffect(() => {
    let isMounted = true;

    // Load initial followed sources from localStorage
    try {
      const stored = localStorage.getItem('globalpulse_followed_sources');
      if (stored) {
        setFollowedIds(new Set(JSON.parse(stored)));
      }
    } catch {}

    Promise.all([
      listPublishers().catch(() => []),
      listSources().catch(() => []),
      listFollowing('source').catch(() => []),
    ]).then(([pubData, srcData, followData]) => {
      if (!isMounted) return;

      const loadedPubs =
        Array.isArray(pubData) && pubData.length > 0 ? pubData : Object.values(DEMO_PUBLISHERS);

      const loadedSources =
        Array.isArray(srcData) && srcData.length > 0 ? srcData : Object.values(DEMO_SOURCES);

      setPublishers(loadedPubs);
      setSources(loadedSources);

      if (Array.isArray(followData) && followData.length > 0) {
        setFollowedIds((prev) => {
          const next = new Set(prev);
          followData.forEach((f) => next.add(f.targetId));
          return next;
        });
      }

      setIsLoading(false);
    });

    const handleUpdate = () => {
      try {
        const stored = localStorage.getItem('globalpulse_followed_sources');
        if (stored) setFollowedIds(new Set(JSON.parse(stored)));
      } catch {}
    };

    window.addEventListener('globalpulse_sources_updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('globalpulse_sources_updated', handleUpdate);
    };
  }, []);

  // Filter publishers based on search query and category
  const filteredPublishers = useMemo(() => {
    return publishers.filter((pub) => {
      const matchesCategory =
        selectedCategory === 'all' || pub.category.toLowerCase() === selectedCategory.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        pub.name.toLowerCase().includes(q) ||
        pub.domain.toLowerCase().includes(q) ||
        (pub.description && pub.description.toLowerCase().includes(q)) ||
        (pub.country && pub.country.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [publishers, selectedCategory, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header Breadcrumb & Title */}
      <div className="space-y-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-mono text-blue-400 font-bold uppercase tracking-wider">
          <Link href="/" className="hover:text-white transition flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Newsroom Home
          </Link>
          <span>/</span>
          <Link href="/explore" className="hover:text-white transition">
            Explore
          </Link>
          <span>/</span>
          <span>Sources & Publishers Only</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Explore Verified Sources</span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Google News Model
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mt-2 leading-relaxed">
              Explore and follow news publications, wires, and research institutes. Both readers and
              external AI agents can follow sources to customize coverage and verify fact-checking
              provenance.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-400 shrink-0">
            <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>
                <strong className="text-white">{publishers.length}</strong> Publishers
              </span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>
                <strong className="text-white">{sources.length}</strong> Cited Links
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search publications by name or domain..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Quick toggle to show raw cited article links */}
          <button
            onClick={() => setShowRawArticles(!showRawArticles)}
            type="button"
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-colors cursor-pointer ${
              showRawArticles
                ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>
              {showRawArticles ? 'Viewing Cited Article Links' : 'Show Granular Article Registry'}
            </span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl p-6 border border-slate-800 bg-slate-900/40 animate-pulse space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-800 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-800 rounded w-1/2" />
                  <div className="h-3 bg-slate-800/60 rounded w-1/3" />
                </div>
              </div>
              <div className="h-10 bg-slate-800/40 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Publishers Grid */}
      {!isLoading && !showRawArticles && (
        <>
          {filteredPublishers.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 space-y-3">
              <Building2 className="w-10 h-10 mx-auto text-slate-500" />
              <h3 className="text-base font-bold text-white">No Publications Found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No news sources match your search query "{searchQuery}". Try searching for "The
                Hindu", "Reuters", or "Bloomberg".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPublishers.map((publisher) => (
                <PublisherCard
                  key={publisher.id}
                  publisher={publisher}
                  isInitiallyFollowing={
                    followedIds.has(publisher.id) || followedIds.has(publisher.slug)
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Raw Cited Article URLs View (Granular Verification) */}
      {!isLoading && showRawArticles && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs text-blue-300">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>
                Displaying individual article reference links registered across all stories.
                Specific articles (e.g. <code>thehindu.com/news1</code>) roll up into parent
                publications above.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sources.map((src) => (
              <div
                key={src.id}
                className="rounded-2xl p-5 border border-slate-800 bg-slate-900/60 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                      {src.publisher}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{src.sourceType}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white line-clamp-2">{src.title}</h3>

                  {src.permissibleExcerpt && (
                    <p className="text-xs text-slate-400 italic line-clamp-3 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                      "{src.permissibleExcerpt}"
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span suppressHydrationWarning>
                    {formatDeterministicDate(src.publishedAt || src.createdAt)}
                  </span>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                  >
                    <span>Visit Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
