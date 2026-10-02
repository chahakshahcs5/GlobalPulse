'use client';

import React from 'react';
import Link from 'next/link';
import { Bookmark, Share2, Clock, Check, Star } from 'lucide-react';
import type { GoogleNewsCluster } from '../lib/news-data';
import { toggleBookmark, useBookmarks } from '../lib/news-store';

interface GoogleNewsClusterCardProps {
  cluster: GoogleNewsCluster;
  onOpenFullCoverage: (slug: string) => void;
}

export const GoogleNewsClusterCard: React.FC<GoogleNewsClusterCardProps> = ({
  cluster,
  onOpenFullCoverage,
}) => {
  const bookmarks = useBookmarks();
  const isBookmarked = bookmarks.includes(cluster.leadStory.slug);
  const [copied, setCopied] = React.useState(false);

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(`${window.location.origin}/stories/${cluster.leadStory.slug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 sm:p-5 hover:shadow-md transition space-y-3">
      {/* Top Part: Text on Left, Thumbnail on Right */}
      <div className="flex items-start justify-between gap-4">
        {/* Left Text */}
        <div className="flex-1 space-y-2">
          {/* Publisher & Timestamp */}
          <div className="flex items-center gap-2 text-xs">
            {cluster.leadStory.isSubscriberOnly && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                Subscriber Exclusive
              </span>
            )}
            <span className="font-extrabold text-blue-600 dark:text-blue-400">
              {cluster.leadStory.publisher}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {cluster.leadStory.timeAgo}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {cluster.category}
            </span>
          </div>

          {/* Headline */}
          <Link href={`/stories/${cluster.leadStory.slug}`} className="group block">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-2">
              {cluster.leadStory.headline}
            </h3>
          </Link>

          {/* Excerpt */}
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
            {cluster.leadStory.excerpt}
          </p>
        </div>

        {/* Right Thumbnail */}
        <Link
          href={`/stories/${cluster.leadStory.slug}`}
          className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden block"
        >
          <img
            src={cluster.leadStory.imageUrl}
            alt={cluster.leadStory.headline}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </Link>
      </div>

      {/* Indented Related Stories from Different Publishers */}
      {cluster.relatedArticles && cluster.relatedArticles.length > 0 && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
          {cluster.relatedArticles.slice(0, 2).map((rel) => (
            <div key={rel.id} className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0">
                {rel.publisher}:
              </span>
              <Link
                href={`/stories/${cluster.leadStory.slug}`}
                className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline truncate"
              >
                {rel.headline}
              </Link>
              <span className="text-slate-400 text-[10px] shrink-0 font-mono">{rel.timeAgo}</span>
            </div>
          ))}
        </div>
      )}

      {/* Card Footer: Full Coverage Button & Bookmark/Share */}
      <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80">
        <button
          onClick={() => onOpenFullCoverage(cluster.leadStory.slug)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
        >
          <div className="relative w-3 h-3">
            <span className="absolute top-0 left-0 w-2 h-2 rounded-[1.5px] border border-blue-600 bg-blue-600/30"></span>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-[1.5px] border border-blue-600 bg-blue-600"></span>
          </div>
          <span>Full Coverage</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleBookmark(cluster.leadStory.slug)}
            className={`p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
              isBookmarked ? 'text-blue-600' : 'text-slate-400'
            }`}
            title={isBookmarked ? 'Saved' : 'Save for later'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-blue-600' : ''}`} />
          </button>
          <button
            onClick={handleShare}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition"
            title="Share"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
