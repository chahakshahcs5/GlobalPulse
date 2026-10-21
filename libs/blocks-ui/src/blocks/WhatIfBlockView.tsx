'use client';

import React from 'react';
import type { WhatIfBlock } from '@ai-news/schemas';
import { WhatIfModel } from '@ai-news/media';

const BREAKDOWN_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

/**
 * Interactive scenario explorer.
 *
 * The reader moves sliders and the outcome recomputes from the block's own
 * expressions. The baseline is always shown, so the reader can see how far
 * they have pushed the model away from the published case.
 */
export const WhatIfBlockView: React.FC<{ data: WhatIfBlock['data'] }> = ({ data }) => {
  const [values, setValues] = React.useState<Record<string, number>>(() =>
    WhatIfModel.defaultValues(data)
  );

  const scenario = React.useMemo(() => WhatIfModel.evaluate(data, values), [data, values]);

  const format = (value: number | null) =>
    value === null ? '—' : value.toLocaleString(undefined, { maximumFractionDigits: 2 });

  const setInput = (input: WhatIfBlock['data']['inputs'][number], raw: number) => {
    setValues((prev) => ({
      ...prev,
      [input.id]: WhatIfModel.clamp(input, raw),
    }));
  };

  const componentTotal = scenario.components.reduce((sum, c) => sum + c.value, 0);
  const hasBreakdown = scenario.components.length > 0 && componentTotal !== 0;

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
      </header>

      <div className="px-5 py-4 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Sliders */}
        <div className="lg:col-span-3 space-y-4">
          {data.inputs.map((input) => {
            const current = values[input.id] ?? input.defaultValue;
            return (
              <div key={input.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <label
                    htmlFor={`what_if_${input.id}`}
                    className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    {input.label}
                    {input.note && (
                      <span className="block text-[11px] font-normal text-slate-500 dark:text-slate-400">
                        {input.note}
                      </span>
                    )}
                  </label>
                  <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                    {format(current)}
                    {input.unit ? ` ${input.unit}` : ''}
                  </span>
                </div>
                <input
                  id={`what_if_${input.id}`}
                  type="range"
                  min={input.min}
                  max={input.max}
                  step={input.step ?? 1}
                  value={current}
                  onChange={(e) => setInput(input, Number(e.target.value))}
                  className="mt-2 w-full accent-indigo-600 dark:accent-indigo-400"
                  aria-describedby={`what_if_range_${input.id}`}
                />
                <div
                  id={`what_if_range_${input.id}`}
                  className="flex justify-between font-mono text-[10px] text-slate-400 dark:text-slate-500"
                >
                  <span>
                    {format(input.min)}
                    {input.unit ? ` ${input.unit}` : ''}
                  </span>
                  <span>
                    {format(input.max)}
                    {input.unit ? ` ${input.unit}` : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Outcome */}
        <div className="lg:col-span-2">
          <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/25 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              {data.outcomeLabel}
            </div>
            <div className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-white">
              {format(scenario.outcome)}
              {data.outcomeUnit && (
                <span className="text-base font-bold text-slate-600 dark:text-slate-300 ml-1">
                  {data.outcomeUnit}
                </span>
              )}
            </div>
            {scenario.delta !== null && scenario.delta !== 0 && (
              <div
                className={`mt-1 text-xs font-bold ${
                  scenario.delta > 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {scenario.delta > 0 ? '▲' : '▼'} {format(Math.abs(scenario.delta))} vs the base case
              </div>
            )}
            {scenario.baseline !== null && (
              <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Base case: {format(scenario.baseline)}
                {data.outcomeUnit ? ` ${data.outcomeUnit}` : ''}
              </div>
            )}
            {!scenario.isValid && (
              <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">
                This scenario could not be evaluated from the current values.
              </p>
            )}
          </div>

          {hasBreakdown && (
            <div className="mt-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Breakdown
              </div>
              <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                {scenario.components.map((component, idx) => {
                  const share = Math.abs(component.value) / Math.abs(componentTotal);
                  return (
                    <div
                      key={component.label}
                      style={{
                        width: `${Math.max(0, share * 100)}%`,
                        backgroundColor:
                          component.color ?? BREAKDOWN_COLORS[idx % BREAKDOWN_COLORS.length],
                      }}
                      title={`${component.label}: ${format(component.value)}`}
                    />
                  );
                })}
              </div>
              <ul className="mt-2 space-y-1">
                {scenario.components.map((component, idx) => (
                  <li
                    key={component.label}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-sm"
                        style={{
                          backgroundColor:
                            component.color ?? BREAKDOWN_COLORS[idx % BREAKDOWN_COLORS.length],
                        }}
                      />
                      {component.label}
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {format(component.value)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <footer className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
        {data.methodology && <p>Methodology: {data.methodology}</p>}
        {data.sourceAttribution && <p>Source: {data.sourceAttribution}</p>}
      </footer>
    </section>
  );
};
