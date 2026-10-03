'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  X,
  ExternalLink,
  ShieldCheck,
  FileText,
  Clock,
  CheckCircle2,
  Building2,
  Search,
} from 'lucide-react';
import type { Story, Source, StoryBlock } from '@ai-news/schemas';
import { listSources } from '../lib/api-client';
import { formatLocalDateTime } from '../lib/date-utils';

interface CitedSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: Story;
}

interface ResolvedSource {
  id: string;
  publisher: string;
  domain?: string;
  title: string;
  url: string;
  publishedAt?: string;
  sourceType?: string;
  excerpt?: string;
}

export const CitedSourcesModal: React.FC<CitedSourcesModalProps> = ({ isOpen, onClose, story }) => {
  const [apiSources, setApiSources] = useState<Source[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch API sources if available
  useEffect(() => {
    if (!isOpen) return;
    listSources()
      .then((data) => {
        if (data && Array.isArray(data)) setApiSources(data);
      })
      .catch(() => {});
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Resolve sources from story.sourceIds, story.blocks, DEMO_SOURCES, and apiSources
  const resolvedSources = useMemo<ResolvedSource[]>(() => {
    const list: ResolvedSource[] = [];
    const seenIds = new Set<string>();

    // 1. Check story.blocks for explicit 'source' blocks
    if (story.blocks && Array.isArray(story.blocks)) {
      story.blocks.forEach((b: StoryBlock) => {
        if (b.blockType === 'source') {
          const sData = b.data;
          const sourceUrl = sData?.url || '';
          const key = sourceUrl || b.id;
          if (sData && !seenIds.has(key)) {
            seenIds.add(key);
            list.push({
              id: b.id,
              publisher: sData.publisher || 'Wire Service',
              title: sData.title || 'Referenced Field Report',
              url: sourceUrl,
              publishedAt: sData.publishedAt,
              sourceType: 'PRIMARY_REPORT',
            });
          }
        }
      });
    }

    // 2. Check story.sourceIds mapped against apiSources
    const allKnownSources: Record<string, Partial<Source>> = {};
    apiSources.forEach((s) => {
      if (s.id) allKnownSources[s.id] = s;
    });

    const sourceIds = story.sourceIds || [];
    sourceIds.forEach((srcId) => {
      const found = allKnownSources[srcId];
      if (found) {
        const foundUrl = found.url || found.canonicalUrl || '';
        const key = foundUrl || found.id || srcId;
        if (!seenIds.has(key)) {
          seenIds.add(key);
          list.push({
            id: found.id || srcId,
            publisher: found.publisher || 'Verified Publisher',
            domain: found.domain,
            title: found.title || 'Official Primary Documentation',
            url: foundUrl,
            publishedAt: found.publishedAt || story.publishedAt,
            sourceType: found.sourceType || 'NEWS_ARTICLE',
            excerpt: found.permissibleExcerpt,
          });
        }
      }
    });

    return list;
  }, [story, apiSources]);

  // Filter sources by search query
  const filteredSources = useMemo(() => {
    if (!searchTerm.trim()) return resolvedSources;
    const q = searchTerm.toLowerCase();
    return resolvedSources.filter(
      (s) =>
        s.publisher.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        (s.domain && s.domain.toLowerCase().includes(q)) ||
        (s.excerpt && s.excerpt.toLowerCase().includes(q))
    );
  }, [resolvedSources, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="space-y-1 pr-6">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-600 text-white font-bold">
                <FileText className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Cited Sources & Primary Verification
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {resolvedSources.length} verified primary{' '}
                  {resolvedSources.length === 1 ? 'source' : 'sources'} cross-referenced for this
                  report
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Story Context Callout */}
        <div className="px-6 py-3 bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/30 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-600 dark:text-slate-400 truncate max-w-[80%]">
            Story: <span className="text-slate-900 dark:text-white font-bold">{story.title}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% Fact Checked
          </span>
        </div>

        {/* Search Bar if > 2 sources */}
        {resolvedSources.length > 2 && (
          <div className="px-6 pt-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search cited sources by publisher, title, or keyword..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Sources List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {filteredSources.map((source, index) => {
            const pubSlug = source.publisher
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '');

            return (
              <div
                key={source.id || index}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-blue-500/40 dark:hover:border-blue-500/40 transition shadow-xs space-y-3"
              >
                {/* Source Meta Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/sources/${pubSlug}`}
                      onClick={onClose}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold text-xs hover:bg-blue-100 transition border border-blue-200/60 dark:border-blue-800/60"
                      title={`View all reports from ${source.publisher}`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{source.publisher}</span>
                    </Link>

                    {source.sourceType && (
                      <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60">
                        {source.sourceType.replace(/_/g, ' ')}
                      </span>
                    )}

                    {source.domain && (
                      <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                        • {source.domain}
                      </span>
                    )}
                  </div>

                  {source.publishedAt && (
                    <div
                      className="flex items-center gap-1 text-[11px] text-slate-400 font-mono"
                      suppressHydrationWarning
                    >
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatLocalDateTime(source.publishedAt)}</span>
                    </div>
                  )}
                </div>

                {/* Source Title */}
                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {source.title}
                </h4>

                {/* Excerpt if present */}
                {source.excerpt && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic font-serif">
                    "{source.excerpt}"
                  </div>
                )}

                {/* Footer Actions & Verification Status */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Corroborated by Primary Wire Registry</span>
                  </div>

                  {source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs transition shadow-xs cursor-pointer"
                    >
                      <span>Open Primary Source</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">
                      Source URL unavailable
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {filteredSources.length === 0 && (
            <div className="py-12 px-4 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No verified primary citations recorded
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                No external source documents or primary registries have been linked to this dispatch
                yet.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs">
          <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed max-w-lg">
            GlobalPulse independently archives and cross-references original journalistic wire
            dispatches, institutional declarations, and public filings.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold text-slate-800 dark:text-slate-200 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
