'use client';

import { Activity, PieChart, Sparkles, Award } from 'lucide-react';
import type { ReaderConsumptionProfile } from '@ai-news/schemas';

interface TopicBalanceWidgetProps {
  profile?: ReaderConsumptionProfile | null;
  onExploreMore?: () => void;
}

export function TopicBalanceWidget({ profile, onExploreMore }: TopicBalanceWidgetProps) {
  const diversity = profile?.diversityScore ?? 78;
  const totalMinutes = profile?.totalReadingMinutes ?? 42;
  const count = profile?.storiesReadCount ?? 12;

  const distribution =
    profile?.categoryDistribution && Object.keys(profile.categoryDistribution).length > 0
      ? profile.categoryDistribution
      : {
          technology: 6,
          business: 4,
          science: 3,
          world: 2,
        };

  const totalHits = Object.values(distribution).reduce((a, b) => a + b, 0) || 1;

  const categoryColors: Record<string, string> = {
    technology: '#3b82f6',
    business: '#10b981',
    science: '#8b5cf6',
    world: '#f59e0b',
    health: '#ec4899',
    sports: '#06b6d4',
  };

  return (
    <div className="glass-card rounded-3xl p-6 border border-slate-800 bg-slate-900/50 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
              Reading Diet & Topic Balance
            </h3>
            <p className="text-[11px] text-slate-400">
              Personalized information health & balance analytics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-bold">
          <Award className="w-3.5 h-3.5" />
          <span>{diversity}/100 Balanced</span>
        </div>
      </div>

      {/* Segmented Distribution Bar */}
      <div className="space-y-2">
        <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden flex shadow-inner">
          {Object.entries(distribution).map(([cat, cnt]) => {
            const pct = Math.round((cnt / totalHits) * 100);
            const color = categoryColors[cat.toLowerCase()] || '#64748b';
            return (
              <div
                key={cat}
                style={{ width: `${pct}%`, backgroundColor: color }}
                className="transition-all duration-500"
                title={`${cat}: ${pct}%`}
              />
            );
          })}
        </div>

        {/* Legend Badges */}
        <div className="flex flex-wrap gap-2 pt-1 text-xs">
          {Object.entries(distribution).map(([cat, cnt]) => {
            const pct = Math.round((cnt / totalHits) * 100);
            const color = categoryColors[cat.toLowerCase()] || '#64748b';
            return (
              <div
                key={cat}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/60 border border-slate-700/60 text-[11px] font-mono text-slate-300"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="capitalize">{cat}</span>
                <span className="text-slate-400">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          <span>
            {totalMinutes} min reading velocity &bull; {count} dispatches completed
          </span>
        </div>

        {onExploreMore && (
          <button
            onClick={onExploreMore}
            className="text-blue-400 hover:text-blue-300 font-bold transition flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            <span>Discover Beats</span> &rarr;
          </button>
        )}
      </div>
    </div>
  );
}
