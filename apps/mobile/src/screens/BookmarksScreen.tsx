import React from 'react';
import { offlineStorage, OfflineStory } from '../services/storage';

interface BookmarksScreenProps {
  onSelectStory: (story: OfflineStory) => void;
}

export function BookmarksScreen({ onSelectStory }: BookmarksScreenProps) {
  const savedStories = offlineStorage.getAllSavedStories();

  return (
    <div className="flex flex-col h-full bg-[#060911] text-slate-100 p-4">
      <header className="pb-3 border-b border-slate-800">
        <h1 className="text-lg font-black text-white">Offline Library</h1>
        <p className="text-xs text-slate-400">
          {savedStories.length} articles saved for offline reading
        </p>
      </header>

      <div className="flex-1 overflow-y-auto space-y-3 pt-3">
        {savedStories.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No saved articles yet. Tap 'Save Offline' on any story to read without connectivity.
          </div>
        ) : (
          savedStories.map((story) => (
            <div
              key={story.id}
              onClick={() => onSelectStory(story)}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/40 transition cursor-pointer space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                <span>{new Date(story.savedAt).toLocaleDateString()}</span>
                <span className="text-blue-400">Cached Offline</span>
              </div>
              <h3 className="text-sm font-bold text-white line-clamp-2">{story.title}</h3>
              <p className="text-xs text-slate-400 line-clamp-1">{story.summary}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
