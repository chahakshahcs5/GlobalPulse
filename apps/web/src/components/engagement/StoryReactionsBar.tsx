'use client';

import { ThumbsUp, Lightbulb, Flame, Heart, Bookmark, Share2, Check } from 'lucide-react';

interface StoryReactionsBarProps {
  counts: Record<string, number>;
  userReactions: string[];
  toggleReaction: (type: string) => void;
  isBookmarked: boolean;
  onBookmark: () => void;
  copied: boolean;
  onShare: () => void;
}

export function StoryReactionsBar({
  counts,
  userReactions,
  toggleReaction,
  isBookmarked,
  onBookmark,
  copied,
  onShare,
}: StoryReactionsBarProps) {
  const reactionConfigs = [
    {
      type: 'like',
      label: 'Agree',
      icon: ThumbsUp,
      color:
        'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    },
    {
      type: 'insightful',
      label: 'Insightful',
      icon: Lightbulb,
      color:
        'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    },
    {
      type: 'important',
      label: 'Urgent',
      icon: Flame,
      color:
        'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
    },
    {
      type: 'heart',
      label: 'Applaud',
      icon: Heart,
      color:
        'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800',
    },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-4 px-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
      {/* Reactions Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
          Reactions
        </span>
        {reactionConfigs.map((cfg) => {
          const Icon = cfg.icon;
          const count = counts[cfg.type] || 0;
          const hasReacted = userReactions.includes(cfg.type);

          return (
            <button
              key={cfg.type}
              onClick={() => toggleReaction(cfg.type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 cursor-pointer select-none active:scale-90 ${
                hasReacted
                  ? `${cfg.color} shadow-xs font-bold scale-105 ring-2 ring-blue-500/20`
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${hasReacted ? 'fill-current' : ''}`} />
              <span>{cfg.label}</span>
              {count > 0 && (
                <span
                  className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    hasReacted
                      ? 'bg-white/40 text-current'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bookmark & Share Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBookmark}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
            isBookmarked
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
          <span>{isBookmarked ? 'Saved' : 'Save'}</span>
        </button>

        <button
          onClick={onShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
