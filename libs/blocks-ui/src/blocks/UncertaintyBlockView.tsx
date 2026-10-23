'use client';

import React from 'react';
import type { UncertaintyBlock } from '@ai-news/schemas';
import { NUMBER_LOCALE, UncertaintyRenderer } from '@ai-news/media';

/**
 * Estimates with confidence intervals.
 *
 * The chart draws every estimate as a point marker with a whisker spanning
 * its interval. The interval label, the sample size and the methodology stay
 * visible as text — the number is never the only thing on screen.
 */
export const UncertaintyBlockView: React.FC<{
  data: UncertaintyBlock['data'];
  theme?: 'dark' | 'light';
}> = ({ data, theme = 'light' }) => {
  const svg = UncertaintyRenderer.renderToSvg(data, {
    theme,
    width: 800,
    height: 460,
    // The heading below already says this, so the chart does not repeat it.
    showTitle: false,
  });

  /*
   * How the estimates are drawn.
   *
   * As intervals on a chart, as a forest plot drawn in text, or as a
   * table of the numbers. The estimates are the same; only the
   * treatment changes.
   */
  const layout = data.layout ?? 'intervals';

  if (layout === 'table') {
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
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800/60 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Estimate</th>
                <th className="px-4 py-2.5 font-semibold">Value</th>
                <th className="px-4 py-2.5 font-semibold">Low</th>
                <th className="px-4 py-2.5 font-semibold">High</th>
                {data.intervalLabel && <th className="px-4 py-2.5 font-semibold">n</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {data.points.map((point) => (
                <tr key={point.id ?? point.label}>
                  <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                    {point.label}
                    {point.sourceId && (
                      <span className="block font-mono text-[10px] text-slate-400 dark:text-slate-500">
                        {point.sourceId}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-900 dark:text-slate-100">
                    {point.value.toLocaleString(NUMBER_LOCALE)} {data.unit}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-500 dark:text-slate-400">
                    {point.low.toLocaleString(NUMBER_LOCALE)}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-500 dark:text-slate-400">
                    {point.high.toLocaleString(NUMBER_LOCALE)}
                  </td>
                  {data.intervalLabel && (
                    <td className="px-4 py-2.5 font-mono text-slate-500 dark:text-slate-400">
                      {point.n ?? '—'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  if (layout === 'forest') {
    const allValues = data.points.flatMap((point) => [point.low, point.high]);
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const span = max - min || 1;
    const scale = (value: number) => ((value - min) / span) * 100;

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
        </header>

        <ul className="px-5 py-4 space-y-4">
          {data.points.map((point) => (
            <li key={point.id ?? point.label}>
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {point.label}
                  {point.sourceId && (
                    <span className="ml-2 font-mono text-[10px] font-normal text-slate-400 dark:text-slate-500">
                      {point.sourceId}
                    </span>
                  )}
                </span>
                <span className="font-mono text-slate-500 dark:text-slate-400">
                  {point.value.toLocaleString(NUMBER_LOCALE)} {data.unit}
                </span>
              </div>
              <div className="relative mt-1.5 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                <span
                  className="absolute h-2 rounded-full bg-indigo-400/70"
                  style={{
                    left: `${scale(point.low)}%`,
                    width: `${Math.max(1, scale(point.high) - scale(point.low))}%`,
                  }}
                />
                <span
                  className="absolute -top-1 h-4 w-0.5 bg-slate-900 dark:bg-slate-100"
                  style={{ left: `${scale(point.value)}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-400 dark:text-slate-500">
                <span>{point.low.toLocaleString(NUMBER_LOCALE)}</span>
                <span>{point.high.toLocaleString(NUMBER_LOCALE)}</span>
              </div>
            </li>
          ))}
        </ul>

        {data.referenceValue !== undefined && (
          <p className="px-5 pb-3 text-xs text-slate-500 dark:text-slate-400">
            {data.referenceLabel ?? 'Reference'}:{' '}
            {data.referenceValue.toLocaleString(NUMBER_LOCALE)} {data.unit}
          </p>
        )}
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
      </header>

      <div className="p-3 sm:p-4">
        <div className="[&_svg]:w-full [&_svg]:h-auto" dangerouslySetInnerHTML={{ __html: svg }} />
      </div>

      {/* The notes travel with the numbers, not just with the methodology. */}
      {data.points.some((p) => p.note) && (
        <ul className="px-5 pb-3 space-y-1.5">
          {data.points
            .filter((p) => p.note)
            .map((p, idx) => (
              <li
                key={p.id ?? `${p.label}-${idx}`}
                className="text-xs text-slate-600 dark:text-slate-400 flex gap-2"
              >
                <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                  {p.label}:
                </span>
                <span>{p.note}</span>
              </li>
            ))}
        </ul>
      )}

      <footer className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
        {data.sourceAttribution && <p>Source: {data.sourceAttribution}</p>}
        {data.methodology && <p>Methodology: {data.methodology}</p>}
        {data.confidenceLevel !== undefined && !data.intervalLabel && (
          <p>
            Interval: {Math.round(data.confidenceLevel * 100)}% confidence
            {data.unit ? ` · ${data.unit}` : ''}
          </p>
        )}
        {data.unit && !data.confidenceLevel && <p>Unit: {data.unit}</p>}
      </footer>
    </section>
  );
};
