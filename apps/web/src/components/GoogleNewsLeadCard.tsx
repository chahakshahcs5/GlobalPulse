'use client';

import React from 'react';
import Link from 'next/link';
import { Bookmark, Share2, Clock, Check, Star } from 'lucide-react';
import type { GoogleNewsCluster } from '../lib/cluster-types';
import { toggleBookmark, useBookmarks } from '../lib/news-store';

interface GoogleNewsLeadCardProps {
  cluster: GoogleNewsCluster;
  onOpenFullCoverage: (slug: string) => void;
}

export const GoogleNewsLeadCard: React.FC<GoogleNewsLeadCardProps> = ({
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
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden hover:shadow-md transition">
      {/* Top Main Story Article */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5 sm:p-6">
        {/* Left / Top Text Content */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            {/* Publisher & Timestamp */}
            <div className="flex items-center justify-between">
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
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  {cluster.category}
                </span>
              </div>

              {/* Action Buttons: Bookmark & Share */}
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleBookmark(cluster.leadStory.slug);
                  }}
                  className={`p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
                    isBookmarked ? 'text-blue-600' : 'text-slate-400'
                  }`}
                  title={isBookmarked ? 'Saved' : 'Save for later'}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-blue-600' : ''}`} />
                </button>
                <button
                  onClick={handleShare}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition"
                  title="Share"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Main Headline */}
            <Link href={`/stories/${cluster.leadStory.slug}`} className="group block">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                {cluster.leadStory.headline}
              </h2>
            </Link>

            {/* Excerpt */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
              {cluster.leadStory.excerpt}
            </p>
          </div>

          {/* Full Coverage Pill Button */}
          <div className="pt-2">
            <button
              onClick={() => onOpenFullCoverage(cluster.leadStory.slug)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800/80 transition shadow-sm"
            >
              {/* Google News Overlapping Squares Icon */}
              <div className="relative w-3.5 h-3.5">
                <span className="absolute top-0 left-0 w-2.5 h-2.5 rounded-[2px] border border-blue-600 bg-blue-600/30"></span>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-[2px] border border-blue-600 bg-blue-600"></span>
              </div>
              <span>Full Coverage of this story</span>
            </button>
          </div>
        </div>

        {/* Right / Hero Image */}
        <div className="md:col-span-5 relative rounded-xl overflow-hidden min-h-[200px] md:min-h-full">
          <Link href={`/stories/${cluster.leadStory.slug}`} className="block w-full h-full">
            <img
              src={cluster.leadStory.imageUrl}
              alt={cluster.leadStory.headline}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
          </Link>
        </div>
      </div>

      {/* Indented Related Perspectives from Other Outlets (Google News Signature Feature) */}
      {cluster.relatedArticles && cluster.relatedArticles.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 p-4 sm:p-5 space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            More perspectives from other sources
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {cluster.relatedArticles.map((rel) => (
              <div
                key={rel.id}
                className="p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                <div className="flex items-center gap-1.5 text-[11px] mb-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {rel.publisher}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-400 font-mono text-[10px]">{rel.timeAgo}</span>
                </div>
                <Link
                  href={`/stories/${cluster.leadStory.slug}`}
                  className="text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2 leading-snug"
                >
                  {rel.headline}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
