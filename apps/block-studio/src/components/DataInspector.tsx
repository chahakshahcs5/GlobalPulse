'use client';

import React from 'react';
import { AlertTriangle, PanelRight, RotateCcw } from 'lucide-react';
import {
  BlockForm,
  buildBlockFormSections,
  issuesByPath,
  schemaForType,
  setAtPath,
  type StudioPayload,
  type ValidationResult,
} from '@ai-news/block-studio';
import type { InspectorTab } from './StudioShell';
import { JsonEditor } from '@ai-news/block-studio';

interface DataInspectorProps {
  blockType: string;
  /**
   * The whole block, minus the platform's bookkeeping.
   *
   * The content is one part of it. The block's presentation, its
   * accessibility text, its provenance and its citations are edited in the
   * same inspector, because they are as much a part of the block as its
   * words are.
   */
  payload: StudioPayload;
  /** The payload as it was when it was loaded, for marking what changed. */
  baseline?: StudioPayload;
  tab: InspectorTab;
  validation: ValidationResult;
  open: boolean;
  /** The class that turns on the chrome's dark utilities. */
  darkClass: string;
  onTabChange: (tab: InspectorTab) => void;
  onChange: (payload: StudioPayload) => void;
  onReset: () => void;
  onToggleOpen: () => void;
}

/**
 * The inspector.
 *
 * Two ways in on the same payload: a form generated from the block's own
 * schema, and the raw JSON. Both write straight through to the preview, and
 * both are checked against the same schema the platform validates against.
 */
export function DataInspector({
  blockType,
  payload,
  baseline,
  tab,
  validation,
  open,
  darkClass,
  onTabChange,
  onChange,
  onReset,
  onToggleOpen,
}: DataInspectorProps) {
  const schema = React.useMemo(() => schemaForType(blockType), [blockType]);
  const sections = React.useMemo(
    () => (schema ? buildBlockFormSections(blockType, schema) : null),
    [blockType, schema]
  );
  const issueMap = React.useMemo(() => issuesByPath(validation.issues), [validation.issues]);

  const handleFieldChange = React.useCallback(
    (path: string, value: unknown) => {
      onChange(setAtPath(payload, path, value) as StudioPayload);
    },
    [payload, onChange]
  );

  if (!open) {
    return (
      <aside
        className={`flex h-screen w-11 flex-col items-center gap-2 overflow-hidden border-l border-slate-200 bg-white py-3 dark:border-slate-800 dark:bg-[#0d1220] ${darkClass}`}
      >
        <button
          type="button"
          onClick={onToggleOpen}
          title="Show the inspector"
          aria-label="Show the inspector"
          className="rounded-md border border-slate-300 p-1.5 text-slate-500 transition-colors hover:text-slate-800 dark:border-slate-700 dark:text-slate-400"
        >
          <PanelRight className="h-3.5 w-3.5" />
        </button>{' '}
        <span
          className="text-[11px] font-bold uppercase tracking-wider text-slate-400"
          style={{ writingMode: 'vertical-rl' }}
        >
          Inspector
        </span>
      </aside>
    );
  }

  return (
    <aside
      className={`flex h-screen flex-col overflow-hidden border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0d1220] ${darkClass}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleOpen}
            title="Hide the inspector"
            aria-label="Hide the inspector"
            className="rounded-md border border-slate-300 p-1.5 text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:text-slate-100"
          >
            <PanelRight className="h-3.5 w-3.5" />
          </button>
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-900/70">
            {(['form', 'json'] as InspectorTab[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onTabChange(option)}
                className={`rounded-md px-2.5 py-1 text-[12px] font-bold uppercase tracking-wider transition-colors ${
                  tab === option
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onReset}
            title="Restore this variant's content"
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-100 px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      {validation.ok ? (
        <div className="flex items-center gap-2 border-b border-slate-200 bg-emerald-50 px-4 py-2 text-[12px] font-semibold text-emerald-700 dark:border-slate-800 dark:bg-emerald-500/10 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Valid payload
        </div>
      ) : (
        <div className="border-b border-rose-200 bg-rose-50 px-4 py-2 dark:border-rose-500/20 dark:bg-rose-500/10">
          <p className="flex items-center gap-1.5 text-[12px] font-bold text-rose-700 dark:text-rose-300">
            <AlertTriangle className="h-3.5 w-3.5" />
            {validation.issues.length} issue{validation.issues.length === 1 ? '' : 's'}
          </p>
          <ul className="mt-1 space-y-0.5">
            {validation.issues.slice(0, 4).map((issue, index) => (
              <li key={index} className="font-mono text-[11px] text-rose-600 dark:text-rose-300/80">
                {issue.path || '(root)'} — {issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {/*
          Both panels stay mounted and are toggled with `hidden`, so switching
          tabs does not discard the expanded state of a list, or a half-typed
          JSON draft.
        */}
        <div className={tab === 'form' ? '' : 'hidden'}>
          {sections ? (
            <BlockForm
              sections={sections}
              payload={payload}
              baseline={baseline}
              onChange={handleFieldChange}
              issues={issueMap}
            />
          ) : (
            <p className="text-[13px] text-slate-500">
              No schema is registered for this block type.
            </p>
          )}
        </div>
        <div className={tab === 'json' ? '' : 'hidden'}>
          <JsonEditor
            data={payload}
            onChange={(next) => onChange(next as unknown as StudioPayload)}
          />
        </div>
      </div>
    </aside>
  );
}
