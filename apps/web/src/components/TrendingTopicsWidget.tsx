'use client';

import React from 'react';
import { TRENDING_TOPICS } from '../lib/news-data';
import { TrendingUp, Hash } from 'lucide-react';

interface TrendingTopicsWidgetProps {
  onSelectTopic?: (topic: string) => void;
}

export const TrendingTopicsWidget: React.FC<TrendingTopicsWidgetProps> = ({ onSelectTopic }) => {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
        <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span>In the News</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TRENDING_TOPICS.map((topic) => (
          <button
            key={topic.id}
            onClick={() => onSelectTopic?.(topic.query)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700/80 transition"
          >
            <Hash className="w-3 h-3 text-slate-400" />
            <span>{topic.tag}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
