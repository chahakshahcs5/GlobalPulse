'use client';

import React from 'react';
import type { PollBlock, LiveTickerBlock, ComparisonBlock } from '@ai-news/schemas';

export const PollBlockView: React.FC<{ data: PollBlock['data']; blockId?: string }> = ({
  data,
}) => {
  const storageKey = `globalpulse_poll_${data.pollId}`;
  const [votedOptionId, setVotedOptionId] = React.useState<string | null>(null);
  const [options, setOptions] = React.useState(data.options);
  const [totalVotes, setTotalVotes] = React.useState(data.totalVotes);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setVotedOptionId(saved);
      else if (data.userVotedOptionId) setVotedOptionId(data.userVotedOptionId);
    } catch {}
  }, [storageKey, data.userVotedOptionId]);

  const handleVote = (optionId: string) => {
    if (votedOptionId || data.closed || isSubmitting) return;

    setIsSubmitting(true);
    setVotedOptionId(optionId);
    try {
      localStorage.setItem(storageKey, optionId);
    } catch {}

    setOptions((prev) =>
      prev.map((opt) => (opt.id === optionId ? { ...opt, voteCount: opt.voteCount + 1 } : opt))
    );
    setTotalVotes((prev) => prev + 1);
    setIsSubmitting(false);
  };

  const hasVoted = Boolean(votedOptionId) || data.closed;

  return (
    <div className="my-8 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/30 p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4 border-b border-indigo-100 dark:border-slate-800 pb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-500 animate-pulse" />
          Interactive Reader Poll
        </span>
        <div className="flex items-center gap-2">
          {data.closed && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              Poll Closed
            </span>
          )}
          <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
            {totalVotes.toLocaleString()} {totalVotes === 1 ? 'vote' : 'votes'}
          </span>
        </div>
      </div>

      <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 leading-snug">
        {data.question}
      </h4>

      <div className="space-y-3">
        {options.map((opt) => {
          const isSelected = votedOptionId === opt.id;
          const percentage = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;

          if (hasVoted) {
            return (
              <div
                key={opt.id}
                className={`relative rounded-xl overflow-hidden border p-3.5 transition-all ${
                  isSelected
                    ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-slate-900 dark:text-slate-100 ring-1 ring-indigo-400/40 dark:ring-indigo-500/40'
                    : 'border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/40 text-slate-800 dark:text-slate-300'
                }`}
              >
                {/* Progress bar background fill */}
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${
                    isSelected
                      ? 'bg-indigo-200/60 dark:bg-indigo-600/30'
                      : 'bg-slate-100 dark:bg-slate-800/40'
                  }`}
                  style={{ width: `${percentage}%` }}
                />

                <div className="relative z-10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </span>
                    )}
                    <span className="text-sm font-semibold">{opt.text}</span>
                  </div>
                  <div className="flex items-baseline gap-2 font-mono text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">{percentage}%</span>
                    <span className="text-slate-500 dark:text-slate-400">({opt.voteCount})</span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleVote(opt.id)}
              disabled={isSubmitting}
              className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-slate-800/90 transition-all flex items-center justify-between group cursor-pointer shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 group-hover:border-indigo-600 dark:group-hover:border-indigo-400 group-hover:scale-110 transition-all shrink-0" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-950 dark:group-hover:text-white transition-colors leading-normal">
                  {opt.text}
                </span>
              </div>
              <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-3">
                Vote →
              </span>
            </button>
          );
        })}
      </div>

      {hasVoted && (
        <div className="mt-4 pt-3 border-t border-indigo-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            {votedOptionId
              ? 'Thank you for contributing your perspective.'
              : 'Voting is now closed.'}
          </span>
          <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
            Live consensus tally
          </span>
        </div>
      )}
    </div>
  );
};

export const LiveTickerBlockView: React.FC<{ data: LiveTickerBlock['data'] }> = ({ data }) => {
  const [selectedSymbol, setSelectedSymbol] = React.useState<string | null>(null);

  return (
    <div className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Live Market & Numerical Ticker
          </span>
          {data.title && (
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700 pl-2.5">
              {data.title}
            </span>
          )}
        </div>
        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
          Refreshes every {data.refreshIntervalSeconds || 30}s
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {data.items.map((item, idx) => {
          const isPositive = item.delta >= 0;
          const isSelected = selectedSymbol === item.symbol;

          // Build SVG sparkline polyline
          const sparkline =
            item.sparkline && item.sparkline.length > 0 ? item.sparkline : [item.value, item.value];
          const min = Math.min(...sparkline);
          const max = Math.max(...sparkline);
          const range = max - min || 1;
          const points = sparkline
            .map((val, i) => {
              const x = (i / (sparkline.length - 1 || 1)) * 100;
              const y = 28 - ((val - min) / range) * 24;
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(' ');

          return (
            <div
              key={idx}
              onClick={() => setSelectedSymbol(isSelected ? null : item.symbol)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/20 shadow-xs ring-1 ring-indigo-500/50'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20">
                  {item.symbol}
                </span>
                <span
                  className={`text-xs font-bold flex items-center gap-0.5 px-2 py-0.5 rounded ${
                    isPositive
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                      : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                  }`}
                >
                  <span>{isPositive ? '↑' : '↓'}</span>
                  <span>
                    {isPositive ? '+' : ''}
                    {item.delta.toFixed(2)}%
                  </span>
                </span>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-1">
                {item.label}
              </div>

              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight font-mono">
                  {item.unit && item.unit !== '%' ? item.unit : ''}
                  {item.value.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  {item.unit === '%' ? '%' : ''}
                </span>
              </div>

              {/* Sparkline track */}
              <div className="mt-2 h-7 w-full overflow-hidden">
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox="0 0 100 30"
                  preserveAspectRatio="none"
                >
                  <polyline
                    fill="none"
                    stroke={isPositive ? '#10b981' : '#f43f5e'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ComparisonBlockView: React.FC<{ data: ComparisonBlock['data'] }> = ({ data }) => {
  return (
    <div className="my-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-6 shadow-sm">
      {data.title && (
        <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-5">{data.title}</h4>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-blue-200 dark:border-blue-500/20 bg-blue-50/60 dark:bg-blue-950/10 p-5">
          <h5 className="font-bold text-base text-blue-700 dark:text-blue-400 border-b border-blue-200 dark:border-blue-500/20 pb-2 mb-3">
            {data.subjectA.name}
          </h5>
          <ul className="space-y-2">
            {data.subjectA.points.map((pt, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
              >
                <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">•</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-purple-200 dark:border-purple-500/20 bg-purple-50/60 dark:bg-purple-950/10 p-5">
          <h5 className="font-bold text-base text-purple-700 dark:text-purple-400 border-b border-purple-200 dark:border-purple-500/20 pb-2 mb-3">
            {data.subjectB.name}
          </h5>
          <ul className="space-y-2">
            {data.subjectB.points.map((pt, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
              >
                <span className="text-purple-600 dark:text-purple-400 font-bold mt-0.5">•</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
