'use client';

import React from 'react';
import type {
  AnomalyBlock,
  ChartBlock,
  NetworkGraphBlock,
  RegressionBlock,
  SankeyBlock,
  SurveyResultsBlock,
  TreemapBlock,
} from '@ai-news/schemas';
import {
  computeNetworkLayout,
  D3ChartRenderer,
  networkGroupColor,
  networkGroups,
  SankeyRenderer,
  SurveyResultsRenderer,
  TreemapRenderer,
} from '@ai-news/media';
import { AnomalyRenderer } from '@ai-news/media';
import { RegressionRenderer } from '@ai-news/media';

/**
 * Flow, hierarchy, structure and analysis.
 *
 * The blocks in this file share a shape: the platform does the arithmetic or
 * the layout, and the reader is shown both the picture and the numbers
 * behind it. Nothing here is drawn from values the editor typed in by hand
 * and nothing is shown without the method that produced it.
 */

/* ------------------------------------------------------------------------- *
 * Sankey
 * ------------------------------------------------------------------------- */

export const SankeyBlockView: React.FC<{
  data: SankeyBlock['data'];
  theme?: 'dark' | 'light';
}> = ({ data, theme = 'light' }) => {
  const svg = SankeyRenderer.renderToSvg(data, { theme, width: 800, height: 470 });

  return (
    <section
      aria-label={data.title ?? 'Flow diagram'}
      className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden"
    >
      {(data.title || data.subtitle) && (
        <header className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          {data.title && (
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
          )}
          {data.subtitle && (
            <p className="text-sm text-slate-600 dark:text-slate-400">{data.subtitle}</p>
          )}
        </header>
      )}

      <div className="p-3 sm:p-4">
        <div className="[&_svg]:w-full [&_svg]:h-auto" dangerouslySetInnerHTML={{ __html: svg }} />
      </div>

      {data.caption && (
        <p className="px-5 pb-3 text-sm text-slate-600 dark:text-slate-400">{data.caption}</p>
      )}

      <footer className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
        {data.sourceAttribution && <p>Source: {data.sourceAttribution}</p>}
        {data.methodology && <p>Methodology: {data.methodology}</p>}
        {data.unit && <p>Unit: {data.unit}</p>}
      </footer>
    </section>
  );
};

/* ------------------------------------------------------------------------- *
 * Treemap
 * ------------------------------------------------------------------------- */

export const TreemapBlockView: React.FC<{
  data: TreemapBlock['data'];
  theme?: 'dark' | 'light';
}> = ({ data, theme = 'light' }) => {
  const svg = TreemapRenderer.renderToSvg(data, { theme, width: 800, height: 470 });

  return (
    <section
      aria-label={data.title ?? 'Treemap'}
      className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden"
    >
      {(data.title || data.subtitle) && (
        <header className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          {data.title && (
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
          )}
          {data.subtitle && (
            <p className="text-sm text-slate-600 dark:text-slate-400">{data.subtitle}</p>
          )}
        </header>
      )}

      <div className="p-3 sm:p-4">
        <div className="[&_svg]:w-full [&_svg]:h-auto" dangerouslySetInnerHTML={{ __html: svg }} />
      </div>

      {data.caption && (
        <p className="px-5 pb-3 text-sm text-slate-600 dark:text-slate-400">{data.caption}</p>
      )}

      <footer className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
        {data.sourceAttribution && <p>Source: {data.sourceAttribution}</p>}
        {data.methodology && <p>Methodology: {data.methodology}</p>}
        {data.unit && <p>Unit: {data.unit}</p>}
      </footer>
    </section>
  );
};

/* ------------------------------------------------------------------------- *
 * Regression
 * ------------------------------------------------------------------------- */

export const RegressionBlockView: React.FC<{
  data: RegressionBlock['data'];
  theme?: 'dark' | 'light';
}> = ({ data, theme = 'light' }) => {
  const svg = RegressionRenderer.renderToSvg(data, { theme, width: 800, height: 470 });

  return (
    <section
      aria-label={data.title ?? 'Regression'}
      className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden"
    >
      {(data.title || data.subtitle) && (
        <header className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          {data.title && (
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
          )}
          {data.subtitle && (
            <p className="text-sm text-slate-600 dark:text-slate-400">{data.subtitle}</p>
          )}
        </header>
      )}

      <div className="p-3 sm:p-4">
        <div className="[&_svg]:w-full [&_svg]:h-auto" dangerouslySetInnerHTML={{ __html: svg }} />
      </div>

      {data.caption && (
        <p className="px-5 pb-3 text-sm text-slate-600 dark:text-slate-400">{data.caption}</p>
      )}

      <footer className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
        {data.sourceAttribution && <p>Source: {data.sourceAttribution}</p>}
        {data.methodology && <p>Methodology: {data.methodology}</p>}
        {data.lastUpdated && <p>Last updated: {data.lastUpdated}</p>}
      </footer>
    </section>
  );
};

