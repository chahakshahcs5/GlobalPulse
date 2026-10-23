'use client';

import { NUMBER_LOCALE } from '@ai-news/media';
import React, { useMemo, useState } from 'react';
import type {
  DataExplorerBlock,
  RankingBlock,
  CalculatorBlock,
  FinancialBlock,
  ElectionBlock,
  DisasterBlock,
  ScienceBlock,
} from '@ai-news/schemas';
import { evaluateExpression } from '@ai-news/shared';

/**
 * Renderers for the data-journalism blocks.
 *
 * Every one of these keeps the numbers inspectable: the underlying values are
 * rendered as text/tables, not only as a chart, and the source, methodology,
 * and "last updated" metadata stay visible.
 */

const ProvenanceFooter: React.FC<{
  source?: string;
  methodology?: string;
  lastUpdated?: string;
}> = ({ source, methodology, lastUpdated }) => {
  if (!source && !methodology && !lastUpdated) return null;
  return (
    <footer className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
      {source && <p>Source: {source}</p>}
      {methodology && <p>Methodology: {methodology}</p>}
      {lastUpdated && <p>Last updated: {lastUpdated}</p>}
    </footer>
  );
};

export const DataExplorerBlockView: React.FC<{ data: DataExplorerBlock['data'] }> = ({ data }) => {
  const [metricKey, setMetricKey] = useState(data.defaultMetric);
  const [dimensionKey, setDimensionKey] = useState(data.defaultDimension);
  const [filterValues, setFilterValues] = useState<Record<string, string[]>>({});
  const [search, setSearch] = useState('');

  const dimension = data.dimensions.find((d) => d.key === dimensionKey) ?? data.dimensions[0];
  const metric = data.metrics.find((m) => m.key === metricKey) ?? data.metrics[0];

  const rows = useMemo(() => {
    const filtered = data.rows.filter((row) => {
      for (const [key, values] of Object.entries(filterValues)) {
        if (values.length === 0) continue;
        if (!values.includes(String(row[key] ?? ''))) return false;
      }
      if (search.trim()) {
        const haystack = JSON.stringify(row).toLowerCase();
        if (!haystack.includes(search.trim().toLowerCase())) return false;
      }
      return true;
    });
    return filtered;
  }, [data.rows, filterValues, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of rows) {
      const key = String(row[dimension.key] ?? 'Unknown');
      const value = Number(row[metric.key] ?? 0);
      map.set(key, (map.get(key) ?? 0) + (Number.isFinite(value) ? value : 0));
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [rows, dimension.key, metric.key]);

  const max = grouped.length ? grouped[0][1] : 0;

  const exportCsv = () => {
    const header = [dimension.key, metric.key].join(',');
    const body = grouped.map(([key, value]) => `${key},${value}`).join('\n');
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.title.replace(/\s+/g, '-').toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  /*
   * How the explorer is drawn.
   *
   * With the controls above the figures, with the figures as a table, or
   * with each group as a card. The data is the same; only the treatment
   * changes.
   */
  const layout = data.layout ?? 'controls';

  if (layout === 'cards') {
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

        <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {grouped.map(([key, value]) => (
            <div
              key={key}
              className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3"
            >
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate">
                {key}
              </div>
              <div className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
                {value.toLocaleString(NUMBER_LOCALE)}
                {metric.unit ? (
                  <span className="ml-1 text-xs font-normal text-slate-500">{metric.unit}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 pb-4">
          <ProvenanceFooter
            source={data.dataset.sourceAttribution}
            methodology={data.dataset.methodology}
            lastUpdated={data.dataset.lastUpdated}
          />
        </div>
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

      <div className="px-5 py-4 flex flex-wrap gap-3 items-end border-b border-slate-200 dark:border-slate-800">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          Metric
          <select
            value={metric.key}
            onChange={(e) => setMetricKey(e.target.value)}
            className="mt-1 block rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-800 dark:text-slate-200"
          >
            {data.metrics.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
                {m.unit ? ` (${m.unit})` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          Dimension
          <select
            value={dimension.key}
            onChange={(e) => setDimensionKey(e.target.value)}
            className="mt-1 block rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-800 dark:text-slate-200"
          >
            {data.dimensions.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label}
              </option>
            ))}
          </select>
        </label>

        {(data.filters ?? []).map((filter) => (
          <label
            key={filter.key}
            className="text-xs font-semibold text-slate-600 dark:text-slate-400"
          >
            {filter.label}
            <select
              value={filterValues[filter.key]?.[0] ?? ''}
              onChange={(e) =>
                setFilterValues((prev) => ({
                  ...prev,
                  [filter.key]: e.target.value ? [e.target.value] : [],
                }))
              }
              className="mt-1 block rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-800 dark:text-slate-200"
            >
              <option value="">All</option>
              {filter.values.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        ))}

        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          Search
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-1 block rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-800 dark:text-slate-200"
            placeholder="Filter rows"
          />
        </label>

        {data.downloadableFormats.includes('csv') && (
          <button
            type="button"
            onClick={exportCsv}
            className="ml-auto rounded-lg border border-indigo-300 dark:border-indigo-500/40 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
          >
            Download CSV
          </button>
        )}
      </div>

      <div className="px-5 py-4">
        <ul className="space-y-2" aria-label={`${metric.label} by ${dimension.label}`}>
          {grouped.map(([key, value]) => (
            <li key={key} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-xs text-slate-700 dark:text-slate-300 truncate">
                {key}
              </span>
              <span
                className="h-2.5 rounded-full bg-indigo-500/70"
                style={{ width: `${max ? (value / max) * 100 : 0}%` }}
              />
              <span className="ml-auto font-mono text-xs text-slate-700 dark:text-slate-300">
                {value.toLocaleString(NUMBER_LOCALE)}
                {metric.unit ? ` ${metric.unit}` : ''}
              </span>
            </li>
          ))}
        </ul>

        <details className="mt-4" open={layout === 'table'}>
          <summary className="cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-400">
            Inspect values ({rows.length} rows)
          </summary>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/60">
                  {Object.keys(rows[0] ?? {}).map((key) => (
                    <th key={key} className="px-2 py-1.5">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {rows.slice(0, 25).map((row, idx) => (
                  <tr key={idx}>
                    {Object.values(row).map((value, cellIdx) => (
                      <td key={cellIdx} className="px-2 py-1 font-mono">
                        {value === null ? '—' : String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>

      <div className="px-5 pb-4">
        <ProvenanceFooter
          source={data.dataset.sourceAttribution}
          methodology={data.dataset.methodology}
          lastUpdated={data.dataset.lastUpdated}
        />
        {data.dataset.license && (
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            License: {data.dataset.license}
          </p>
        )}
      </div>
    </section>
  );
};

export const RankingBlockView: React.FC<{ data: RankingBlock['data'] }> = ({ data }) => {
  /*
   * How the ranking is drawn.
   *
   * A ranking can be a list of positions, a list of bars scaled to the
   * value, or a podium with the leaders lifted above the rest. The
   * ranking is the same; only the treatment changes.
   */
  const layout = data.layout ?? 'numbered';

  const items = data.items ?? [];
  const values = items.map((item) => item.value ?? 0);
  const maxValue = Math.max(...values, 0);
  const minValue = Math.min(...values, 0);
  const span = maxValue - minValue || 1;

  const movement = (item: RankingBlock['data']['items'][number]) =>
    item.previousRank === undefined ? null : item.previousRank - item.rank;

  const movementBadge = (item: RankingBlock['data']['items'][number]) => {
    const change = movement(item);
    if (change === null) return null;
    return (
      <span
        className={`w-10 text-right text-[11px] font-mono font-bold ${
          change > 0
            ? 'text-emerald-600 dark:text-emerald-400'
            : change < 0
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-slate-400'
        }`}
        aria-label={
          change > 0
            ? `up ${change} places`
            : change < 0
              ? `down ${Math.abs(change)} places`
              : 'unchanged'
        }
      >
        {change > 0 ? `↑${change}` : change < 0 ? `↓${Math.abs(change)}` : '—'}
      </span>
    );
  };

  if (layout === 'bars') {
    return (
      <section aria-label={data.title} className="my-8">
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
        {data.subtitle && (
          <p className="text-sm text-slate-600 dark:text-slate-400">{data.subtitle}</p>
        )}
        <ol className="mt-4 space-y-2.5">
          {items.map((item) => {
            const value = item.value ?? 0;
            const width = Math.max(2, ((value - minValue) / span) * 100);
            return (
              <li key={`${item.rank}-${item.name}`} className="flex items-center gap-3">
                <span className="w-6 text-center font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                  {item.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {item.name}
                    </span>
                    {item.value !== undefined && (
                      <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                        {item.value.toLocaleString(NUMBER_LOCALE)}
                        {item.unit ? ` ${item.unit}` : ''}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
                {movementBadge(item)}
              </li>
            );
          })}
        </ol>
        <ProvenanceFooter
          source={data.sourceAttribution}
          methodology={data.methodology}
          lastUpdated={data.lastUpdated}
        />
      </section>
    );
  }

  if (layout === 'podium') {
    const leaders = items.slice(0, 3);
    const rest = items.slice(3);
    const step = (rank: number) => (rank === 1 ? 'order-2' : rank === 2 ? 'order-1' : 'order-3');
    const height = (rank: number) => (rank === 1 ? 'h-28' : rank === 2 ? 'h-20' : 'h-14');

    return (
      <section aria-label={data.title} className="my-8">
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
        {data.subtitle && (
          <p className="text-sm text-slate-600 dark:text-slate-400">{data.subtitle}</p>
        )}

        <ol className="mt-5 flex items-end justify-center gap-3">
          {leaders.map((item) => (
            <li
              key={`${item.rank}-${item.name}`}
              className={`flex-1 max-w-[12rem] ${step(item.rank)} flex flex-col items-center`}
            >
              <span className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {item.name}
              </span>
              {item.value !== undefined && (
                <span className="font-mono text-lg font-bold text-slate-900 dark:text-slate-100">
                  {item.value.toLocaleString(NUMBER_LOCALE)}
                  {item.unit ? ` ${item.unit}` : ''}
                </span>
              )}
              <div
                className={`mt-2 w-full rounded-t-lg bg-gradient-to-b from-blue-500 to-blue-600 ${height(
                  item.rank
                )} flex items-start justify-center pt-2 text-white`}
              >
                <span className="font-mono text-xl font-black">{item.rank}</span>
              </div>
            </li>
          ))}
        </ol>

        {rest.length > 0 && (
          <ol className="mt-5 space-y-2 border-t border-slate-200 dark:border-slate-800 pt-4">
            {rest.map((item) => (
              <li key={`${item.rank}-${item.name}`} className="flex items-center gap-3">
                <span className="w-7 text-center font-mono font-bold text-slate-500 dark:text-slate-400">
                  {item.rank}
                </span>
                <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {item.name}
                </span>
                {item.value !== undefined && (
                  <span className="font-mono text-sm text-slate-700 dark:text-slate-300">
                    {item.value.toLocaleString(NUMBER_LOCALE)}
                    {item.unit ? ` ${item.unit}` : ''}
                  </span>
                )}
                {movementBadge(item)}
              </li>
            ))}
          </ol>
        )}

        <ProvenanceFooter
          source={data.sourceAttribution}
          methodology={data.methodology}
          lastUpdated={data.lastUpdated}
        />
      </section>
    );
  }

  return (
    <section aria-label={data.title} className="my-8">
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
      {data.subtitle && (
        <p className="text-sm text-slate-600 dark:text-slate-400">{data.subtitle}</p>
      )}
      <ol className="mt-4 space-y-2">
        {data.items.map((item) => {
          const change = movement(item);
          return (
            <li
              key={`${item.rank}-${item.name}`}
              className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 px-3 py-2"
            >
              <span className="w-7 text-center font-mono font-bold text-slate-500 dark:text-slate-400">
                {item.rank}
              </span>
              <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                {item.name}
              </span>
              {item.value !== undefined && (
                <span className="font-mono text-sm text-slate-700 dark:text-slate-300">
                  {item.value.toLocaleString(NUMBER_LOCALE)}
                  {item.unit ? ` ${item.unit}` : ''}
                </span>
              )}
              {change !== null && (
                <span
                  className={`w-10 text-right text-[11px] font-mono font-bold ${
                    change > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : change < 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-400'
                  }`}
                  aria-label={
                    change > 0
                      ? `up ${change} places`
                      : change < 0
                        ? `down ${Math.abs(change)} places`
                        : 'unchanged'
                  }
                >
                  {change > 0 ? `↑${change}` : change < 0 ? `↓${Math.abs(change)}` : '—'}
                </span>
              )}
              {item.note && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.note}</span>
              )}
              {item.storyId && (
                <a
                  href={`/stories/${item.storyId}`}
                  className="shrink-0 text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 hover:underline"
                >
                  Read ↗
                </a>
              )}
            </li>
          );
        })}
      </ol>
      <ProvenanceFooter
        source={data.sourceAttribution}
        methodology={data.methodology}
        lastUpdated={data.lastUpdated}
      />
    </section>
  );
};

/**
 * Evaluates a stored expression against the current input values.
 *
 * Formulas are structured data authored by editors, so they are evaluated in a
 * restricted arithmetic sandbox: only numbers, the four operations, parentheses,
 * and the known input identifiers are accepted.
 */
export const CalculatorBlockView: React.FC<{ data: CalculatorBlock['data'] }> = ({ data }) => {
  /*
   * How the calculator is drawn.
   *
   * As a panel, inline in the text, or as a numbered set of steps. The
   * arithmetic is the same; only the treatment changes.
   */
  const layout = data.layout ?? 'panel';

  const [values, setValues] = useState<Record<string, number | string>>(() =>
    Object.fromEntries(
      data.inputs.map((input) => [input.id, input.defaultValue as number | string])
    )
  );

  const numericValues = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [key, value] of Object.entries(values)) {
      const parsed = typeof value === 'number' ? value : Number(value);
      if (Number.isFinite(parsed)) out[key] = parsed;
    }
    return out;
  }, [values]);

  /*
   * The input a reader fills in.
   *
   * Drawn the same way wherever it appears, so the panel and the steps
   * differ in their arrangement rather than in how the number is entered.
   */
  const inputField = (input: CalculatorBlock['data']['inputs'][number]) => (
    <label key={input.id} className="text-xs font-semibold text-slate-600 dark:text-slate-400">
      {input.label}
      {input.unit ? ` (${input.unit})` : ''}
      {input.type === 'select' ? (
        <select
          value={String(values[input.id] ?? '')}
          onChange={(e) => setValues((prev) => ({ ...prev, [input.id]: e.target.value }))}
          className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm text-slate-800 dark:text-slate-200"
        >
          {(input.options ?? []).map((option) => (
            <option key={String(option.value)} value={String(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="number"
          value={String(values[input.id] ?? '')}
          min={input.min}
          max={input.max}
          step={input.step}
          onChange={(e) => setValues((prev) => ({ ...prev, [input.id]: e.target.value }))}
          className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm text-slate-800 dark:text-slate-200"
        />
      )}
    </label>
  );

  /*
   * One computed output, with its value.
   */
  const outputRow = (output: CalculatorBlock['data']['outputs'][number]) => {
    const computed = evaluateExpression(output.expression, numericValues);
    const display =
      computed === null
        ? '—'
        : computed.toLocaleString(NUMBER_LOCALE, {
            maximumFractionDigits: output.precision ?? 2,
          });
    return (
      <div
        key={output.id}
        className="flex items-baseline justify-between gap-3 rounded-lg bg-slate-50 dark:bg-slate-900/70 px-3 py-2"
      >
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {output.label}
          {output.description && (
            <span className="block text-[11px] font-normal text-slate-500 dark:text-slate-400">
              {output.description}
            </span>
          )}
        </span>
        <span className="font-mono text-lg font-bold text-slate-900 dark:text-slate-100">
          {display}
          {output.unit ? ` ${output.unit}` : ''}
        </span>
      </div>
    );
  };

  /*
   * The calculator as a set of numbered steps.
   *
   * The reader sets the inputs and reads the outputs, so the steps are
   * the inputs in order and then the outputs that follow from them.
   */
  if (layout === 'steps') {
    return (
      <section
        aria-label={data.title}
        className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm p-5"
      >
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
        {data.description && (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{data.description}</p>
        )}

        <ol className="mt-4 space-y-3">
          {data.inputs.map((input, index) => (
            <li key={input.id} className="flex items-start gap-3">
              <span className="mt-1 w-6 h-6 shrink-0 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">{inputField(input)}</div>
            </li>
          ))}
          {data.outputs.map((output, index) => (
            <li key={output.id} className="flex items-start gap-3">
              <span className="mt-1 w-6 h-6 shrink-0 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                {data.inputs.length + index + 1}
              </span>
              <div className="flex-1 min-w-0">{outputRow(output)}</div>
            </li>
          ))}
        </ol>

        {data.explanation && (
          <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">{data.explanation}</p>
        )}
        {data.assumptions.length > 0 && (
          <ul className="mt-2 list-disc list-inside text-xs text-slate-500 dark:text-slate-400">
            {data.assumptions.map((assumption) => (
              <li key={assumption}>{assumption}</li>
            ))}
          </ul>
        )}
        <ProvenanceFooter source={data.sourceAttribution} methodology={data.methodology} />
      </section>
    );
  }

  /*
   * The calculator inline in the text.
   *
   * A panel is a thing of its own; inline is a line inside a paragraph.
   * So the inputs sit beside their labels rather than under them, and the
   * answers are a run of figures rather than a stack of cards.
   */
  if (layout === 'inline') {
    return (
      <section
        aria-label={data.title}
        className="my-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 px-4 py-3 shadow-sm"
      >
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
        {data.description && (
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{data.description}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
          {data.inputs.map((input) => (
            <label
              key={input.id}
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
            >
              {input.label}
              {input.unit ? ` (${input.unit})` : ''}
              {input.type === 'select' ? (
                <select
                  value={String(values[input.id] ?? '')}
                  onChange={(e) => setValues((prev) => ({ ...prev, [input.id]: e.target.value }))}
                  className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 py-0.5 text-xs text-slate-800 dark:text-slate-200"
                >
                  {(input.options ?? []).map((option) => (
                    <option key={String(option.value)} value={String(option.value)}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  value={String(values[input.id] ?? '')}
                  min={input.min}
                  max={input.max}
                  step={input.step}
                  onChange={(e) => setValues((prev) => ({ ...prev, [input.id]: e.target.value }))}
                  className="w-24 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-0.5 text-xs text-slate-800 dark:text-slate-200"
                />
              )}
            </label>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          {data.outputs.map((output) => {
            const computed = evaluateExpression(output.expression, numericValues);
            const display =
              computed === null
                ? '—'
                : computed.toLocaleString(NUMBER_LOCALE, {
                    maximumFractionDigits: output.precision ?? 2,
                  });
            return (
              <span key={output.id} className="text-xs">
                <span className="text-slate-500 dark:text-slate-400">{output.label}: </span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {display}
                  {output.unit ? ` ${output.unit}` : ''}
                </span>
              </span>
            );
          })}
        </div>

        {data.explanation && (
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{data.explanation}</p>
        )}
        <ProvenanceFooter source={data.sourceAttribution} methodology={data.methodology} />
      </section>
    );
  }

  return (
    <section
      aria-label={data.title}
      className={[
        'my-8 rounded-2xl',
        'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm',
        'p-5',
      ].join(' ')}
    >
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
      {data.description && (
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{data.description}</p>
      )}

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.inputs.map((input) => inputField(input))}
      </div>

      <div className="mt-4 space-y-2">{data.outputs.map((output) => outputRow(output))}</div>

      {data.explanation && (
        <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">{data.explanation}</p>
      )}
      {data.assumptions.length > 0 && (
        <ul className="mt-2 list-disc list-inside text-xs text-slate-500 dark:text-slate-400">
          {data.assumptions.map((assumption) => (
            <li key={assumption}>{assumption}</li>
          ))}
        </ul>
      )}
      <ProvenanceFooter source={data.sourceAttribution} methodology={data.methodology} />
    </section>
  );
};

export const FinancialBlockView: React.FC<{ data: FinancialBlock['data'] }> = ({ data }) => {
  const maxSeries = data.series?.length
    ? Math.max(...data.series.map((point) => Math.abs(point.value)))
    : 0;

  /*
   * How the figures are drawn.
   *
   * As cards, as a table, or as one line of text. The figures are the
   * same; only the treatment changes.
   */
  const layout = data.layout ?? 'cards';

  if (layout === 'inline') {
    return (
      <p className="my-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
        <span className="font-bold text-slate-900 dark:text-slate-100">{data.title}</span>
        {data.metrics.map((metric) => (
          <span key={metric.label} className="text-slate-700 dark:text-slate-300">
            <span className="text-slate-500 dark:text-slate-400">{metric.label}</span>{' '}
            <span className="font-mono font-bold">
              {metric.value.toLocaleString(NUMBER_LOCALE)} {metric.unit ?? data.currency}
            </span>
          </span>
        ))}
      </p>
    );
  }

  if (layout === 'table') {
    return (
      <section
        aria-label={data.title}
        className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden"
      >
        <header className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {data.currency} · as of {data.asOf}
          </p>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800/60 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Metric</th>
                <th className="px-4 py-2.5 font-semibold">Value</th>
                <th className="px-4 py-2.5 font-semibold">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {data.metrics.map((metric) => (
                <tr key={metric.label}>
                  <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{metric.label}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-900 dark:text-slate-100">
                    {metric.value.toLocaleString(NUMBER_LOCALE)} {metric.unit ?? data.currency}
                  </td>
                  <td
                    className={`px-4 py-2.5 font-mono text-xs font-bold ${
                      (metric.change ?? 0) > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : (metric.change ?? 0) < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-500'
                    }`}
                  >
                    {metric.change !== undefined
                      ? `${metric.change > 0 ? '↑' : metric.change < 0 ? '↓' : '→'} ${Math.abs(metric.change)}${
                          metric.changePeriod ? ` ${metric.changePeriod}` : ''
                        }`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
        <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
          {data.currency} · as of {data.asOf}
          {data.entityId && <span className="ml-2 font-sans">Entity: {data.entityId}</span>}
        </p>
      </header>

      <div className="px-5 py-4">
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {data.metrics.map((metric) => (
            <li
              key={metric.label}
              className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2"
            >
              <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {metric.label}
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {metric.value.toLocaleString(NUMBER_LOCALE)}{' '}
                <span className="text-xs font-normal text-slate-500">
                  {metric.unit ?? data.currency}
                </span>
              </div>
              {metric.sourceId && (
                <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                  {metric.sourceId}
                </div>
              )}
              {metric.change !== undefined && (
                <div
                  className={`text-[11px] font-mono font-bold ${
                    metric.change > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : metric.change < 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-500'
                  }`}
                >
                  {metric.change > 0 ? '↑' : metric.change < 0 ? '↓' : '→'}{' '}
                  {Math.abs(metric.change)}
                  {metric.changePeriod ? ` ${metric.changePeriod}` : ''}
                </div>
              )}
            </li>
          ))}
        </ul>

        {data.series && data.series.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
              Performance
            </h4>
            <ul className="space-y-1.5">
              {data.series.map((point) => (
                <li
                  key={`${point.metric ?? ''}-${point.period}`}
                  className="flex items-center gap-3"
                >
                  <span className="w-20 shrink-0 text-xs text-slate-500 dark:text-slate-400">
                    {point.period}
                  </span>
                  <span
                    className="h-2 rounded-full bg-indigo-500/70"
                    style={{
                      width: `${maxSeries ? (Math.abs(point.value) / maxSeries) * 100 : 0}%`,
                    }}
                  />
                  <span className="ml-auto font-mono text-xs text-slate-700 dark:text-slate-300">
                    {point.value.toLocaleString(NUMBER_LOCALE)}
                    {point.metric ? ` ${point.metric}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="px-5 pb-4">
        <ProvenanceFooter source={data.sourceAttribution} methodology={data.methodology} />
      </div>
    </section>
  );
};

export const ElectionBlockView: React.FC<{ data: ElectionBlock['data'] }> = ({ data }) => {
  /*
   * How the result is drawn.
   *
   * As a table, as bars scaled to the vote, or as the seats won. The
   * result is the same; only the treatment changes.
   */
  const layout = data.layout ?? 'table';
  const maxVotes = Math.max(...data.results.map((result) => result.votes ?? 0), 1);

  if (layout === 'bars') {
    return (
      <section aria-label={data.title} className="my-8">
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {data.electionType} · {data.region} · {data.electionDate}
          {data.turnout !== undefined ? ` · turnout ${data.turnout}%` : ''}
        </p>
        <ul className="mt-4 space-y-2.5">
          {data.results.map((result) => (
            <li key={result.party} className="flex items-center gap-3">
              <span className="w-40 shrink-0 text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                {result.party}
              </span>
              <span
                className="h-3 rounded-full bg-indigo-500/70"
                style={{ width: `${((result.votes ?? 0) / maxVotes) * 100}%` }}
              />
              <span className="ml-auto font-mono text-xs text-slate-700 dark:text-slate-300">
                {result.voteShare !== undefined ? `${result.voteShare}%` : ''}
              </span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (layout === 'seats') {
    const totalSeats =
      data.totalSeats ?? data.results.reduce((sum, result) => sum + (result.seats ?? 0), 0);
    return (
      <section aria-label={data.title} className="my-8">
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {data.electionType} · {data.region} · {data.electionDate}
          {data.turnout !== undefined ? ` · turnout ${data.turnout}%` : ''}
        </p>
        <div className="mt-4 flex h-24 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
          {data.results.map((result, idx) => {
            const seats = result.seats ?? 0;
            const share = totalSeats > 0 ? (seats / totalSeats) * 100 : 0;
            const palette = [
              'bg-indigo-500',
              'bg-purple-500',
              'bg-teal-500',
              'bg-amber-500',
              'bg-rose-400',
            ];
            return (
              <div
                key={result.party}
                className={`${palette[idx % palette.length]} flex flex-col items-center justify-center text-white overflow-hidden`}
                style={{ width: `${share}%` }}
                title={`${result.party}: ${seats} seats`}
              >
                {share > 6 && (
                  <>
                    <span className="font-mono text-sm font-bold">{seats}</span>
                    <span className="text-[9px] uppercase leading-tight px-1 text-center">
                      {result.party}
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>
        <ul className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
          {data.results.map((result, idx) => (
            <li key={result.party} className="flex items-center gap-1.5">
              <span
                className={`h-2.5 w-2.5 rounded-sm ${
                  ['bg-indigo-500', 'bg-purple-500', 'bg-teal-500', 'bg-amber-500', 'bg-rose-400'][
                    idx % 5
                  ]
                }`}
              />
              {result.party}
              <span className="font-mono">{result.seats ?? 0}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section aria-label={data.title} className="my-8">
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {data.electionType} · {data.region} · {data.electionDate}
        {data.turnout !== undefined ? ` · turnout ${data.turnout}%` : ''}
        {data.totalSeats ? ` · ${data.totalSeats} seats` : ''}
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/60 text-xs uppercase tracking-wide">
              <th className="px-3 py-2">Party</th>
              <th className="px-3 py-2">Candidate</th>
              <th className="px-3 py-2">Votes</th>
              <th className="px-3 py-2">Share</th>
              <th className="px-3 py-2">Seats</th>
              <th className="px-3 py-2">Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {data.results.map((result) => (
              <tr key={result.party}>
                <td className="px-3 py-2 font-semibold">{result.party}</td>
                <td className="px-3 py-2">{result.candidate ?? '—'}</td>
                <td className="px-3 py-2 font-mono">
                  {result.votes !== undefined ? result.votes.toLocaleString(NUMBER_LOCALE) : '—'}
                </td>
                <td className="px-3 py-2 font-mono">
                  {result.voteShare !== undefined ? `${result.voteShare}%` : '—'}
                </td>
                <td className="px-3 py-2 font-mono">{result.seats ?? '—'}</td>
                <td
                  className={`px-3 py-2 font-mono ${
                    (result.seatChange ?? 0) > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : (result.seatChange ?? 0) < 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-400'
                  }`}
                >
                  {result.seatChange === undefined
                    ? '—'
                    : result.seatChange > 0
                      ? `+${result.seatChange}`
                      : result.seatChange}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.historical && data.historical.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-400">
            Historical comparison
          </summary>
          <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
            {data.historical.map((entry) => (
              <li key={entry.year}>
                {entry.year}
                {entry.winner ? ` — winner: ${entry.winner}` : ''}
                {entry.turnout !== undefined ? ` — turnout ${entry.turnout}%` : ''}
              </li>
            ))}
          </ul>
        </details>
      )}

      <ProvenanceFooter
        source={data.sourceAttribution}
        methodology={data.methodology}
        lastUpdated={data.lastUpdated}
      />
    </section>
  );
};

export const DisasterBlockView: React.FC<{ data: DisasterBlock['data'] }> = ({ data }) => {
  const statusStyles: Record<string, string> = {
    ACTIVE:
      'bg-rose-100 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 border-rose-300 dark:border-rose-500/20',
    MONITORING:
      'bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-500/20',
    RESOLVED:
      'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/20',
  };

  /*
   * How the incident is drawn.
   *
   * A banner across the story, a panel with everything in it, or a single
   * line for a mention in the text. The incident is the same; only the
   * treatment changes.
   */
  const layout = data.layout ?? 'panel';

  if (layout === 'banner') {
    return (
      <div className="my-4 rounded-xl border border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/5 px-4 py-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-bold text-rose-900 dark:text-rose-200">{data.title}</span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusStyles[data.status] ?? statusStyles.ACTIVE}`}
          >
            {data.status}
          </span>
          {data.severity && (
            <span className="text-[10px] font-bold uppercase tracking-wide text-rose-700 dark:text-rose-400">
              {data.severity}
            </span>
          )}
          {data.location && (
            <span className="text-xs text-rose-700 dark:text-rose-300/80">{data.location}</span>
          )}
        </div>
        {data.updates[0]?.description && (
          <p className="mt-1.5 text-sm text-rose-900/90 dark:text-rose-200/90">
            {data.updates[0].description}
          </p>
        )}
      </div>
    );
  }

  if (layout === 'inline') {
    return (
      <p className="my-3 flex flex-wrap items-baseline gap-2 text-xs">
        <span className="font-bold text-slate-900 dark:text-slate-100">{data.title}</span>
        <span
          className={`px-1.5 py-0.5 rounded font-bold uppercase border ${statusStyles[data.status] ?? statusStyles.ACTIVE}`}
        >
          {data.status}
        </span>
        {data.location && (
          <span className="text-slate-500 dark:text-slate-400">{data.location}</span>
        )}
      </p>
    );
  }

  return (
    <section
      aria-label={data.title}
      className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden"
    >
      <header className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start gap-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {data.disasterType} · {data.location ?? 'Location not stated'} · {data.occurredAt}
          </p>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-bold border ${statusStyles[data.status] ?? statusStyles.ACTIVE}`}
        >
          {data.status}
        </span>
        {data.severity && (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold border border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            {data.severity}
          </span>
        )}
      </header>

      {data.coordinates && (
        <p className="px-5 py-2 border-b border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-500 dark:text-slate-400">
          Coordinates: {data.coordinates[0].toFixed(3)}°E, {data.coordinates[1].toFixed(3)}°N
        </p>
      )}

      <div className="px-5 py-4">
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {data.metrics.map((metric) => (
            <li
              key={metric.label}
              className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2"
            >
              <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {metric.label}
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {metric.value} <span className="text-xs font-normal">{metric.unit}</span>
              </div>
              {metric.timestamp && (
                <div className="text-[10px] font-mono text-slate-400">{metric.timestamp}</div>
              )}
              {metric.sourceId && (
                <div className="text-[10px] font-mono text-slate-400">{metric.sourceId}</div>
              )}
            </li>
          ))}
        </ul>

        {data.affectedAreas.length > 0 && (
          <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
            Affected areas: {data.affectedAreas.join(', ')}
          </p>
        )}

        {data.updates.length > 0 && (
          <ol className="mt-4 space-y-2 border-l-2 border-slate-200 dark:border-slate-700 pl-4">
            {data.updates.map((update, idx) => (
              <li key={idx}>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {update.timestamp}
                </div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {update.title}
                </div>
                {update.description && (
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {update.description}
                  </div>
                )}
                {update.sourceId && (
                  <div className="text-[10px] font-mono text-slate-400">{update.sourceId}</div>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="px-5 pb-4">
        <ProvenanceFooter source={data.sourceAttribution} methodology={data.methodology} />
      </div>
    </section>
  );
};

export const ScienceBlockView: React.FC<{ data: ScienceBlock['data'] }> = ({ data }) => {
  /*
   * How the finding is drawn.
   *
   * As a paper, with the measurements set out beneath it; as cards; or as
   * plain running text. The finding is the same; only the treatment
   * changes.
   */
  const layout = data.layout ?? 'paper';

  if (layout === 'plain') {
    return (
      <section aria-label={data.title} className="my-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
        {data.field && <p className="text-sm text-slate-600 dark:text-slate-400">{data.field}</p>}
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {data.findings.join(' ')}
        </p>
      </section>
    );
  }

  if (layout === 'cards') {
    return (
      <section aria-label={data.title} className="my-8">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
        {data.field && <p className="text-sm text-slate-600 dark:text-slate-400">{data.field}</p>}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.findings.map((finding, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 shadow-sm"
            >
              <p className="text-sm text-slate-700 dark:text-slate-300">{finding}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label={data.title}
      className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm p-5"
    >
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
      {data.field && <p className="text-sm text-slate-600 dark:text-slate-400">{data.field}</p>}

      <ul className="mt-3 list-disc list-inside text-sm text-slate-700 dark:text-slate-300 space-y-1">
        {data.findings.map((finding, idx) => (
          <li key={idx}>{finding}</li>
        ))}
      </ul>

      {data.measurements.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {data.measurements.map((measurement) => (
            <li
              key={measurement.label}
              className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2"
            >
              <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {measurement.label}
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {measurement.value} <span className="text-xs font-normal">{measurement.unit}</span>
              </div>
              {measurement.uncertainty !== undefined && (
                <div className="text-[10px] font-mono text-slate-400">
                  ±{measurement.uncertainty} {measurement.unit}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {data.equation && (
        <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-100 dark:bg-slate-900 px-3 py-2 text-sm font-mono text-slate-800 dark:text-slate-200">
          {data.equation}
        </pre>
      )}

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
        {data.authors.length > 0 && <span>Authors: {data.authors.join(', ')}</span>}
        {data.institutions.length > 0 && <span>Institutions: {data.institutions.join(', ')}</span>}
        {data.publishedAt && <span>Published: {data.publishedAt}</span>}
        {data.paperUrl && (
          <a
            href={data.paperUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-700 dark:text-indigo-400 hover:underline"
          >
            Read the paper
          </a>
        )}
        {data.diagramUrl && (
          <a
            href={data.diagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-700 dark:text-indigo-400 hover:underline"
          >
            View diagram
          </a>
        )}
      </div>

      <ProvenanceFooter source={data.sourceAttribution} methodology={data.methodology} />
    </section>
  );
};
