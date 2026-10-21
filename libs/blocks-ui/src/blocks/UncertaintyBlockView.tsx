'use client';

import React from 'react';
import type { UncertaintyBlock } from '@ai-news/schemas';
import { UncertaintyRenderer } from '@ai-news/media';

/**
 * Estimates with confidence intervals.
 *
 * The chart draws every estimate as a point marker with a whisker spanning
 * its interval. The interval label, the sample size and the methodology stay
 * visible as text — the number is never the only thing on screen.
 */
export const UncertaintyBlockView: React.FC<{ data: UncertaintyBlock['data'] }> = ({ data }) => {
  const svg = UncertaintyRenderer.renderToSvg(data, { theme: 'light', width: 800, height: 460 });

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
