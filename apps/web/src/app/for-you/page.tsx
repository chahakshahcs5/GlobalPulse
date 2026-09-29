'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { listStories } from '../../lib/api-client';
import { formatDeterministicDate } from '../../lib/date-utils';
import { AlgorithmTunerModal } from '../../components/AlgorithmTunerModal';
import { TopicBalanceWidget } from '../../components/TopicBalanceWidget';
import {
  Sparkles,
  Sliders,
  Download,
  Info,
  ThumbsUp,
  ThumbsDown,
  Clock,
  ArrowLeft,
  Check,
} from 'lucide-react';
import type { Story, AlgorithmTuning, DepthPreference } from '@ai-news/schemas';

interface ExplainedStoryItem {
  story: Story;
  score: number;
  reasons: string[];
  primarySignal: {
    type: string;
    text: string;
    color: string;
  };
}

export default function ForYouPage() {
  const [stories, setStories] = useState<ExplainedStoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTunerOpen, setIsTunerOpen] = useState(false);
  const [selectedDepth, setSelectedDepth] = useState<DepthPreference | 'all'>('all');
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'up' | 'down'>>({});
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;

    listStories({ limit: 40 })
      .then((allStories) => {
        if (!isMounted) return;
        const published = allStories.filter((s) => s.status === 'PUBLISHED');

        // Synthesize explainable attribution signals based on story tags and categories
        const explained: ExplainedStoryItem[] = published.map((story, idx) => {
          let score = 92 - idx * 2.5;
          const reasons: string[] = [];
          let primarySignal = {
            type: 'affinity',
            text: `High Affinity for ${story.articleType.replace('_', ' ')}`,
            color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
          };

          if (story.topicIds && story.topicIds.length > 0) {
            const top = story.topicIds[0].replace(/^top_/, '');
            reasons.push(`Follows #${top}`);
            primarySignal = {
              type: 'followed_topic',
              text: `Because you follow #${top}`,
              color: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
            };
          } else if (idx % 4 === 3) {
            score += 15;
            reasons.push('Serendipity Discovery');
            primarySignal = {
              type: 'serendipity',
              text: 'Serendipity Discovery (Broaden Perspective)',
              color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
            };
          } else {
            reasons.push(`Matches your ${story.articleType} reading history`);
          }

          if (idx === 1) {
            reasons.push('Resume reading from earlier');
            primarySignal = {
              type: 'resume',
              text: 'Resume Reading (In Progress)',
              color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
            };
          }

          return {
            story,
            score: Math.max(55, Math.round(score)),
            reasons,
            primarySignal,
          };
        });

        setStories(explained);
        setIsLoading(false);
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDownloadDigest = () => {
    const digestPayload = {
      digestId: `digest_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      title: 'GlobalPulse Offline Reader Briefing',
      totalStories: stories.length,
      stories: stories.slice(0, 10).map((s) => s.story),
    };

    if (typeof window !== 'undefined') {
      const blob = new Blob([JSON.stringify(digestPayload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `globalpulse-offline-briefing-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    }
  };

  const handleFeedback = (storyId: string, type: 'up' | 'down') => {
    setFeedbackGiven((prev) => ({ ...prev, [storyId]: type }));
  };

  const filteredStories = stories.filter((item) => {
    if (selectedDepth === 'all') return true;
    const readingTime = item.story.readingTimeMinutes || 3;
    if (selectedDepth === 'quick') return readingTime <= 3;
    if (selectedDepth === 'deep_dive') return readingTime >= 5;
    return readingTime > 3 && readingTime < 5;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-wider">
          <Link href="/" className="hover:text-white transition flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Newsroom Home
          </Link>
          <span>/</span>
          <span>Personalized Intelligence</span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadDigest}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-medium transition"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Briefing Saved!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Offline Briefing</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsTunerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-xs"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Tune Algorithm</span>
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 border border-slate-800/80 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/40">
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Transparent Algorithmic Feed
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
              {stories.length} Dispatches Tailored
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
            For You: Explainable Dispatches
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Every story in this feed includes transparent attribution explaining why it was
            recommended, with instant reader controls to tune your balance and diversity.
          </p>
        </div>
      </div>

      {/* Topic Balance Widget */}
      <TopicBalanceWidget
        profile={{
          userId: 'usr_active_reader',
          totalReadingMinutes: 48,
          storiesReadCount: stories.length,
          categoryDistribution: {
            technology: 8,
            business: 5,
            science: 4,
            world: 3,
          },
          topicDistribution: {
            top_artificial_intelligence: 5,
            top_semiconductors: 3,
          },
          diversityScore: 84,
          depthHabit: 'balanced',
        }}
        onExploreMore={() => setIsTunerOpen(true)}
      />

      {/* Depth Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {(
            [
              { id: 'all', label: 'All Dispatches' },
              { id: 'quick', label: 'Quick (≤3m)' },
              { id: 'balanced', label: 'Standard (3-5m)' },
              { id: 'deep_dive', label: 'Deep Dive (5m+)' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedDepth(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                selectedDepth === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-slate-400 shrink-0">
          {filteredStories.length} matches
        </span>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-64 rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4"
            >
              <div className="h-4 bg-slate-800 rounded w-1/3" />
              <div className="h-6 bg-slate-800 rounded w-3/4" />
              <div className="h-16 bg-slate-800/60 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Feed Cards Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredStories.map(({ story, score, primarySignal }) => {
            const userFeedback = feedbackGiven[story.id];
            return (
              <div
                key={story.id}
                className="glass-card rounded-3xl p-6 border border-slate-800/80 bg-slate-900/40 hover:border-slate-700 flex flex-col justify-between space-y-5 transition"
              >
                <div className="space-y-4">
                  {/* Transparent "Why You Saw This" Pill */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold border ${primarySignal.color}`}
                    >
                      <Info className="w-3 h-3" />
                      <span>{primarySignal.text}</span>
                    </span>

                    <span className="text-[11px] font-mono text-slate-400">
                      Score: <strong className="text-white">{score}</strong>
                    </span>
                  </div>

                  {/* Story Title & Link */}
                  <Link href={`/stories/${story.slug}`} className="block group">
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition leading-snug">
                      {story.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    {story.summary}
                  </p>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                    <span className="uppercase text-blue-400 font-bold text-[10px]">
                      {story.articleType.replace('_', ' ')}
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3" />
                      {story.readingTimeMinutes || 3} min read
                    </span>
                    <span>&bull;</span>
                    <span className="text-[11px]" suppressHydrationWarning>
                      {formatDeterministicDate(story.publishedAt || story.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Footer Actions: Feedback & Read Dispatch */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  {/* Recommendation Feedback */}
                  <div className="flex items-center gap-1 text-slate-400">
                    <span className="text-[10px] uppercase font-mono mr-1">Tuning:</span>
                    <button
                      onClick={() => handleFeedback(story.id, 'up')}
                      className={`p-1.5 rounded-lg border transition ${
                        userFeedback === 'up'
                          ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                          : 'border-slate-800 hover:bg-slate-800 hover:text-white'
                      }`}
                      title="Show more like this"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleFeedback(story.id, 'down')}
                      className={`p-1.5 rounded-lg border transition ${
                        userFeedback === 'down'
                          ? 'bg-rose-600/20 text-rose-400 border-rose-500/40'
                          : 'border-slate-800 hover:bg-slate-800 hover:text-white'
                      }`}
                      title="Show less like this"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <Link
                    href={`/stories/${story.slug}`}
                    className="text-blue-400 hover:text-blue-300 font-bold transition flex items-center gap-1"
                  >
                    <span>Read Dispatch</span> &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Algorithm Tuner Modal */}
      <AlgorithmTunerModal
        isOpen={isTunerOpen}
        onClose={() => setIsTunerOpen(false)}
        onApply={(tuning: AlgorithmTuning) => {
          if (tuning.depthPreference) {
            setSelectedDepth(tuning.depthPreference);
          }
        }}
      />
    </div>
  );
}
