'use client';

import { Sparkles, Lock } from 'lucide-react';

interface StoryDepthSelectorProps {
  readingDepth: 'quick' | 'balanced' | 'deep_dive';
  onDepthChange: (depth: 'quick' | 'balanced' | 'deep_dive') => void;
  isLocked: boolean;
  onOpenAskDrawer: () => void;
}

export function StoryDepthSelector({
  readingDepth,
  onDepthChange,
  isLocked,
  onOpenAskDrawer,
}: StoryDepthSelectorProps) {
  return (
    <div className="space-y-3">
      {/* Reading Depth Selector & Grounded AI Assistant Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Reading Depth:</span>
          <div className="flex items-center bg-slate-200 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-300 dark:border-slate-700/60 font-medium">
            <button
              onClick={() => onDepthChange('quick')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                readingDepth === 'quick'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ⚡ Quick (1m)
            </button>
            <button
              onClick={() => onDepthChange('balanced')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                readingDepth === 'balanced'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Standard (3m)
            </button>
            <button
              onClick={() => onDepthChange('deep_dive')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                readingDepth === 'deep_dive'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🔬 Deep Dive
            </button>
          </div>
        </div>

        <button
          onClick={onOpenAskDrawer}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-xs shadow-indigo-600/20 cursor-pointer"
        >
          {isLocked ? (
            <Lock className="w-3.5 h-3.5 text-amber-300" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          <span>{isLocked ? 'Ask AI (Subscribers)' : 'Ask Article AI'}</span>
        </button>
      </div>

      {/* Mode Indicator Banners */}
      {readingDepth === 'quick' && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-medium">
            <span className="text-base">⚡</span>
            <span>
              <strong>Quick Executive Briefing:</strong> Condensed to opening lead, executive
              takeaway, and key data points (~1 min read).
            </span>
          </div>
          <button
            onClick={() => onDepthChange('balanced')}
            className="underline font-semibold hover:text-amber-950 dark:hover:text-amber-100 cursor-pointer shrink-0 ml-3"
          >
            Expand to Full Story
          </button>
        </div>
      )}

      {readingDepth === 'deep_dive' && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-800 dark:text-indigo-300 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-medium">
            <span className="text-base">🔬</span>
            <span>
              <strong>Investigative Deep Dive Edition:</strong> Unabridged technical reporting,
              document registries, and investigative deep-dive brief enabled.
            </span>
          </div>
          <button
            onClick={() => onDepthChange('balanced')}
            className="underline font-semibold hover:text-indigo-950 dark:hover:text-indigo-100 cursor-pointer shrink-0 ml-3"
          >
            Switch to Standard
          </button>
        </div>
      )}
    </div>
  );
}
