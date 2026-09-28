'use client';

import React, { useState } from 'react';
import { Radio, Bell, CheckCircle2 } from 'lucide-react';
import type { Story } from '@ai-news/schemas';
import { useEditorialNotifications } from '../../../lib/news-store';
import { formatDeterministicDateTime } from '../../../lib/date-utils';

interface BreakingNewsTabProps {
  stories: Story[];
  notifications: any[];
  onSuccess: (message: string) => void;
}

export function BreakingNewsTab({
  stories,
  notifications,
  onSuccess,
}: BreakingNewsTabProps) {
  const { broadcastBreaking } = useEditorialNotifications(20);

  const [breakingStoryId, setBreakingStoryId] = useState('');
  const [breakingHeadline, setBreakingHeadline] = useState('');
  const [breakingUrgency, setBreakingUrgency] = useState<'urgent' | 'critical' | 'breaking'>('urgent');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handleBroadcastBreaking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!breakingHeadline.trim()) {
      alert('Please enter a breaking news headline.');
      return;
    }
    const storyIdToUse = breakingStoryId || (stories.length > 0 ? stories[0].id : 'story_manual');
    setIsBroadcasting(true);
    try {
      await broadcastBreaking(storyIdToUse, breakingHeadline.trim(), breakingUrgency);
      onSuccess(`Breaking news alert broadcasted live across all reader streams!`);
      setBreakingHeadline('');
    } catch (err) {
      console.error('Failed to broadcast breaking news:', err);
      alert('Failed to broadcast breaking news.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Broadcaster Dispatch Card */}
      <div className="p-6 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 shadow-md space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-rose-100 dark:border-rose-900/40">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-rose-600 animate-pulse" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Emergency Breaking News Broadcast Terminal
            </h2>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 font-mono font-bold uppercase">
            Global Push Alert
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Dispatches an immediate high-priority breaking news flash across all active reader sessions via the SSE Realtime Gateway.
          The alert banner appears instantaneously on every connected device without a page reload.
        </p>

        <form onSubmit={handleBroadcastBreaking} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
              Associate with Published Story (Optional)
            </label>
            <select
              value={breakingStoryId}
              onChange={(e) => {
                setBreakingStoryId(e.target.value);
                const selected = stories.find((s) => s.id === e.target.value);
                if (selected && !breakingHeadline) {
                  setBreakingHeadline(`BREAKING: ${selected.title}`);
                }
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:outline-none focus:border-rose-500"
            >
              <option value="">-- Standalone Alert (No Story Link) --</option>
              {stories.filter((s) => s.status === 'PUBLISHED').map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
              Breaking Headline Flash *
            </label>
            <input
              type="text"
              required
              value={breakingHeadline}
              onChange={(e) => setBreakingHeadline(e.target.value)}
              placeholder="e.g. BREAKING: Central Banks Announce Coordinated Real-Time Liquidity Facility"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Urgency Level
              </label>
              <div className="flex items-center gap-2">
                {(['urgent', 'critical', 'breaking'] as const).map((urg) => (
                  <button
                    key={urg}
                    type="button"
                    onClick={() => setBreakingUrgency(urg)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
                      breakingUrgency === urg
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {urg}
                  </button>
                ))}
              </div>
            </div>

            <div className="ml-auto pt-4">
              <button
                type="submit"
                disabled={isBroadcasting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition disabled:opacity-50 cursor-pointer"
              >
                <Radio className="w-4 h-4" />
                <span>{isBroadcasting ? 'Broadcasting...' : 'Broadcast Flash Alert Live'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Broadcast History */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Broadcast Dispatch History
            </h3>
          </div>
          <span className="text-xs text-slate-400">Delivered over SSE</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No previous breaking broadcasts logged yet.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400">
                      {n.urgency || 'urgent'}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {n.headline || n.title}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                    <span>Dispatched by {n.senderId || 'editor'}</span>
                    <span>•</span>
                    <span suppressHydrationWarning>{formatDeterministicDateTime(n.sentAt || n.createdAt || Date.now())}</span>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Delivered
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
