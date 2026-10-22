'use client';

import React from 'react';
import type { PollBlock, LiveTickerBlock, ComparisonBlock, PollTally } from '@ai-news/schemas';
import { useBlockRuntime } from './runtime';
import { useLiveFeed } from './useLiveFeed';
import { formatUtcDate } from '../date-utils';

/**
 * Reader poll.
 *
 * Votes are recorded on the server so the tally is shared across every
 * reader, not just this browser. The component also listens on the story's
 * realtime channel so the counts update live as other readers vote.
 */
export const PollBlockView: React.FC<{
  data: PollBlock['data'];
  blockId?: string;
  storyId?: string;
}> = ({ data, blockId, storyId }) => {
  const runtime = useBlockRuntime();
  const storageKey = `globalpulse_poll_${data.pollId}`;
  const [votedOptionId, setVotedOptionId] = React.useState<string | null>(
    data.userVotedOptionId ?? null
  );
  const [options, setOptions] = React.useState(data.options);
  const [totalVotes, setTotalVotes] = React.useState(data.totalVotes);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [voteError, setVoteError] = React.useState<string | null>(null);

  // Apply a server-computed tally to local state.
  const applyTally = React.useCallback((tally: PollTally) => {
    setOptions(
      tally.options.map((o) => ({
        id: o.id,
        text: o.text,
        voteCount: o.voteCount,
      }))
    );
    setTotalVotes(tally.totalVotes);
    if (tally.userVotedOptionId) {
      setVotedOptionId(tally.userVotedOptionId);
    }
  }, []);

  // Pull the authoritative tally (server votes + the payload baseline).
  React.useEffect(() => {
    if (!storyId || !blockId) return;
    let cancelled = false;

    runtime
      .getPollTally(storyId, blockId)
      .then((tally) => {
        if (!cancelled) applyTally(tally);
      })
      .catch(() => {
        // Keep the payload counts as a fallback when the API is unreachable.
      });

    return () => {
      cancelled = true;
    };
  }, [storyId, blockId, applyTally, runtime]);

  // Live updates: other readers voting on the same poll.
  React.useEffect(() => {
    if (!storyId || !blockId) return;

    const unsubscribe = runtime.subscribeToRealtimeEvents([`story_${storyId}`], (event) => {
      if (event.type !== 'poll.vote') return;
      const payload = event.data as { blockId?: string; tally?: PollTally } | undefined;
      if (!payload?.tally || payload.blockId !== blockId) return;
      applyTally(payload.tally);
    });

    return unsubscribe;
  }, [storyId, blockId, applyTally, runtime]);

  // Fall back to a local record of the vote for readers who are not signed
  // in, so the UI still reflects that they have chosen an option.
  React.useEffect(() => {
    if (votedOptionId) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setVotedOptionId(saved);
    } catch {
      // localStorage unavailable (private mode / SSR)
    }
  }, [storageKey, votedOptionId]);

  const handleVote = async (optionId: string) => {
    if (votedOptionId || data.closed || isSubmitting) return;

    setIsSubmitting(true);
    setVoteError(null);

    // Optimistic update so the click feels instant; the server response
    // replaces it with the authoritative tally.
    setVotedOptionId(optionId);
    try {
      localStorage.setItem(storageKey, optionId);
    } catch {
      // ignore
    }

    if (!storyId || !blockId) {
      // No story context (e.g. the editor preview) — keep the local behaviour.
      setOptions((prev) =>
        prev.map((opt) => (opt.id === optionId ? { ...opt, voteCount: opt.voteCount + 1 } : opt))
      );
      setTotalVotes((prev) => prev + 1);
      setIsSubmitting(false);
      return;
    }

    try {
      const tally = await runtime.castPollVote(storyId, blockId, optionId);
      applyTally(tally);
    } catch (err) {
      setVotedOptionId(null);
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
      setVoteError(
        err instanceof Error && err.message
          ? err.message
          : 'Your vote could not be recorded. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasVoted = Boolean(votedOptionId) || data.closed;

  /*
   * How the poll is drawn.
   *
   * The answers can be rows filled to the proportion of votes, a row of
   * pills, or a plain list with the counts beside them. The question and
   * the answers are the same; only the treatment changes.
   */
  const layout = data.layout ?? 'bars';

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
          {data.expiresAt && !data.closed && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
              Closes {formatUtcDate(data.expiresAt)}
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

      {layout === 'pills' && (
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => {
            const isSelected = votedOptionId === opt.id;
            const percentage = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;

            if (hasVoted) {
              return (
                <span
                  key={opt.id}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    isSelected
                      ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-slate-900 dark:text-slate-100'
                      : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {opt.text}
                  <span className="font-mono font-bold">{percentage}%</span>
                </span>
              );
            }

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleVote(opt.id)}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50/50 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
              >
                {opt.text}
                <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">
                  Vote →
                </span>
              </button>
            );
          })}
        </div>
      )}

      {layout === 'list' && (
        <ul className="divide-y divide-slate-200 dark:divide-slate-800 border-y border-slate-200 dark:border-slate-800">
          {options.map((opt) => {
            const isSelected = votedOptionId === opt.id;
            const percentage = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;

            return (
              <li key={opt.id} className="flex items-center justify-between gap-3 py-2.5">
                {hasVoted ? (
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </span>
                    )}
                    {opt.text}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleVote(opt.id)}
                    disabled={isSubmitting}
                    className="flex items-center gap-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    <span className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0" />
                    {opt.text}
                  </button>
                )}
                {hasVoted && (
                  <span className="flex items-baseline gap-2 font-mono text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">{percentage}%</span>
                    <span className="text-slate-500 dark:text-slate-400">({opt.voteCount})</span>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {layout === 'bars' && (
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
                      <span className="font-bold text-slate-900 dark:text-white">
                        {percentage}%
                      </span>
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
      )}

      {voteError && (
        <div
          role="alert"
          className="mt-4 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-lg px-3 py-2"
        >
          {voteError}
        </div>
      )}

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
  const live = useLiveFeed(data.liveKey, data.refreshIntervalSeconds || 30);

  // A live feed supplies the freshest values; without one the block keeps
  // showing the snapshot stored in the story payload.
  const items: LiveTickerBlock['data']['items'] = live.items
    ? live.items.map((item) => ({
        symbol: item.id,
        label: item.label,
        value: typeof item.value === 'number' ? item.value : Number(item.value) || 0,
        delta: item.change ?? 0,
        unit: item.unit,
        sparkline: item.sparkline ?? [],
        lastUpdated: item.asOf ?? live.asOf ?? undefined,
      }))
    : data.items;

  /*
   * How the ticker is drawn.
   *
   * As a row of figures, as a grid, or as a card each. The figures are
   * the same; only the treatment changes.
   */
  const layout = data.layout ?? 'grid';

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
          {live.isLive
            ? `Live · refreshes every ${data.refreshIntervalSeconds || 30}s`
            : `Refreshes every ${data.refreshIntervalSeconds || 30}s`}
        </span>
      </div>

      <div
        className={
          layout === 'row'
            ? 'flex flex-wrap gap-6'
            : layout === 'cards'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5'
              : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5'
        }
      >
        {items.map((item, idx) => {
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
  /*
   * How the comparison is drawn.
   *
   * The two sides can sit side by side, be set against each other as a
   * table of matching points, or be set against each other as a head-to-
   * head with a rule down the middle. The comparison is the same; only
   * the treatment changes.
   */
  const layout = data.layout ?? 'split';

  const pointsA = data.subjectA.points;
  const pointsB = data.subjectB.points;
  const rowCount = Math.max(pointsA.length, pointsB.length);

  if (layout === 'table') {
    return (
      <div className="my-8">
        {data.title && (
          <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            {data.title}
          </h4>
        )}
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800/60">
              <tr>
                <th className="px-4 py-3 font-semibold text-blue-700 dark:text-blue-400">
                  {data.subjectA.name}
                </th>
                <th className="px-4 py-3 font-semibold text-purple-700 dark:text-purple-400">
                  {data.subjectB.name}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {Array.from({ length: rowCount }).map((_, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-3 align-top text-slate-700 dark:text-slate-300">
                    {pointsA[idx] ?? ''}
                  </td>
                  <td className="px-4 py-3 align-top text-slate-700 dark:text-slate-300">
                    {pointsB[idx] ?? ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (layout === 'versus') {
    return (
      <div className="my-8 text-center">
        {data.title && (
          <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            {data.title}
          </h4>
        )}
        <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-4">
          <div className="text-right">
            <h5 className="text-lg font-black text-blue-700 dark:text-blue-400">
              {data.subjectA.name}
            </h5>
            <ul className="mt-3 space-y-2">
              {pointsA.map((pt, idx) => (
                <li key={idx} className="text-sm text-slate-700 dark:text-slate-300">
                  {pt}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center">
            <span className="rounded-full border-2 border-slate-300 dark:border-slate-700 px-3 py-1 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              vs
            </span>
          </div>

          <div className="text-left">
            <h5 className="text-lg font-black text-purple-700 dark:text-purple-400">
              {data.subjectB.name}
            </h5>
            <ul className="mt-3 space-y-2">
              {pointsB.map((pt, idx) => (
                <li key={idx} className="text-sm text-slate-700 dark:text-slate-300">
                  {pt}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

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
