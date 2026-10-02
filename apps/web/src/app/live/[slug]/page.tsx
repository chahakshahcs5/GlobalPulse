'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Radio, Star, Send, RefreshCw, ArrowLeft, ChevronRight, Clock } from 'lucide-react';
import { useAllStories } from '../../../lib/news-store';
import type { LiveblogEntry } from '@ai-news/schemas';

export default function LiveCoveragePage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { stories } = useAllStories();

  const story = stories.find((s) => s.slug === slug || s.id === slug) || {
    id: 'sty_live_sample',
    title: 'COP30 High-Level Ministerial Plenary & Treaty Ratification',
    summary:
      'Continuous dispatches, delegate press conferences, and breaking text negotiations live from Belém pavilion.',
    articleType: 'breaking_news',
    publishedAt: new Date().toISOString(),
  };

  const [entries, setEntries] = useState<LiveblogEntry[]>([
    {
      id: 'live_entry_1',
      storyId: story.id,
      headline: 'Ministerial Plenary Gavel Closes Final Working Session',
      content:
        'The plenary hall has concluded negotiations on Article 6 carbon accounting frameworks with unanimous consensus among all 194 participating delegations.',
      isKeyEvent: true,
      author: {
        id: 'usr_reporter_1',
        name: 'Rachel Davies',
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    },
    {
      id: 'live_entry_2',
      storyId: story.id,
      headline: 'European Commission Delegation Approves Concessional Funding Window',
      content:
        'The EU lead negotiator confirms a €15B matching fund earmarked for coastal adaptation in developing archipelagic states.',
      isKeyEvent: true,
      author: {
        id: 'usr_reporter_2',
        name: 'Jean-Luc Moreau',
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 24).toISOString(),
    },
    {
      id: 'live_entry_3',
      storyId: story.id,
      headline: 'Informal Bilateral Talks Continue in Hall B',
      content:
        'Small island developing states meet behind closed doors with multilateral development bank executives to streamline capital disbursement schedules.',
      isKeyEvent: false,
      author: {
        id: 'usr_wire',
        name: 'GlobalPulse Wire Desk',
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
  ]);

  const [keyEventsOnly, setKeyEventsOnly] = useState(false);
  const [newHeadline, setNewHeadline] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isKeyEvent, setIsKeyEvent] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh simulation
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  const handlePostEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHeadline.trim() || !newContent.trim() || isPosting) return;

    setIsPosting(true);
    const entry: LiveblogEntry = {
      id: `live_${Date.now()}`,
      storyId: story.id,
      headline: newHeadline.trim(),
      content: newContent.trim(),
      isKeyEvent,
      author: {
        id: 'usr_live_contributor',
        name: authorName.trim() || 'Newsroom Correspondent',
      },
      timestamp: new Date().toISOString(),
    };

    setEntries((prev) => [entry, ...prev]);
    setNewHeadline('');
    setNewContent('');
    setIsKeyEvent(false);
    setIsPosting(false);
  };

  const filteredEntries = keyEventsOnly ? entries.filter((e) => e.isKeyEvent) : entries;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100">
      {/* Navigation Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/" className="hover:text-white flex items-center gap-1 transition">
          <ArrowLeft className="w-3.5 h-3.5" /> Newsroom Home
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-600" />
        <Link href={`/stories/${slug}`} className="hover:text-white transition">
          Full Story
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-600" />
        <span className="font-semibold text-rose-400">Live Coverage Room</span>
      </nav>

      {/* Live Masthead */}
      <header className="space-y-4 pb-6 border-b border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black tracking-wider uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
              Live Coverage
            </span>
            <span className="text-xs text-slate-400 font-mono">• Updated continuously</span>
          </div>

          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Feed</span>
          </button>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
          {story.title}
        </h1>

        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">{story.summary}</p>

        {/* Live Controls Toolbar */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setKeyEventsOnly(false)}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                !keyEventsOnly
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Dispatches ({entries.length})
            </button>
            <button
              onClick={() => setKeyEventsOnly(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                keyEventsOnly
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>Key Milestones Only ({entries.filter((e) => e.isKeyEvent).length})</span>
            </button>
          </div>

          <span className="text-slate-400 font-mono text-[11px]">
            {filteredEntries.length} dispatches displayed
          </span>
        </div>
      </header>

      {/* Post Live Dispatch Box (Field Reporter Intake) */}
      <form
        onSubmit={handlePostEntry}
        className="p-5 rounded-2xl border border-slate-800 bg-slate-900 shadow-xl space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            <span>Post Fast Newsroom Dispatch</span>
          </div>
          <label className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={isKeyEvent}
              onChange={(e) => setIsKeyEvent(e.target.checked)}
              className="rounded border-slate-700 text-amber-500 focus:ring-0"
            />
            <span>Mark as Major Milestone ⭐</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            value={newHeadline}
            onChange={(e) => setNewHeadline(e.target.value)}
            required
            placeholder="Dispatch Headline (e.g. Plenary session reconvenes)"
            className="sm:col-span-2 px-3.5 py-2 text-xs rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500 font-semibold"
          />
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Byline / Correspondent"
            className="px-3.5 py-2 text-xs rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500"
          />
        </div>

        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          required
          rows={2}
          placeholder="Enter instant report details, quotes, or eyewitness observations..."
          className="w-full p-3 text-xs rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500 resize-none leading-relaxed"
        />

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={!newHeadline.trim() || !newContent.trim() || isPosting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isPosting ? 'Publishing...' : 'Broadcast Dispatch'}</span>
          </button>
        </div>
      </form>

      {/* Live Dispatches Timeline Stream */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {filteredEntries.map((entry) => (
          <article
            key={entry.id}
            className={`relative p-5 rounded-2xl border transition-all ${
              entry.isKeyEvent
                ? 'border-amber-500/30 bg-amber-950/10 shadow-lg shadow-amber-500/5'
                : 'border-slate-800 bg-slate-900/60'
            }`}
          >
            {/* Timeline node */}
            <div
              className={`absolute -left-6 sm:-left-8 top-6 w-3 h-3 rounded-full border-2 border-slate-900 ${
                entry.isKeyEvent ? 'bg-amber-400 ring-2 ring-amber-400/40' : 'bg-rose-500'
              }`}
            />

            {/* Entry Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/60 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="font-mono font-bold text-rose-400 flex items-center gap-1"
                  suppressHydrationWarning
                >
                  <Clock className="w-3 h-3" />
                  {new Date(entry.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="text-slate-600">•</span>
                <span className="font-bold text-slate-300">{entry.author.name}</span>
              </div>

              {entry.isKeyEvent && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-300" /> Key Milestone
                </span>
              )}
            </div>

            {/* Headline & Body */}
            <div className="mt-3 space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                {entry.headline}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {entry.content}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
