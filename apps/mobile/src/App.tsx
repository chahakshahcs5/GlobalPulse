import React, { useState } from 'react';
import { FeedScreen } from './screens/FeedScreen';
import { StoryDetailScreen } from './screens/StoryDetailScreen';
import { BookmarksScreen } from './screens/BookmarksScreen';
import { OfflineStory } from './services/storage';

export const SAMPLE_MOBILE_STORIES: OfflineStory[] = [
  {
    id: 'sty_brics_mobile',
    slug: 'brics-expansion-2026-global-economic-realignment',
    title: 'BRICS Expansion 2026: Historic Geoeconomic Shift',
    summary: 'Four new member nations formally inducted into BRICS during the landmark New Delhi summit.',
    articleType: 'breaking',
    currentVersionNumber: 2,
    savedAt: new Date().toISOString(),
    readStatus: false,
    blocks: [
      {
        id: 'h1',
        blockType: 'heading',
        data: { text: 'New Multilateral Financial Architecture', level: 2 },
      },
      {
        id: 'p1',
        blockType: 'paragraph',
        data: {
          text: 'Leaders from member nations ratified an updated currency settlement framework designed to facilitate cross-border trade without intermediary dollar clearing houses.',
        },
      },
      {
        id: 'chart1',
        blockType: 'chart',
        data: {
          chartType: 'bar',
          title: 'Combined Economic Output ($ Trillion PPP)',
          values: [{ year: '2024', val: 32 }, { year: '2026', val: 41 }],
          sourceAttribution: 'World Bank & IMF 2026 Outlook',
        },
      },
    ],
  },
];

export default function MobileApp() {
  const [activeTab, setActiveTab] = useState<'feed' | 'bookmarks'>('feed');
  const [selectedStory, setSelectedStory] = useState<OfflineStory | null>(null);

  if (selectedStory) {
    return (
      <StoryDetailScreen
        story={selectedStory}
        onBack={() => setSelectedStory(null)}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#060911] border-x border-slate-800 shadow-2xl overflow-hidden font-sans">
      <div className="flex-1 overflow-hidden">
        {activeTab === 'feed' ? (
          <FeedScreen
            stories={SAMPLE_MOBILE_STORIES}
            onSelectStory={(s) => setSelectedStory(s)}
          />
        ) : (
          <BookmarksScreen onSelectStory={(s) => setSelectedStory(s)} />
        )}
      </div>

      {/* Bottom Tab Bar */}
      <nav className="h-14 bg-slate-950 border-t border-slate-800 flex items-center justify-around px-4">
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex flex-col items-center gap-0.5 text-xs font-mono font-bold transition ${
            activeTab === 'feed' ? 'text-blue-400' : 'text-slate-500'
          }`}
        >
          <span>📰</span>
          <span>Feed</span>
        </button>
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`flex flex-col items-center gap-0.5 text-xs font-mono font-bold transition ${
            activeTab === 'bookmarks' ? 'text-blue-400' : 'text-slate-500'
          }`}
        >
          <span>🔖</span>
          <span>Saved</span>
        </button>
      </nav>
    </div>
  );
}
