'use client';

import React from 'react';
import type { DocumentViewerBlock } from '@ai-news/schemas';

export const DocumentViewerBlockView: React.FC<{ data: DocumentViewerBlock['data'] }> = ({
  data,
}) => {
  const [activeHighlightIndex, setActiveHighlightIndex] = React.useState<number>(0);
  const [copiedExcerpt, setCopiedExcerpt] = React.useState<boolean>(false);

  const typeConfig: Record<string, { label: string; badgeClass: string; icon: string }> = {
    court_filing: {
      label: 'Court Filing',
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: '🏛',
    },
    treaty: {
      label: 'Diplomatic Treaty',
      badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      icon: '📜',
    },
    financial_disclosure: {
      label: 'Financial Disclosure',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: '📊',
    },
    leak: {
      label: 'Classified / Leaked Memo',
      badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      icon: '🔒',
    },
    whitepaper: {
      label: 'Research Whitepaper',
      badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      icon: '📑',
    },
    regulatory_directive: {
      label: 'Regulatory Directive',
      badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      icon: '⚖',
    },
  };

  const config = typeConfig[data.documentType] || typeConfig.whitepaper;
  const activeHighlight =
    data.highlights && data.highlights.length > 0 ? data.highlights[activeHighlightIndex] : null;

  const handleCopy = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedExcerpt(true);
        setTimeout(() => setCopiedExcerpt(false), 2000);
      });
    }
  };

  return (
    <div className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${config.badgeClass}`}
          >
            <span>{config.icon}</span>
            <span>{config.label}</span>
          </span>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {data.pageCount} {data.pageCount === 1 ? 'Page' : 'Pages'}
          </span>
        </div>

        <a
          href={data.documentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium border border-slate-200 dark:border-slate-700 transition cursor-pointer"
        >
          <span>View Source Document</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>

      {/* Document Title & Description */}
      <div className="mt-4">
        <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
          {data.title}
        </h4>
        {data.description && (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {data.description}
          </p>
        )}
        {data.sourceAttribution && (
          <div className="mt-2 text-xs text-slate-500 font-mono">
            Source Attribution: {data.sourceAttribution}
          </div>
        )}
      </div>

      {/* Highlights / Evidence Section */}
      {data.highlights && data.highlights.length > 0 && (
        <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800/60">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Verified Highlight Excerpts ({data.highlights.length})
            </div>
            {activeHighlight && (
              <button
                onClick={() => handleCopy(activeHighlight.excerpt)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline transition flex items-center gap-1 cursor-pointer font-semibold"
              >
                <span>{copiedExcerpt ? '✓ Copied' : 'Copy Excerpt'}</span>
              </button>
            )}
          </div>

          {/* Highlight selector tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {data.highlights.map((hl, idx) => (
              <button
                key={idx}
                onClick={() => setActiveHighlightIndex(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  activeHighlightIndex === idx
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200/70 dark:border-slate-700/60'
                }`}
              >
                P. {hl.page} {hl.tag ? `• ${hl.tag}` : ''}
              </button>
            ))}
          </div>

          {/* Active Highlight Excerpt Card */}
          {activeHighlight && (
            <div className="mt-4 p-4 rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 relative">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                  Page {activeHighlight.page}
                </span>
                {activeHighlight.tag && (
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {activeHighlight.tag}
                  </span>
                )}
              </div>

              <blockquote className="text-sm font-serif italic text-slate-800 dark:text-slate-200 pl-3 border-l-2 border-indigo-500 my-2 leading-relaxed">
                "{activeHighlight.excerpt}"
              </blockquote>

              {activeHighlight.note && (
                <div className="mt-3 pt-2 border-t border-indigo-200/60 dark:border-indigo-500/10 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                    Annotation:
                  </span>
                  <span>{activeHighlight.note}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
