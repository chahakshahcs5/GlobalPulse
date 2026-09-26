import React, { useState } from 'react';
import { offlineStorage, OfflineStory } from '../services/storage';

interface FeedScreenProps {
  stories: OfflineStory[];
  onSelectStory: (story: OfflineStory) => void;
}

export function FeedScreen({ stories, onSelectStory }: FeedScreenProps) {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const categories = ['ALL', 'BREAKING', 'ANALYSIS', 'INVESTIGATION', 'EXPLAINER'];

  const filtered = activeCategory === 'ALL'
    ? stories
    : stories.filter((s) => s.articleType.toUpperCase() === activeCategory);

  return (
    <div className="flex flex-col h-full bg-[#060911] text-slate-100 p-4">
      {/* Mobile App Bar */}
      <header className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-base">
            N
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white leading-tight">GLOBALPULSE</h1>
            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
              AI INGESTION ACTIVE
            </span>
          </div>
        </div>
        <span className="text-xs font-mono text-slate-400">MOBILE</span>
      </header>

      {/* Category Pills */}
      <div className="flex items-center gap-2 py-3 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-bold font-mono transition shrink-0 ${
              activeCategory === cat
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Story List */}
      <div className="flex-1 overflow-y-auto space-y-3 pt-1">
        {filtered.map((story) => (
          <div
            key={story.id}
            onClick={() => onSelectStory(story)}
            className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/40 transition active:scale-[0.99] cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {story.articleType.replace('_', ' ')}
              </span>
              <span className="text-slate-500 font-mono text-[11px]">v{story.currentVersionNumber}</span>
            </div>

            <h2 className="text-base font-bold text-white leading-snug line-clamp-2">
              {story.title}
            </h2>

            <p className="text-xs text-slate-400 line-clamp-2 font-normal">
              {story.summary}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] font-mono text-slate-500">
              <span>{story.blocks.length} Blocks</span>
              <span className="text-blue-400 font-semibold">Tap to Read →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
