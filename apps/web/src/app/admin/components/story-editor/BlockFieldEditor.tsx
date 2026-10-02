'use client';

import type { MediaBlockDraft } from './types';

interface BlockFieldEditorProps {
  block: MediaBlockDraft;
  updateMediaBlockData: (
    id: string,
    field: string,
    value: string | number | readonly string[] | undefined
  ) => void;
}

export function BlockFieldEditor({ block, updateMediaBlockData }: BlockFieldEditorProps) {
  return (
    <>
      {block.type === 'image' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 mb-1">Image URL</label>
            <input
              type="url"
              value={block.data.url}
              onChange={(e) => updateMediaBlockData(block.id, 'url', e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-slate-500 mb-1">Photo Credit</label>
            <input
              type="text"
              value={block.data.credit}
              onChange={(e) => updateMediaBlockData(block.id, 'credit', e.target.value)}
              placeholder="e.g. Reuters / Bureau Staff"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-slate-500 mb-1">Caption</label>
            <input
              type="text"
              value={block.data.caption}
              onChange={(e) => updateMediaBlockData(block.id, 'caption', e.target.value)}
              placeholder="Caption describing the image..."
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
        </div>
      )}

      {block.type === 'chart' && (
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-500 mb-1">Chart Type</label>
              <select
                value={block.data.chartType}
                onChange={(e) => updateMediaBlockData(block.id, 'chartType', e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
                <option value="kpi">KPI Metric Stat</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-500 mb-1">Chart Title</label>
              <input
                type="text"
                value={block.data.title}
                onChange={(e) => updateMediaBlockData(block.id, 'title', e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-500 mb-1">Data Rows (Label: Value)</label>
            <textarea
              rows={3}
              value={block.data.dataRows}
              onChange={(e) => updateMediaBlockData(block.id, 'dataRows', e.target.value)}
              placeholder="2024: 15&#10;2025: 35&#10;2026: 72"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-[11px]"
            />
          </div>
        </div>
      )}

      {block.type === 'quote' && (
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-500 mb-1">Quote Statement</label>
            <textarea
              rows={2}
              value={block.data.quote}
              onChange={(e) => updateMediaBlockData(block.id, 'quote', e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 mb-1">Attributed Person</label>
              <input
                type="text"
                value={block.data.attribution}
                onChange={(e) => updateMediaBlockData(block.id, 'attribution', e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Speaker Role / Title</label>
              <input
                type="text"
                value={block.data.title}
                onChange={(e) => updateMediaBlockData(block.id, 'title', e.target.value)}
                placeholder="e.g. Chief Economist"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>
        </div>
      )}

      {block.type === 'timeline' && (
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-500 mb-1">Timeline Title</label>
            <input
              type="text"
              value={block.data.title}
              onChange={(e) => updateMediaBlockData(block.id, 'title', e.target.value)}
              placeholder="e.g. Summit Timeline"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
        </div>
      )}

      {block.type === 'table' && (
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-500 mb-1">Table Title</label>
            <input
              type="text"
              value={block.data.title}
              onChange={(e) => updateMediaBlockData(block.id, 'title', e.target.value)}
              placeholder="e.g. Sovereign AI Supercluster Specs"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-slate-500 mb-1">Column Headers (Comma-separated)</label>
            <input
              type="text"
              value={block.data.headers}
              onChange={(e) => updateMediaBlockData(block.id, 'headers', e.target.value)}
              placeholder="Metric, Baseline 2024, Target 2026"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-slate-500 mb-1">
              Table Rows (One row per line, comma-separated)
            </label>
            <textarea
              rows={3}
              value={block.data.rowsText}
              onChange={(e) => updateMediaBlockData(block.id, 'rowsText', e.target.value)}
              placeholder="Latency (ms), 4.2, 0.9&#10;Bandwidth (TB/s), 12.5, 48.0"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-[11px]"
            />
          </div>
          <div>
            <label className="block text-slate-500 mb-1">Footer / Attribution</label>
            <input
              type="text"
              value={block.data.footer}
              onChange={(e) => updateMediaBlockData(block.id, 'footer', e.target.value)}
              placeholder="Source: Technical Benchmark Commission"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
        </div>
      )}

      {block.type === 'callout' && (
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-500 mb-1">Callout Tone</label>
              <select
                value={(block.data.style as string) || 'info'}
                onChange={(e) => updateMediaBlockData(block.id, 'style', e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="info">Info (Blue)</option>
                <option value="tip">Tip / Solution (Green)</option>
                <option value="warning">Warning (Amber)</option>
                <option value="critical">Critical Alert (Red)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-500 mb-1">Callout Title</label>
              <input
                type="text"
                value={block.data.title}
                onChange={(e) => updateMediaBlockData(block.id, 'title', e.target.value)}
                placeholder="e.g. Strategic Regulatory Context"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-500 mb-1">Callout Content</label>
            <textarea
              rows={2}
              value={block.data.text}
              onChange={(e) => updateMediaBlockData(block.id, 'text', e.target.value)}
              placeholder="Important context or takeaway note..."
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
        </div>
      )}

      {block.type === 'statistic' && (
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 mb-1">Metric Label</label>
              <input
                type="text"
                value={block.data.label}
                onChange={(e) => updateMediaBlockData(block.id, 'label', e.target.value)}
                placeholder="e.g. Projected Market Capitalization"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Key Value</label>
              <input
                type="text"
                value={block.data.value}
                onChange={(e) => updateMediaBlockData(block.id, 'value', e.target.value)}
                placeholder="e.g. $1.4 Trillion"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 mb-1">Trend Direction</label>
              <select
                value={(block.data.trend as string) || 'up'}
                onChange={(e) => updateMediaBlockData(block.id, 'trend', e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="up">Upward (↑)</option>
                <option value="down">Downward (↓)</option>
                <option value="neutral">Neutral (—)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Trend Value / Delta</label>
              <input
                type="text"
                value={block.data.trendValue}
                onChange={(e) => updateMediaBlockData(block.id, 'trendValue', e.target.value)}
                placeholder="e.g. +24.8% YoY"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-500 mb-1">Context / Caption</label>
            <input
              type="text"
              value={block.data.context}
              onChange={(e) => updateMediaBlockData(block.id, 'context', e.target.value)}
              placeholder="e.g. Based on verified multilateral fiscal disclosures."
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
        </div>
      )}

      {block.type === 'video' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 mb-1">Video Stream URL</label>
            <input
              type="url"
              value={block.data.url}
              onChange={(e) => updateMediaBlockData(block.id, 'url', e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-slate-500 mb-1">Duration (Seconds)</label>
            <input
              type="number"
              value={block.data.durationSeconds}
              onChange={(e) => updateMediaBlockData(block.id, 'durationSeconds', e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
        </div>
      )}
    </>
  );
}
