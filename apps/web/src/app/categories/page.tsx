'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listSpecialDesks, listStories } from '../../lib/api-client';
import { CANONICAL_CATEGORIES, type SpecialDesk, type Story } from '@ai-news/schemas';
import { ArrowLeft, Layers, Radio, ExternalLink, Compass } from 'lucide-react';

export default function CategoriesDirectoryPage() {
  const [desks, setDesks] = useState<SpecialDesk[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

    return () => {
      isMounted = false;
    };
  }, []);

  const getStoryCount = (categoryCode: string, slug: string) => {
    return stories.filter(
      (s) =>
        s.articleType === categoryCode ||
        s.articleType === slug ||
        (s.categories && (s.categories.includes(categoryCode) || s.categories.includes(slug)))
    ).length;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-blue-400 font-bold uppercase tracking-wider">
          <Link href="/" className="hover:text-white transition flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Newsroom Home
          </Link>
          <span>/</span>
          <span>Editorial Taxonomy Directory</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight flex items-center gap-3">
              <Layers className="w-8 h-8 text-blue-500" />
              <span>News Categories & Pop-Up Desks</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-2xl">
              Hierarchical news taxonomy, specialized beat hubs, and live pop-up coverage desks
              curated by GlobalPulse editors and autonomous AI news agents.
            </p>
          </div>
          <Link
            href="/explore"
            className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
          >
            <Compass className="w-4 h-4 text-blue-400" />
            <span>Interactive Visualizer</span>
          </Link>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-3"
            >
              <div className="h-5 bg-slate-800 rounded w-1/3" />
              <div className="h-4 bg-slate-800/60 rounded w-3/4" />
              <div className="h-10 bg-slate-800/40 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Pop-Up Special Desks Section */}
      {!isLoading && (
        <>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
                <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-white">
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
                  className="group relative overflow-hidden rounded-2xl p-6 border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition flex flex-col justify-between space-y-4"
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
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/60">
                          {desk.liveTickerSymbol}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition leading-snug">
                      {desk.name}
                    </h3>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {desk.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-blue-400">
                    <span>Enter Pop-Up Desk</span>
                    <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Canonical Categories & Subcategories Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-white">
                Primary Category Taxonomy & Subcategories
              </h2>
              <span className="text-xs font-mono text-slate-400">
                {CANONICAL_CATEGORIES.length} Core Desks
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {CANONICAL_CATEGORIES.map((cat) => {
                const count = getStoryCount(cat.code, cat.slug);
                return (
                  <div
                    key={cat.code}
                    className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-5 hover:border-slate-700 transition"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{cat.icon}</span>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {count} Dispatches
                        </span>
                      </div>

                      <div>
                        <Link
                          href={`/category/${cat.slug}`}
                          className="text-lg font-black text-white hover:text-blue-400 transition inline-flex items-center gap-1.5"
                        >
                          <span>{cat.name}</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                        </Link>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {cat.description}
                        </p>
                      </div>

                      {/* Subcategories */}
                      {cat.subCategories && cat.subCategories.length > 0 && (
                        <div className="space-y-1.5 pt-2">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                            Specialized Subcategories
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {cat.subCategories.map((sub) => (
                              <Link
                                key={sub}
                                href={`/category/${cat.slug}`}
                                className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 hover:text-white text-[11px] text-slate-300 border border-slate-700/80 transition"
                              >
                                {sub}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <Link
                        href={`/category/${cat.slug}`}
                        className="text-blue-400 hover:text-blue-300 font-bold transition flex items-center gap-1"
                      >
                        <span>Open Category Hub</span> &rarr;
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