/* ------------------------------------------------------------------------- *
 * Anomaly
 * ------------------------------------------------------------------------- */

export const AnomalyBlockView: React.FC<{
  data: AnomalyBlock['data'];
  theme?: 'dark' | 'light';
}> = ({ data, theme = 'light' }) => {
  const svg = AnomalyRenderer.renderToSvg(data, { theme, width: 800, height: 450 });

  return (
    <section
      aria-label={data.title ?? 'Anomalies'}
      className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden"
    >
      {(data.title || data.subtitle) && (
        <header className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          {data.title && (
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
          )}
          {data.subtitle && (
            <p className="text-sm text-slate-600 dark:text-slate-400">{data.subtitle}</p>
          )}
        </header>
      )}

      <div className="p-3 sm:p-4">
        <div className="[&_svg]:w-full [&_svg]:h-auto" dangerouslySetInnerHTML={{ __html: svg }} />
      </div>

      {data.caption && (
        <p className="px-5 pb-3 text-sm text-slate-600 dark:text-slate-400">{data.caption}</p>
      )}

      <footer className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
        {data.sourceAttribution && <p>Source: {data.sourceAttribution}</p>}
        {data.methodology && <p>Methodology: {data.methodology}</p>}
        {data.unit && <p>Unit: {data.unit}</p>}
      </footer>
    </section>
  );
};

/* ------------------------------------------------------------------------- *
 * Survey results
 * ------------------------------------------------------------------------- */

/**
 * Builds a chart payload out of a set of responses, so the same chart
 * renderer draws every survey.
 */
function surveyChartData(
  title: string,
  responses: Array<{ option: string; count: number }>
): ChartBlock['data'] {
  return {
    chartType: 'bar',
    title,
    xAxis: { key: 'option', label: 'Option' },
    yAxis: { label: 'Respondents' },
    legend: { show: false },
    series: [{ name: 'Respondents', key: 'count' }],
    values: responses.map((response) => ({ option: response.option, count: response.count })),
  };
}

