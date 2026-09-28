'use client';

import React from 'react';
import Link from 'next/link';
import { Bookmark, X, Trash2, ArrowRight } from 'lucide-react';
import { useBookmarks, toggleBookmark, useAllStories } from '../lib/news-store';

interface BookmarksDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookmarksDrawer: React.FC<BookmarksDrawerProps> = ({ isOpen, onClose }) => {
  const bookmarks = useBookmarks();
  const { stories: allStories } = useAllStories();

  if (!isOpen) return null;

  const bookmarkedStories = allStories.filter((s) => bookmarks.includes(s.slug));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-blue-600 dark:text-blue-400 fill-blue-600/20" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Saved Stories
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold">
                {bookmarkedStories.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {bookmarkedStories.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-3 py-16">
                <Bookmark className="w-12 h-12 text-slate-300 dark:text-slate-700 stroke-1" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No saved stories yet
                </p>
                <p className="text-xs text-slate-500 max-w-xs">
                  Click the bookmark icon on any article card to save it for reading later.
                </p>
              </div>
            ) : (
              bookmarkedStories.map((story) => (
                <div
                  key={story.id}
                  className="group relative p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-800/40 transition space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      {story.articleType.replace('_', ' ')}
                    </span>
                    <button
                      onClick={() => toggleBookmark(story.slug)}
                      className="text-slate-400 hover:text-rose-500 transition p-1"
                      title="Remove bookmark"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <Link
                    href={`/stories/${story.slug}`}
                    onClick={onClose}
                    className="block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition"
                  >
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                      {story.title}
                    </h4>
                  </Link>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span suppressHydrationWarning>
                      {story.publishedAt ? new Date(story.publishedAt).toLocaleDateString('en-US') : 'Recent'}
                    </span>
                    <Link
                      href={`/stories/${story.slug}`}
                      onClick={onClose}
                      className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Read now <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
