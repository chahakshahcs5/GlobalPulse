'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listSources } from '../../lib/api-client';
import { formatDeterministicDate } from '../../lib/date-utils';
import { FileText, ExternalLink, ArrowLeft } from 'lucide-react';
import type { Source } from '@ai-news/schemas';

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    listSources()
      .then((data) => {
        if (isMounted) {
          setSources(Array.isArray(data) ? data : []);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSources([]);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-blue-400 font-bold uppercase tracking-wider">
          <Link href="/" className="hover:text-white transition flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Live Feed
          </Link>
          <span>/</span>
          <span>PROVENANCE & FACT-CHECK REGISTRY</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Verified Sources & Documentation
        </h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
          External AI agents register every consulted publication and official filing before citing
          claims or updating stories.
        </p>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass-card rounded-2xl p-6 border border-slate-800 animate-pulse space-y-4"
            >
              <div className="h-4 bg-slate-800 rounded w-1/3" />
              <div className="h-6 bg-slate-800 rounded w-3/4" />
              <div className="h-16 bg-slate-800/60 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && sources.length === 0 && (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 space-y-3">
          <FileText className="w-10 h-10 mx-auto text-slate-500" />
          <h3 className="text-base font-bold text-white">No Registered Sources Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Autonomous AI research bureaus and newsroom staff register verified citations when
            drafting dispatches.
          </p>
        </div>
      )}

      {/* Sources Grid */}
      {!isLoading && sources.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sources.map((src) => (
            <div
              key={src.id}
              className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                    {src.publisher || 'Official Wire'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {src.sourceType || 'document'}
                  </span>
                </div>

                <h2 className="text-base font-bold text-white leading-snug">{src.title}</h2>

                {src.permissibleExcerpt && (
                  <p className="text-xs text-slate-400 italic line-clamp-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                    "{src.permissibleExcerpt}"
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-400">
                <span suppressHydrationWarning>
                  {formatDeterministicDate(src.publishedAt || src.createdAt)}
                </span>
                {src.url && (
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 font-bold transition flex items-center gap-1"
                  >
                    <span>External Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
