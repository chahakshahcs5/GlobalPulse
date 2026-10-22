'use client';

import React from 'react';
import type { KnowledgeGraphBlock } from '@ai-news/schemas';
import { KnowledgeGraphRenderer } from '@ai-news/media';

/**
 * Knowledge graph.
 *
 * The picture shows the shape of the relationships; the list underneath is
 * the same data as text, so the relationships stay readable when the graph is
 * dense or the reader cannot use the image.
 */
export const KnowledgeGraphBlockView: React.FC<{
  data: KnowledgeGraphBlock['data'];
  theme?: 'dark' | 'light';
}> = ({ data, theme = 'light' }) => {
  const svg = React.useMemo(
    () =>
      KnowledgeGraphRenderer.renderToSvg(data, {
        theme,
        width: 800,
        height: 620,
        // The heading below already says this, so the graph does not repeat it.
        showTitle: false,
      }),
    [data, theme]
  );

  const nodeIds = new Set(data.nodes.map((n) => n.id));
  const validEdges = data.edges.filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to));

  const nodeById = new Map(data.nodes.map((n) => [n.id, n]));

  return (
    <section
      aria-label={data.title}
      className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden"
    >
      <header className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
        {data.description && (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{data.description}</p>
        )}
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {data.nodes.length} node{data.nodes.length === 1 ? '' : 's'} · {validEdges.length}{' '}
          relationship{validEdges.length === 1 ? '' : 's'}
        </p>
      </header>

      <div className="p-3 sm:p-4">
        <div className="[&_svg]:w-full [&_svg]:h-auto" dangerouslySetInnerHTML={{ __html: svg }} />
      </div>

      <div className="px-5 pb-4 overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-2 pr-3 font-semibold">From</th>
              <th className="py-2 pr-3 font-semibold">Relationship</th>
              <th className="py-2 font-semibold">To</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {validEdges.map((edge) => (
              <tr key={edge.id}>
                <td className="py-2 pr-3 font-semibold text-slate-800 dark:text-slate-200">
                  {nodeById.get(edge.from)?.label ?? edge.from}
                  <span className="block font-normal text-[10px] uppercase text-slate-400 dark:text-slate-500">
                    {nodeById.get(edge.from)?.type}
                  </span>
                </td>
                <td className="py-2 pr-3 italic text-slate-600 dark:text-slate-400">
                  {edge.label ?? edge.relation}
                </td>
                <td className="py-2 font-semibold text-slate-800 dark:text-slate-200">
                  {nodeById.get(edge.to)?.label ?? edge.to}
                  <span className="block font-normal text-[10px] uppercase text-slate-400 dark:text-slate-500">
                    {nodeById.get(edge.to)?.type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
        {data.methodology && <p>Methodology: {data.methodology}</p>}
        {data.sourceAttribution && <p>Source: {data.sourceAttribution}</p>}
      </footer>
    </section>
  );
};
