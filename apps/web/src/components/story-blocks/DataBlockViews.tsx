'use client';

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
                {value.toLocaleString()}
                {metric.unit ? ` ${metric.unit}` : ''}
              </span>
            </li>
          ))}
        </ul>

        <details className="mt-4">
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
  return (
    <section aria-label={data.title} className="my-8">
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
      {data.subtitle && (
        <p className="text-sm text-slate-600 dark:text-slate-400">{data.subtitle}</p>
      )}
      <ol className="mt-4 space-y-2">
        {data.items.map((item) => {
          const movement = item.previousRank === undefined ? null : item.previousRank - item.rank;
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
                  {item.value.toLocaleString()}
                  {item.unit ? ` ${item.unit}` : ''}
                </span>
              )}
              {movement !== null && (
                <span
                  className={`w-10 text-right text-[11px] font-mono font-bold ${
                    movement > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : movement < 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-400'
                  }`}
                  aria-label={
                    movement > 0
                      ? `up ${movement} places`
                      : movement < 0
                        ? `down ${Math.abs(movement)} places`
                        : 'unchanged'
                  }
                >
                  {movement > 0 ? `↑${movement}` : movement < 0 ? `↓${Math.abs(movement)}` : '—'}
                </span>
              )}
              {item.note && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.note}</span>
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
function evaluateExpression(expression: string, values: Record<string, number>): number | null {
  const substituted = expression.replace(/[A-Za-z_][A-Za-z0-9_]*/g, (identifier) => {
    const value = values[identifier];
    return value === undefined ? 'NaN' : String(value);
  });

  if (!/^[0-9+\-*/(). NaN]*$/.test(substituted)) return null;

  try {
    const result = Function(`"use strict"; return (${substituted});`)() as unknown;
    if (typeof result !== 'number' || !Number.isFinite(result)) return null;
    return result;
  } catch {
    return null;
  }
}

export const CalculatorBlockView: React.FC<{ data: CalculatorBlock['data'] }> = ({ data }) => {
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

  return (
    <section
      aria-label={data.title}
      className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm p-5"
    >
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
      {data.description && (
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{data.description}</p>
      )}

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.inputs.map((input) => (
          <label
            key={input.id}
            className="text-xs font-semibold text-slate-600 dark:text-slate-400"
          >
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
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {data.outputs.map((output) => {
          const computed = evaluateExpression(output.expression, numericValues);
          const display =
            computed === null
              ? '—'
              : computed.toLocaleString(undefined, {
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
        })}
      </div>

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
                {metric.value.toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-500">
                  {metric.unit ?? data.currency}
                </span>
              </div>
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
                    {point.value.toLocaleString()}
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
                  {result.votes !== undefined ? result.votes.toLocaleString() : '—'}
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
                {metric.value} <span className="text-xs font-normal">{metric.unit}</span>
              </div>
              {metric.timestamp && (
                <div className="text-[10px] font-mono text-slate-400">{metric.timestamp}</div>
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
