'use client';

import React from 'react';
import type { CorrelationBlock } from '@ai-news/schemas';
import { CorrelationModel, CorrelationRenderer } from '@ai-news/media';

/**
 * Correlation matrix.
 *
 * The coefficients, the sample sizes and the significance are all shown. A
 * reader should be able to tell a strong, well-evidenced relationship from a
 * strong-looking one computed from three observations.
 */
export const CorrelationBlockView: React.FC<{ data: CorrelationBlock['data'] }> = ({ data }) => {
  const matrix = React.useMemo(() => CorrelationModel.compute(data), [data]);
  const summary = React.useMemo(() => CorrelationModel.summarise(matrix), [matrix]);
  const svg = React.useMemo(
    () => CorrelationRenderer.renderToSvg(data, { theme: 'light', width: 800, height: 520 }),
    [data]
  );

  const strongest = matrix.strongest;

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

      {summary && (
        <div className="px-5 pb-3">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* The pairings, as text — the matrix is a picture, this is the data. */}
      <div className="px-5 pb-4 overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-2 pr-3 font-semibold">Pair</th>
              <th className="py-2 pr-3 font-semibold">r</th>
              <th className="py-2 pr-3 font-semibold">n</th>
              <th className="py-2 pr-3 font-semibold">p</th>
              <th className="py-2 font-semibold">Reading</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {matrix.variables.map((rowVariable, row) =>
              matrix.variables.slice(row + 1).map((columnVariable, offset) => {
                const cell = matrix.cells[row][row + 1 + offset];
                return (
                  <tr key={`${rowVariable.key}-${columnVariable.key}`}>
                    <td className="py-2 pr-3 font-semibold text-slate-800 dark:text-slate-200">
                      {rowVariable.label} &amp; {columnVariable.label}
                    </td>
                    <td className="py-2 pr-3 font-mono">
                      {cell.coefficient === null ? '—' : cell.coefficient.toFixed(3)}
                    </td>
                    <td className="py-2 pr-3 font-mono">{cell.n}</td>
                    <td className="py-2 pr-3 font-mono">
                      {cell.pValue < 0.001 ? '<0.001' : cell.pValue.toFixed(3)}
                    </td>
                    <td className="py-2">
                      {cell.description}
                      {cell.isSignificant ? (
                        <span className="ml-1.5 text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                          significant
                        </span>
                      ) : (
                        <span className="ml-1.5 text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">
                          not significant
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <footer className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
        <p>
          Pearson's r over {data.observations.length} observation
          {data.observations.length === 1 ? '' : 's'}. A correlation is a relationship, not a cause.
        </p>
        {(data.rowLabels?.length ?? 0) > 0 && (
          <p className="font-mono">Rows: {data.rowLabels?.join(', ')}</p>
        )}
        {strongest && !strongest.isSignificant && (
          <p className="text-amber-700 dark:text-amber-400">
            The strongest pairing in this matrix is not statistically significant.
          </p>
        )}
        {data.methodology && <p>Methodology: {data.methodology}</p>}
        {data.sourceAttribution && <p>Source: {data.sourceAttribution}</p>}
      </footer>
    </section>
  );
};
