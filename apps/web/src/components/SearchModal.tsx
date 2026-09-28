'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, X, Clock, BookOpen, Loader2 } from 'lucide-react';
import { useAllStories } from '../lib/news-store';
import * as api from '../lib/api-client';
import { formatDeterministicDate } from '../lib/date-utils';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [apiResults, setApiResults] = useState<any[] | null>(null);
  const { stories } = useAllStories();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced API search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setApiResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.searchStories(trimmed, 20);
        if (res?.items) {
          // Map to story format
          const mapped = res.items.map((item: any) => {
            const fullStory = stories.find((s) => s.id === item.storyId);
            return {
              id: item.storyId,
              title: item.title,
              summary: item.summary,
              slug: fullStory?.slug || item.storyId,
              articleType: item.articleType || 'news',
              publishedAt: item.publishedAt,
            };
          });
          setApiResults(mapped);
        } else {
          setApiResults(null);
        }
      } catch {
        setApiResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, stories]);

  if (!isOpen) return null;

  const trimmed = query.trim().toLowerCase();
  // Fallback to local filter if API results aren't available yet or failed
  const localResults = trimmed
    ? stories.filter(
        (s) =>
          s.title.toLowerCase().includes(trimmed) ||
          s.summary.toLowerCase().includes(trimmed) ||
          (s.articleType || '').toLowerCase().includes(trimmed)
      )
    : [];

  const results = apiResults !== null ? apiResults : localResults;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/70 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          {isSearching ? (
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
          ) : (
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
          )}
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search news, topics, sources, and verified dispatches..."
            className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none text-base"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            ESC
          </button>
        </div>

        {/* Search Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
          {!query && (
            <div className="py-6 text-center text-slate-500 text-sm space-y-3">
              <BookOpen className="w-8 h-8 mx-auto text-slate-400 stroke-1" />
              <p>Type keywords to search live across the backend story database.</p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {['BRICS 2026', 'Semiconductors', 'Artificial Intelligence', 'Green Hydrogen', 'Markets'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 transition"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && !isSearching && results.length === 0 && (
            <div className="py-8 text-center text-slate-500 text-sm">
              No stories found matching <span className="font-semibold text-slate-700 dark:text-slate-300">"{query}"</span>.
            </div>
          )}

          {results.map((story) => (
            <Link
              key={story.id}
              href={`/stories/${story.slug}`}
              onClick={onClose}
              className="group block p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
            >
              <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider mb-1">
                <span>{story.articleType.replace('_', ' ')}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-400 font-normal" suppressHydrationWarning>
                  <Clock className="w-3 h-3" />
                  {formatDeterministicDate(story.publishedAt)}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                {story.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">
                {story.summary}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
