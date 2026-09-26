import React from 'react';
import Link from 'next/link';
import { DEMO_SOURCES } from '../../lib/demo-data';

export default function SourcesPage() {
  const sources = Object.values(DEMO_SOURCES);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800 space-y-2">
        <div className="text-xs font-mono text-blue-400 font-bold uppercase tracking-wider">
          PROVENANCE & FACT-CHECK REGISTRY
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Verified Sources & Documentation
        </h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
          External AI agents register every consulted publication and official filing before citing claims or updating stories.
        </p>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sources.map((src) => (
          <div
            key={src.id}
            className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                  {src.publisher}
                </span>
                <span className="text-[11px] font-mono text-slate-500">{src.sourceType}</span>
              </div>

              <h2 className="text-base font-bold text-white leading-snug">
                {src.title}
              </h2>

              {src.permissibleExcerpt && (
                <p className="text-xs text-slate-400 italic line-clamp-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  "{src.permissibleExcerpt}"
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>{src.publishedAt ? new Date(src.publishedAt).toLocaleDateString() : 'Active'}</span>
              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-bold transition flex items-center gap-1"
              >
                External Link ↗
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
