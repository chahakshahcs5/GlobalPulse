'use client';

import React from 'react';
import type { ChartBlock } from '@ai-news/schemas';
import { D3ChartRenderer } from '@ai-news/media';

/**
 * Chart with click-to-reveal annotations.
 *
 * The SVG is rendered on the server, so the annotation markers arrive as
 * plain markup. Clicks are handled by delegation on the container (React
 * cannot attach handlers to `dangerouslySetInnerHTML` content), and the
 * selected annotation is shown in a panel beneath the chart.
 *
 * The annotation list is always rendered as buttons, so an annotation stays
 * reachable even on chart types that have no marker to click — and so the
 * content is never hidden behind an interaction.
 */
export const ChartBlockView: React.FC<{
  data: ChartBlock['data'];
  theme: 'dark' | 'light';
}> = ({ data, theme }) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const annotations = data.annotations ?? [];
  const selected = annotations.find((a) => a.id === selectedId) ?? null;

  // A sparkline is a trend indicator, not a full plot — give it a compact
  // canvas so it reads as an inline trend rather than a chart with acres of
  // whitespace.
  const isSparkline = data.chartType === 'sparkline';
  const svg = React.useMemo(
    () =>
      D3ChartRenderer.renderToSvg(
        data,
        isSparkline ? { theme, width: 800, height: 140 } : { theme, width: 800, height: 440 }
      ),
    [data, theme, isSparkline]
  );

  // Delegate clicks on the SVG markers to React state.
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || annotations.length === 0) return;

    const handleClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement | null)?.closest?.(
        '[data-annotation-id]'
      ) as HTMLElement | null;
      if (!target) return;
      const id = target.getAttribute('data-annotation-id');
      if (id) setSelectedId((current) => (current === id ? null : id));
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const target = (event.target as HTMLElement | null)?.closest?.(
        '[data-annotation-id]'
      ) as HTMLElement | null;
      if (!target) return;
      event.preventDefault();
      const id = target.getAttribute('data-annotation-id');
      if (id) setSelectedId((current) => (current === id ? null : id));
    };

    container.addEventListener('click', handleClick);
    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('click', handleClick);
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [annotations.length]);

  return (
    <figure className="my-8 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-md">
      <div ref={containerRef}>
        <div className="p-3 sm:p-4">
          <div
            className="[&_svg]:w-full [&_svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
      </div>

      {annotations.length > 0 && (
        <div className="px-5 pb-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Chart annotations">
            {annotations.map((annotation, idx) => {
              const isActive = annotation.id === selectedId;
              return (
                <button
                  key={annotation.id}
                  type="button"
                  onClick={() =>
                    setSelectedId((current) => (current === annotation.id ? null : annotation.id))
                  }
                  aria-expanded={isActive}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isActive
                      ? 'border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-500 dark:bg-amber-500/15 dark:text-amber-300'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-amber-400 hover:bg-amber-50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:border-amber-500'
                  }`}
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[11px] font-extrabold text-slate-900">
                    {idx + 1}
                  </span>
                  {annotation.label}
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-500/25 dark:bg-amber-500/10">
              <h5 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                {selected.label}
              </h5>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{selected.body}</p>
              {selected.sourceId && (
                <p className="mt-2 text-[11px] font-mono text-amber-800/70 dark:text-amber-300/70">
                  Source: {selected.sourceId}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {(data.subtitle || data.sourceAttribution) && (
        <figcaption className="px-5 py-2.5 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap justify-between items-center gap-2">
          <span>{data.subtitle || data.title}</span>
          {data.sourceAttribution && (
            <span className="font-mono text-[11px]">Source: {data.sourceAttribution}</span>
          )}
        </figcaption>
      )}
    </figure>
  );
};
