'use client';

import Link from 'next/link';

import { TrendingUp, Bot, Flame, Eye } from 'lucide-react';

interface NewsroomPulseTabProps {
  metrics: any;
  trending: any[];
}

export function NewsroomPulseTab({ metrics, trending }: NewsroomPulseTabProps) {
  return (
    <div className="space-y-6">
      {/* Real-time KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-xs text-slate-500 font-medium">Estimated Readers</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {(metrics?.totalReads || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Real-time stream
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-xs text-slate-500 font-medium">Reader Reactions</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {(metrics?.totalReactions || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Like, Insightful, Heart</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-xs text-slate-500 font-medium">Comments & Debates</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {(metrics?.totalComments || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Community discussion</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-xs text-slate-500 font-medium">Avg Read Time</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {metrics?.avgReadingTimeMinutes || 3.5}m
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Across published corpus</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-xs text-slate-500 font-medium">Active Staff</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {metrics?.activeJournalists || 1}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Human editors</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-xs text-slate-500 font-medium">Autonomous AI</div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {metrics?.activeAiAgents || 2}
          </div>
          <div className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
            <Bot className="w-3 h-3" /> MCP Connected
          </div>
        </div>
      </div>

      {/* Trending Leaderboard */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Trending Stories Leaderboard (Virality & Velocity Algorithm)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Calculated across reads, comment depth, and reaction velocity
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {trending.map((t, idx) => {
            const virality = t.viralityScore || 50;
            const isHighViral = virality >= 70;
            return (
              <div
                key={t.storyId || idx}
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                      idx === 0
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 border border-amber-300 dark:border-amber-700'
                        : idx === 1
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          : idx === 2
                            ? 'bg-amber-900/10 text-amber-700 dark:text-amber-500'
                            : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400'
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <div>
                    <Link
                      href={`/stories/${t.slug || t.storyId}`}
                      className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 line-clamp-1"
                    >
                      {t.title}
                    </Link>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                      <span className="uppercase font-mono text-[10px] text-blue-600 dark:text-blue-400">
                        {t.articleType || 'news'}
                      </span>
                      <span>•</span>
                      <span>{(t.viewCount || 0).toLocaleString()} views</span>
                      <span>•</span>
                      <span>{t.totalReactions || 0} reactions</span>
                      <span>•</span>
                      <span>{t.commentCount || 0} comments</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-xs font-bold">
                      {isHighViral && <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />}
                      <span
                        className={
                          isHighViral
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-700 dark:text-slate-300'
                        }
                      >
                        {virality} / 100
                      </span>
                    </div>
                    <div className="w-24 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isHighViral
                            ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${virality}%` }}
                      ></div>
                    </div>
                  </div>

                  <Link
                    href={`/stories/${t.slug || t.storyId}`}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                    title="Open Story"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
