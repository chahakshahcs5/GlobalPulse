'use client';

import { Star } from 'lucide-react';
import type { ArticleType } from '@ai-news/schemas';

interface StoryMetadataSectionProps {
  category: ArticleType;
  setCategory: (c: ArticleType) => void;
  isSubscriberOnly: boolean;
  setIsSubscriberOnly: (v: boolean) => void;
  title: string;
  setTitle: (t: string) => void;
  summary: string;
  setSummary: (s: string) => void;
  authorName: string;
  setAuthorName: (a: string) => void;
  heroImageUrl: string;
  setHeroImageUrl: (u: string) => void;
}

export function StoryMetadataSection({
  category,
  setCategory,
  isSubscriberOnly,
  setIsSubscriberOnly,
  title,
  setTitle,
  summary,
  setSummary,
  authorName,
  setAuthorName,
  heroImageUrl,
  setHeroImageUrl,
}: StoryMetadataSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ArticleType)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-medium focus:outline-none focus:border-blue-500"
          >
            <option value="technology">Technology & Silicon</option>
            <option value="business">Business & Economy</option>
            <option value="world">World Affairs</option>
            <option value="science">Science & Energy</option>
            <option value="sports">Sports</option>
            <option value="health">Health & Medicine</option>
          </select>
        </div>

        {/* Subscriber Exclusive Access Toggle */}
        <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Subscriber Only Story
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Restrict full article access and investigative dossier to GlobalPulse Digital
                subscribers.
              </div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isSubscriberOnly}
              onChange={(e) => setIsSubscriberOnly(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
            Author Byline
          </label>
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="e.g. Vikram Malhotra, Senior Tech Reporter"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-medium focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
          Headline / Title *
        </label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Quantum Computing Startup Achieves 10,000 Logical Qubit Error Suppression"
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm font-bold focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
          Executive Summary / Subtitle *
        </label>
        <textarea
          required
          rows={2}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Provide a concise 1-2 sentence executive overview of the story."
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs leading-relaxed focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
          Cover Photo URL
        </label>
        <input
          type="url"
          value={heroImageUrl}
          onChange={(e) => setHeroImageUrl(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-medium focus:outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );
}
