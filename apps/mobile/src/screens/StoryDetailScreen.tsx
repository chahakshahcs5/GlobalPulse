import React, { useState } from 'react';
import { offlineStorage, OfflineStory } from '../services/storage';
import { MobileBlockRenderer } from '../components/MobileBlockRenderer';

interface StoryDetailScreenProps {
  story: OfflineStory;
  onBack: () => void;
}

export function StoryDetailScreen({ story, onBack }: StoryDetailScreenProps) {
  const [isSaved, setIsSaved] = useState<boolean>(offlineStorage.isBookmarked(story.id));
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const handleBookmarkToggle = () => {
    const saved = offlineStorage.toggleBookmark(story.id);
    if (saved) {
      offlineStorage.saveStory(story);
    }
    setIsSaved(saved);
  };

  return (
    <div className="flex flex-col h-full bg-[#060911] text-slate-100 p-4 overflow-y-auto">
      {/* Top Nav */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <button
          onClick={onBack}
          className="text-xs font-mono text-blue-400 font-bold flex items-center gap-1 hover:text-white"
        >
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlayingAudio(!isPlayingAudio)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition ${
              isPlayingAudio
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            {isPlayingAudio ? '■ Stop Audio' : '▶ Audio Briefing'}
          </button>
          <button
            onClick={handleBookmarkToggle}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition ${
              isSaved
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            {isSaved ? '★ Saved' : '☆ Save Offline'}
          </button>
        </div>
      </div>

      {/* Header */}
      <header className="space-y-3 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold uppercase">
            {story.articleType.replace('_', ' ')}
          </span>
          <span className="text-slate-500">v{story.currentVersionNumber}</span>
        </div>

        <h1 className="text-2xl font-black text-white leading-tight">
          {story.title}
        </h1>

        <p className="text-sm text-slate-300 leading-relaxed font-normal">
          {story.summary}
        </p>

        {isPlayingAudio && (
          <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs font-mono flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
              Synthesizing Audio Briefing (Anchor F)
            </span>
            <span>01:45</span>
          </div>
        )}
      </header>

      {/* Body Blocks */}
      <main className="py-4">
        <MobileBlockRenderer blocks={story.blocks} />
      </main>
    </div>
  );
}
