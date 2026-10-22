'use client';

import React from 'react';
import type { PredictionLeaderboardBlock } from '@ai-news/schemas';
import { PredictionScorer, CalibrationRenderer } from '@ai-news/media';

/**
 * Prediction leaderboard.
 *
 * A newsroom that publishes forecasts has to say who was right. The table
 * ranks forecasters by Brier score (lower is better), and the calibration
 * chart shows whether they are well-calibrated rather than merely lucky.
 */
export const PredictionLeaderboardBlockView: React.FC<{
  data: PredictionLeaderboardBlock['data'];
  theme?: 'dark' | 'light';
}> = ({ data, theme = 'light' }) => {
  const scores = React.useMemo(() => PredictionScorer.scoreForecasters(data), [data]);
  const calibrationSvg = React.useMemo(
    () => CalibrationRenderer.renderToSvg(data, { theme, width: 520, height: 360 }),
    [data, theme]
  );

  const resolvedCount = data.predictions.filter(
    (p) => p.resolved && p.outcome !== undefined
  ).length;

  const formatScore = (value: number | null) => (value === null ? '—' : value.toFixed(3));
  const formatPercent = (value: number | null) =>
    value === null ? '—' : `${Math.round(value * 100)}%`;

  /*
   * How the board is drawn.
   *
   * As a table of scores, as a card a forecaster, or as bars scaled to
   * the score. The board is the same; only the treatment changes.
   */
  const layout = data.layout ?? 'table';

  if (layout === 'cards' || layout === 'bars') {
    const best = Math.min(
      ...scores.map((score) => score.brierScore ?? Number.POSITIVE_INFINITY),
      Number.POSITIVE_INFINITY
    );
    const worst = Math.max(...scores.map((score) => score.brierScore ?? 0), 0.0001);

    return (
      <section
        aria-label={data.title}
        className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden"
      >
        <header className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
          {data.subtitle && (
            <p className="text-sm text-slate-600 dark:text-slate-400">{data.subtitle}</p>
          )}
          {data.scoringMethod && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{data.scoringMethod}</p>
          )}
        </header>

        <ul className="px-5 py-4 space-y-3">
          {scores.map((score) => (
            <li
              key={score.forecaster}
              className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {score.forecaster}
                </span>
                <span className="font-mono text-sm text-slate-700 dark:text-slate-300">
                  {formatScore(score.brierScore)}
                </span>
              </div>
              {layout === 'bars' && (
                <div className="mt-1.5 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{
                      width: `${
                        worst > best
                          ? 100 - (((score.brierScore ?? 0) - best) / (worst - best)) * 100
                          : 100
                      }%`,
                    }}
                  />
                </div>
              )}
              <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {score.resolved} resolved · accuracy {formatPercent(score.accuracy)}
              </div>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section
      aria-label={data.title}
      className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden"
    >
      <header className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
        {data.subtitle && (
          <p className="text-sm text-slate-600 dark:text-slate-400">{data.subtitle}</p>
        )}
        {data.description && (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{data.description}</p>
        )}
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {data.predictions.length} tracked prediction
          {data.predictions.length === 1 ? '' : 's'}, {resolvedCount} resolved.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
        <div className="lg:col-span-3 px-5 py-4 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2 pr-3 font-semibold">Forecaster</th>
                <th className="py-2 pr-3 font-semibold">Brier score</th>
                <th className="py-2 pr-3 font-semibold">Resolved</th>
                <th className="py-2 pr-3 font-semibold">Accuracy</th>
                <th className="py-2 font-semibold">Avg confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {scores.map((score, idx) => (
                <tr key={score.forecaster}>
                  <td className="py-2 pr-3 font-semibold text-slate-800 dark:text-slate-200">
                    <span className="text-slate-400 dark:text-slate-500 mr-1.5 font-mono">
                      {idx + 1}
                    </span>
                    {score.forecaster}
                  </td>
                  <td className="py-2 pr-3 font-mono font-bold">
                    {formatScore(score.brierScore)}
                    {score.brierScore !== null && idx === 0 && (
                      <span className="ml-1.5 text-[10px] font-sans text-emerald-600 dark:text-emerald-400">
                        best
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3 font-mono">
                    {score.resolved}
                    {score.open > 0 && (
                      <span className="text-slate-400 dark:text-slate-500">
                        {' '}
                        +{score.open} open
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3 font-mono">{formatPercent(score.accuracy)}</td>
                  <td className="py-2 font-mono">{formatPercent(score.averageConfidence)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
            Brier score: lower is better. A perfect forecaster scores 0, a coin flip 0.25, and a
            forecaster who is always wrong 1.
          </p>
          {data.scoringMethod && (
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {data.scoringMethod}
            </p>
          )}

          {/*
            The scores say who is best. The predictions say what they were
            best at, so they are listed too.
          */}
          {data.predictions.length > 0 && (
            <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                The predictions
              </h4>
              <ul className="space-y-2">
                {data.predictions.map((prediction) => (
                  <li key={prediction.id} className="text-xs">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {prediction.claim}
                      </span>
                      <span className="font-mono text-slate-500 dark:text-slate-400 shrink-0">
                        {Math.round(prediction.probability * 100)}%
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 text-[10px] font-mono text-slate-400 dark:text-slate-500">
                      <span>{prediction.forecaster}</span>
                      {prediction.forecasterId && <span>{prediction.forecasterId}</span>}
                      {prediction.predictedAt && <span>made {prediction.predictedAt}</span>}
                      {prediction.resolvesAt && <span>resolves {prediction.resolvesAt}</span>}
                      {prediction.sourceId && <span>{prediction.sourceId}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 px-5 py-4 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800">
          <div
            className="[&_svg]:w-full [&_svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: calibrationSvg }}
          />
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Each circle is a band of predicted probabilities; the number is how many resolved
            predictions fall in it. A point on the diagonal means the forecasters were right as
            often as they claimed.
          </p>
        </div>
      </div>

      <footer className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
        {data.methodology && <p>Methodology: {data.methodology}</p>}
        {data.sourceAttribution && <p>Source: {data.sourceAttribution}</p>}
      </footer>
    </section>
  );
};