export const SurveyResultsBlockView: React.FC<{
  data: SurveyResultsBlock['data'];
  theme?: 'dark' | 'light';
}> = ({ data, theme = 'light' }) => {
  const [segmentIndex, setSegmentIndex] = React.useState<number | null>(null);

  const segments = data.segments ?? [];
  const activeSegment = segmentIndex !== null ? segments[segmentIndex] : undefined;
  const responses = activeSegment ? activeSegment.responses : data.responses;
  const total =
    responses.reduce((sum, response) => sum + response.count, 0) || data.totalRespondents || 1;

  /*
   * The bar style borrows the ordinary chart renderer, so a survey drawn as
   * bars looks exactly like every other bar chart in the platform. The other
   * three styles are drawn by the survey renderer, which owns their look.
   */
  const style = data.style ?? 'bars';
  const svg = React.useMemo(() => {
    if (style === 'bars') {
      return D3ChartRenderer.renderToSvg(surveyChartData(data.question, responses), {
        theme,
        width: 800,
        height: 400,
      });
    }
    return SurveyResultsRenderer.renderToSvg(
      { ...data, responses, style },
      { theme, width: 800, height: 400 }
    );
  }, [data, responses, style, theme]);

  return (
    <section
      aria-label={data.title ?? data.question}
      className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden"
    >
      <header className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        {data.title && (
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
        )}
        {data.subtitle && (
          <p className="text-sm text-slate-600 dark:text-slate-400">{data.subtitle}</p>
        )}
        <p className="mt-2 text-base font-semibold text-slate-800 dark:text-slate-200">
          {data.question}
        </p>
      </header>

      <div className="p-3 sm:p-4">
        <div className="[&_svg]:w-full [&_svg]:h-auto" dangerouslySetInnerHTML={{ __html: svg }} />
      </div>

      {/* The numbers, in words, so the chart is never the only version. */}
      <ul className="px-5 pb-3 space-y-1.5">
        {responses.map((response) => (
          <li
            key={response.option}
            className="text-sm text-slate-700 dark:text-slate-300 flex gap-2"
          >
            <span className="font-semibold shrink-0">{response.option}:</span>
            <span>
              {response.count.toLocaleString()} ({Math.round((response.count / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>

      {segments.length > 0 && (
        <div className="px-5 pb-3">
          <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
            Breakdown
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSegmentIndex(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                segmentIndex === null
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                  : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              Everyone
            </button>
            {segments.map((segment, index) => (
              <button
                key={segment.label}
                type="button"
                onClick={() => setSegmentIndex(index)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  segmentIndex === index
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                    : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {segment.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {data.caption && (
        <p className="px-5 pb-3 text-sm text-slate-600 dark:text-slate-400">{data.caption}</p>
      )}

      <footer className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
        {data.totalRespondents !== undefined && (
          <p>Respondents: {data.totalRespondents.toLocaleString()}</p>
        )}
        {data.marginOfError !== undefined && <p>Margin of error: ±{data.marginOfError}%</p>}
        {data.fieldDates && <p>Field dates: {data.fieldDates}</p>}
        {data.sourceAttribution && <p>Source: {data.sourceAttribution}</p>}
        {data.methodology && <p>Methodology: {data.methodology}</p>}
      </footer>
    </section>
  );
};

/* ------------------------------------------------------------------------- *
 * Network graph
 * ------------------------------------------------------------------------- */

export const NetworkGraphBlockView: React.FC<{
  data: NetworkGraphBlock['data'];
  theme?: 'dark' | 'light';
}> = ({ data, theme = 'light' }) => {
  const width = 800;
  const height = 560;
  const interactive = data.interactive ?? true;

  const layout = React.useMemo(
    () => computeNetworkLayout(data, { width, height, layout: data.layout }),
    [data, data.layout]
  );

  const [dragged, setDragged] = React.useState<Record<string, { x: number; y: number }>>({});
  const [hiddenGroups, setHiddenGroups] = React.useState<string[]>([]);
  const svgRef = React.useRef<SVGSVGElement | null>(null);

  const groups = React.useMemo(() => networkGroups(layout.nodes), [layout.nodes]);
  const isHidden = (group: string | undefined) =>
    group !== undefined && hiddenGroups.includes(group);

  const visibleNodes = layout.nodes.filter((node) => !isHidden(node.group));
  const visibleIds = new Set(visibleNodes.map((node) => node.id));
  const visibleLinks = layout.links.filter(
    (link) => visibleIds.has(link.source) && visibleIds.has(link.target)
  );

  const positionOf = (node: { id: string; x: number; y: number }) => dragged[node.id] ?? node;

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<SVGGElement>, id: string) => {
      const svg = svgRef.current;
      if (!svg) return;
      const bounds = svg.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width) * width;
      const y = ((event.clientY - bounds.top) / bounds.height) * height;
      setDragged((current) => ({ ...current, [id]: { x, y } }));
    },
    []
  );

  const textColor = theme === 'light' ? '#0f172a' : '#f8fafc';
  const linkColor = theme === 'light' ? '#94a3b8' : '#475569';
  const style = data.style ?? 'filled';

  const maxDegree = Math.max(1, ...Object.values(layout.degrees));

  return (
    <section
      aria-label={data.title ?? 'Network graph'}
      className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden"
    >
      {(data.title || data.subtitle) && (
        <header className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          {data.title && (
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
          )}
          {data.subtitle && (
            <p className="text-sm text-slate-600 dark:text-slate-400">{data.subtitle}</p>
          )}
        </header>
      )}

      <div className="p-3 sm:p-4">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto touch-none select-none"
          role="img"
          aria-label={data.title ?? 'Network graph'}
        >
          {visibleLinks.map((link, index) => {
            const source = layout.nodes.find((node) => node.id === link.source);
            const target = layout.nodes.find((node) => node.id === link.target);
            if (!source || !target) return null;
            const from = positionOf(source);
            const to = positionOf(target);
            const weight = link.weight ?? 1;
            return (
              <line
                key={`${link.source}-${link.target}-${index}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={linkColor}
                strokeWidth={Math.min(6, 0.8 + weight)}
                strokeOpacity={0.55}
              />
            );
          })}

          {visibleNodes.map((node) => {
            const position = positionOf(node);
            const degree = layout.degrees[node.id] ?? 0;
            const radius = 7 + (degree / maxDegree) * 12 + (node.size ?? 0);
            const color = networkGroupColor(groups, node.group);
            const ring = theme === 'light' ? '#ffffff' : '#0f172a';

            /*
             * Three ways of drawing the same node.
             *
             * Filled is the plainest; outline is a hollow ring, which reads
             * better when the graph is dense; and bubble grows the node with
             * the number of connections and gives it a halo, so the hubs are
             * obvious without reading the labels.
             */
            if (style === 'outline') {
              return (
                <g
                  key={node.id}
                  transform={`translate(${position.x}, ${position.y})`}
                  style={{ cursor: interactive ? 'grab' : 'default' }}
                  onPointerDown={
                    interactive
                      ? (event) => {
                          event.currentTarget.setPointerCapture(event.pointerId);
                        }
                      : undefined
                  }
                  onPointerMove={
                    interactive ? (event) => handlePointerMove(event, node.id) : undefined
                  }
                >
                  <circle
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={2.5}
                    strokeOpacity={0.9}
                  >
                    <title>{node.label}</title>
                  </circle>
                  {(data.showLabels ?? true) && (
                    <text
                      x={radius + 6}
                      y={4}
                      fontSize={11}
                      fontWeight={600}
                      fill={textColor}
                      style={{ pointerEvents: 'none' }}
                    >
                      {node.label}
                    </text>
                  )}
                </g>
              );
            }

            if (style === 'bubble') {
              return (
                <g
                  key={node.id}
                  transform={`translate(${position.x}, ${position.y})`}
                  style={{ cursor: interactive ? 'grab' : 'default' }}
                  onPointerDown={
                    interactive
                      ? (event) => {
                          event.currentTarget.setPointerCapture(event.pointerId);
                        }
                      : undefined
                  }
                  onPointerMove={
                    interactive ? (event) => handlePointerMove(event, node.id) : undefined
                  }
                >
                  <circle r={radius * 1.9} fill={color} fillOpacity={0.16}>
                    <title>{`${node.label} — ${degree} connections`}</title>
                  </circle>
                  <circle
                    r={radius}
                    fill={color}
                    fillOpacity={0.85}
                    stroke={ring}
                    strokeWidth={1.5}
                  >
                    <title>{node.label}</title>
                  </circle>
                  {(data.showLabels ?? true) && (
                    <text
                      x={radius * 1.9 + 6}
                      y={4}
                      fontSize={11}
                      fontWeight={600}
                      fill={textColor}
                      style={{ pointerEvents: 'none' }}
                    >
                      {node.label}
                    </text>
                  )}
                </g>
              );
            }

            return (
              <g
                key={node.id}
                transform={`translate(${position.x}, ${position.y})`}
                style={{ cursor: interactive ? 'grab' : 'default' }}
                onPointerDown={
                  interactive
                    ? (event) => {
                        event.currentTarget.setPointerCapture(event.pointerId);
                      }
                    : undefined
                }
                onPointerMove={
                  interactive ? (event) => handlePointerMove(event, node.id) : undefined
                }
              >
                <circle r={radius} fill={color} fillOpacity={0.9} stroke={ring} strokeWidth={2}>
                  <title>{node.label}</title>
                </circle>
                {(data.showLabels ?? true) && (
                  <text
                    x={radius + 6}
                    y={4}
                    fontSize={11}
                    fontWeight={600}
                    fill={textColor}
                    style={{ pointerEvents: 'none' }}
                  >
                    {node.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {groups.length > 0 && (
        <div className="px-5 pb-3 flex flex-wrap gap-2">
          {groups.map((group) => {
            const hidden = hiddenGroups.includes(group);
            return (
              <button
                key={group}
                type="button"
                aria-pressed={!hidden}
                onClick={() =>
                  setHiddenGroups((current) =>
                    current.includes(group)
                      ? current.filter((entry) => entry !== group)
                      : [...current, group]
                  )
                }
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  hidden
                    ? 'border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                    : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: networkGroupColor(groups, group) }}
                />
                {group}
              </button>
            );
          })}
        </div>
      )}

      {data.caption && (
        <p className="px-5 pb-3 text-sm text-slate-600 dark:text-slate-400">{data.caption}</p>
      )}

      <footer className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
        <p>
          {visibleNodes.length} shown, {visibleLinks.length} connections
          {hiddenGroups.length > 0 ? ` · ${hiddenGroups.length} group(s) hidden` : ''}
        </p>
        {interactive && <p>Drag a node to rearrange the graph.</p>}
        {data.sourceAttribution && <p>Source: {data.sourceAttribution}</p>}
        {data.methodology && <p>Methodology: {data.methodology}</p>}
      </footer>
    </section>
  );
};
