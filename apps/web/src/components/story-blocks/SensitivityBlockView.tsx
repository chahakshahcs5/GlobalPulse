'use client';

import React from 'react';
import type { SensitivityBlock } from '@ai-news/schemas';
import { SensitivityRenderer } from '@ai-news/media';

/**
 * Sensitivity analysis.
 *
 * The tornado chart shows how far each assumption moves the outcome. The
 * numbers behind it are also rendered as a table, because a reader should be
 * able to read the actual values, not only judge bar lengths.
 */
export const SensitivityBlockView: React.FC<{ data: SensitivityBlock['data'] }> = ({ data }) => {
  const swings = React.useMemo(() => SensitivityRenderer.computeSwings(data), [data]);
  const notices = React.useMemo(() => SensitivityRenderer.getNotices(data), [data]);
  const svg = React.useMemo(
    () => SensitivityRenderer.renderToSvg(data, { theme: 'light', width: 800, height: 460 }),
    [data]
  );

  const format = (value: number) => {
    if (!Number.isFinite(value)) return '—';
    const abs = Math.abs(value);
    if (abs === 0) return '0';
    if (abs >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
    if (abs >= 1) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
    return value.toLocaleString(undefined, { maximumFractionDigits: 3 });
  };

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

      {swings.length > 0 && (
        <div className="px-5 pb-4 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2 pr-3 font-semibold">Input</th>
                <th className="py-2 pr-3 font-semibold">Range explored</th>
                <th className="py-2 pr-3 font-semibold">Output at low</th>
                <th className="py-2 pr-3 font-semibold">Output at high</th>
                <th className="py-2 font-semibold">Swing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {swings.map((swing) => (
                <tr key={swing.id}>
                  <td className="py-2 pr-3 font-semibold text-slate-800 dark:text-slate-200">
                    {swing.label}
                    {swing.note && (
                      <span className="block font-normal text-slate-500 dark:text-slate-400">
                        {swing.note}
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3 font-mono">
                    {format(swing.low)} – {format(swing.high)}
                    {swing.unit ? ` ${swing.unit}` : ''}
                  </td>
                  <td className="py-2 pr-3 font-mono">{format(swing.outputLow)}</td>
                  <td className="py-2 pr-3 font-mono">{format(swing.outputHigh)}</td>
                  <td className="py-2 font-mono font-bold">
                    {format(swing.swing)}
                    {data.outputUnit ? ` ${data.outputUnit}` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <footer className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
        <p>
          Base case: {format(data.baseOutput)}
          {data.outputUnit ? ` ${data.outputUnit}` : ''} {data.outputLabel}
        </p>
        {notices.map((notice) => (
          <p key={notice} className="text-amber-700 dark:text-amber-400 font-medium">
            {notice}
          </p>
        ))}
        {data.methodology && <p>Methodology: {data.methodology}</p>}
        {data.sourceAttribution && <p>Source: {data.sourceAttribution}</p>}
      </footer>
    </section>
  );
};
