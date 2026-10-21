'use client';

import React from 'react';
import { ChevronDown, ChevronRight, ChevronUp, Plus, Trash2 } from 'lucide-react';
import type { FormField, ValidationIssue } from '@ai-news/block-studio';
import { getAtPath } from '@ai-news/block-studio';

interface FieldControlProps {
  field: FormField;
  path: string;
  value: unknown;
  onChange: (path: string, value: unknown) => void;
  issues: Map<string, ValidationIssue[]>;
  depth: number;
}

const INPUT_CLASS =
  'w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none studio-dark:border-slate-700 studio-dark:bg-slate-900/80 studio-dark:text-slate-100 studio-dark:placeholder:text-slate-600';

const PANEL_CLASS =
  'rounded-lg border border-slate-200 bg-slate-50 studio-dark:border-slate-800 studio-dark:bg-slate-900/30';

function joinPath(prefix: string, key: string): string {
  return prefix.length === 0 ? key : `${prefix}.${key}`;
}

/**
 * The hint shown in an empty field.
 *
 * An editor should never be left staring at a blank input wondering what
 * belongs there, so every field carries either the schema's own default or
 * a hint derived from its label.
 */
function placeholderFor(field: FormField): string {
  if (field.defaultValue !== undefined && field.defaultValue !== '') {
    return `Default: ${String(field.defaultValue)}`;
  }
  switch (field.kind) {
    case 'number':
      return field.min !== undefined ? `From ${field.min}` : 'Enter a number';
    case 'select':
      return 'Choose a value';
    case 'json':
      return '{}';
    case 'textarea':
      return `${field.label} (optional)`;
    default:
      return field.required ? field.label : `${field.label} (optional)`;
  }
}

/** A sensible starting value for a newly added field. */
export function defaultValueFor(field: FormField): unknown {
  if (field.defaultValue !== undefined) return field.defaultValue;
  switch (field.kind) {
    case 'object':
      return Object.fromEntries(
        (field.fields ?? []).map((child) => [child.key, defaultValueFor(child)])
      );
    case 'array':
      return [];
    case 'boolean':
      return false;
    case 'number':
      return field.min ?? 0;
    case 'select':
      return field.options?.[0]?.value ?? '';
    case 'json':
      return {};
    default:
      return '';
  }
}

/**
 * A free-form JSON value.
 *
 * Records and arrays of records are common in block payloads — a chart's
 * values, a dataset's rows — and they are edited as raw JSON. The editor
 * keeps a local draft so a half-typed value never corrupts the payload, and
 * pushes every *valid* edit straight through, so the preview updates as the
 * editor types rather than only when the field loses focus.
 */
function JsonField({
  path,
  value,
  onChange,
}: {
  path: string;
  value: unknown;
  onChange: (path: string, value: unknown) => void;
}) {
  const [draft, setDraft] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const selfUpdate = React.useRef(false);

  const serialised = React.useMemo(
    () => (value === undefined ? '' : JSON.stringify(value, null, 2)),
    [value]
  );
  const text = draft ?? serialised;

  // A change that did not come from this editor (a new variant, a reset)
  // replaces the draft with the payload.
  React.useEffect(() => {
    if (selfUpdate.current) {
      selfUpdate.current = false;
      return;
    }
    setDraft(null);
    setError(null);
  }, [serialised]);

  const handleChange = (next: string) => {
    setDraft(next);
    try {
      const parsed = JSON.parse(next) as unknown;
      setError(null);
      selfUpdate.current = true;
      onChange(path, parsed);
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : 'Invalid JSON.');
    }
  };

  return (
    <div>
      <textarea
        value={text}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={() => {
          // Drop a draft that never became valid JSON, so the payload shown
          // is always the payload the preview is rendering.
          if (draft !== null) {
            try {
              JSON.parse(draft);
            } catch {
              setDraft(null);
              setError(null);
            }
          }
        }}
        spellCheck={false}
        rows={6}
        className={`w-full resize-y rounded-md border bg-white p-2 font-mono text-[12px] leading-relaxed text-slate-800 focus:outline-none studio-dark:bg-slate-950/70 studio-dark:text-slate-200 ${
          error
            ? 'border-rose-400 studio-dark:border-rose-500/60'
            : 'border-slate-300 focus:border-blue-500 studio-dark:border-slate-700'
        }`}
      />
      {error && (
        <p className="mt-1 text-[11px] font-medium text-rose-600 studio-dark:text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}

/** A short label for an array item, so the collapsed list stays readable. */
function summariseItem(field: FormField, item: unknown, index: number): string {
  if (field.item && field.item.kind === 'object') {
    const first = (field.item.fields ?? []).find((child) => child.kind === 'text');
    if (first) {
      const candidate = getAtPath(item, first.key);
      if (typeof candidate === 'string' && candidate.trim().length > 0) return candidate;
    }
  }
  if (typeof item === 'string' || typeof item === 'number') return String(item);
  if (item && typeof item === 'object') {
    const values = Object.values(item as Record<string, unknown>);
    const firstString = values.find((value) => typeof value === 'string' && value.length > 0);
    if (typeof firstString === 'string') return firstString;
  }
  return `Item ${index + 1}`;
}

/**
 * A list of values, one collapsible panel per item.
 *
 * A block payload can hold a long list — a chart's values, a dataset's rows
 * — and laying every field out at once makes the panel unusable. Each item
 * collapses to a one-line summary. The first item starts open so the shape
 * of the list is obvious; the rest start closed.
 */
function ArrayField({ field, path, value, onChange, issues, depth }: FieldControlProps) {
  const items = Array.isArray(value) ? value : [];
  const item = field.item;
  const [expanded, setExpanded] = React.useState<Record<number, boolean>>({ 0: true });

  const replace = (next: unknown[]) => onChange(path, next);

  const toggle = (index: number) =>
    setExpanded((previous) => ({ ...previous, [index]: !previous[index] }));

  return (
    <div className={PANEL_CLASS}>
      <div className="flex items-center justify-between gap-2 px-2.5 py-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {field.label}
          <span className="ml-1.5 font-mono normal-case text-slate-500">
            {items.length} item{items.length === 1 ? '' : 's'}
          </span>
        </span>
        <button
          type="button"
          onClick={() => replace([...items, item ? defaultValueFor(item) : null])}
          className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 transition-colors hover:border-blue-500 hover:text-white studio-dark:border-slate-700 studio-dark:bg-slate-800 studio-dark:text-slate-300"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>

      {items.length === 0 && (
        <p className="px-2.5 pb-2 text-[11px] italic text-slate-500">No items yet.</p>
      )}

      <div className="space-y-1.5 px-2 pb-2">
        {items.map((entry, index) => {
          const itemPath = `${path}.${index}`;
          const isOpen = expanded[index] ?? false;
          const summary = summariseItem(field, entry, index);

          return (
            <div
              key={index}
              className="overflow-hidden rounded-md border border-slate-200 bg-white studio-dark:border-slate-800 studio-dark:bg-slate-950/40"
            >
              <div className="flex items-center gap-1 px-1.5 py-1">
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  aria-expanded={isOpen}
                  aria-label={isOpen ? `Collapse ${summary}` : `Expand ${summary}`}
                  className="flex min-w-0 flex-1 items-center gap-1.5 rounded px-1 py-0.5 text-left text-[12px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 studio-dark:text-slate-300 studio-dark:hover:bg-slate-800/70 studio-dark:hover:text-white"
                >
                  {isOpen ? (
                    <ChevronDown className="h-3 w-3 shrink-0" />
                  ) : (
                    <ChevronRight className="h-3 w-3 shrink-0" />
                  )}
                  <span className="font-mono text-[11px] text-slate-400">[{index}]</span>
                  <span className="truncate">{summary}</span>
                </button>

                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    aria-label="Move up"
                    disabled={index === 0}
                    onClick={() => {
                      const next = [...items];
                      if (index === 0) return;
                      [next[index - 1], next[index]] = [next[index], next[index - 1]];
                      replace(next);
                    }}
                    className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30 studio-dark:text-slate-500 studio-dark:hover:bg-slate-800 studio-dark:hover:text-slate-200"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    disabled={index === items.length - 1}
                    onClick={() => {
                      const next = [...items];
                      if (index >= items.length - 1) return;
                      [next[index + 1], next[index]] = [next[index], next[index + 1]];
                      replace(next);
                    }}
                    className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30 studio-dark:text-slate-500 studio-dark:hover:bg-slate-800 studio-dark:hover:text-slate-200"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => replace(items.filter((_, i) => i !== index))}
                    className="rounded p-1 text-slate-400 transition-colors hover:bg-rose-100 hover:text-rose-600 studio-dark:text-slate-500 studio-dark:hover:bg-rose-500/20 studio-dark:hover:text-rose-300"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-slate-200 p-2 studio-dark:border-slate-800">
                  {item && field.ofObjects ? (
                    <div className="space-y-2">
                      {(item.fields ?? []).map((child) => (
                        <FieldControl
                          key={child.key}
                          field={child}
                          path={joinPath(itemPath, child.key)}
                          value={getAtPath(entry, child.key)}
                          onChange={onChange}
                          issues={issues}
                          depth={depth + 1}
                        />
                      ))}
                    </div>
                  ) : (
                    item && (
                      <FieldControl
                        field={item}
                        path={itemPath}
                        value={entry}
                        onChange={onChange}
                        issues={issues}
                        depth={depth + 1}
                      />
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Render one field, recursing into objects and arrays.
 *
 * The form is generated from the block's own Zod schema, so it stays in step
 * with what the platform will accept — there is no second description of the
 * payload to keep up to date.
 */
function FieldControl({ field, path, value, onChange, issues, depth }: FieldControlProps) {
  const fieldIssues = issues.get(path) ?? [];
  const hasError = fieldIssues.length > 0;

  if (field.kind === 'object') {
    return (
      <fieldset className={`${PANEL_CLASS} ${depth === 0 ? 'p-2.5' : 'p-2'}`}>
        <legend className="px-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {field.label}
        </legend>
        <div className="space-y-2.5">
          {(field.fields ?? []).map((child) => (
            <FieldControl
              key={child.key}
              field={child}
              path={joinPath(path, child.key)}
              value={getAtPath(value, child.key)}
              onChange={onChange}
              issues={issues}
              depth={depth + 1}
            />
          ))}
        </div>
      </fieldset>
    );
  }

  if (field.kind === 'array') {
    return (
      <ArrayField
        field={field}
        path={path}
        value={value}
        onChange={onChange}
        issues={issues}
        depth={depth}
      />
    );
  }

  const errorLine = hasError ? (
    <p className="mt-1 text-[11px] font-medium text-rose-600 studio-dark:text-rose-300">
      {fieldIssues[0].message}
    </p>
  ) : null;

  const label = (
    <label className="mb-1 flex items-baseline gap-1.5">
      <span className="text-[12px] font-semibold text-slate-700 studio-dark:text-slate-300">
        {field.label}
      </span>
      {!field.required && <span className="text-[9px] uppercase text-slate-500">optional</span>}
      {hasError && (
        <span className="text-[9px] font-bold uppercase text-rose-600 studio-dark:text-rose-400">
          invalid
        </span>
      )}
    </label>
  );

  if (field.kind === 'boolean') {
    /*
     * A boolean the payload leaves unset shows its schema default, so the
     * control agrees with what the renderer actually does. `chart.legend.show`
     * defaults to true, so an absent legend is drawn — and the checkbox says
     * so too.
     */
    const effective = value === undefined ? Boolean(field.defaultValue) : Boolean(value);

    return (
      <div>
        <div className="flex items-center gap-2">
          <input
            id={`field_${path}`}
            type="checkbox"
            checked={effective}
            onChange={(event) => onChange(path, event.target.checked)}
            className="h-3.5 w-3.5 accent-blue-500"
          />
          <label htmlFor={`field_${path}`} className="text-[12px] text-slate-600">
            {field.label}
          </label>
        </div>
        {errorLine}
      </div>
    );
  }

  if (field.kind === 'select') {
    return (
      <div>
        {label}
        <select
          value={
            value === undefined || value === null
              ? field.defaultValue === undefined
                ? ''
                : String(field.defaultValue)
              : String(value)
          }
          onChange={(event) => {
            // The empty option means "not set", not "set to an empty string",
            // so the field is removed from the payload entirely.
            if (event.target.value === '' && !field.required) {
              onChange(path, undefined);
              return;
            }
            onChange(path, event.target.value);
          }}
          className={INPUT_CLASS}
        >
          {!field.required && <option value="">—</option>}
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errorLine}
      </div>
    );
  }

  if (field.kind === 'number') {
    return (
      <div>
        {label}
        <input
          type="number"
          value={
            typeof value === 'number' && Number.isFinite(value)
              ? value
              : value === undefined || value === null || value === ''
                ? ''
                : String(value)
          }
          min={field.min}
          max={field.max}
          step={field.step ?? 'any'}
          placeholder={placeholderFor(field)}
          onChange={(event) => {
            const raw = event.target.value;
            if (raw === '') {
              onChange(path, undefined);
              return;
            }
            const parsed = Number(raw);
            onChange(path, Number.isNaN(parsed) ? raw : parsed);
          }}
          className={INPUT_CLASS}
        />
        {(field.min !== undefined || field.max !== undefined) && (
          <p className="mt-0.5 font-mono text-[9px] text-slate-500">
            {field.min ?? '−∞'} … {field.max ?? '∞'}
          </p>
        )}
        {errorLine}
      </div>
    );
  }

  if (field.kind === 'textarea') {
    return (
      <div>
        {label}
        <textarea
          rows={3}
          value={value === undefined || value === null ? '' : String(value)}
          placeholder={placeholderFor(field)}
          onChange={(event) => onChange(path, event.target.value)}
          className={`${INPUT_CLASS} resize-y font-mono leading-relaxed`}
        />
        {errorLine}
      </div>
    );
  }

  if (field.kind === 'json') {
    return (
      <div>
        {label}
        <JsonField path={path} value={value} onChange={onChange} />
        {errorLine}
      </div>
    );
  }

  return (
    <div>
      {label}
      <input
        type={field.format === 'url' ? 'url' : 'text'}
        value={value === undefined || value === null ? '' : String(value)}
        placeholder={placeholderFor(field)}
        onChange={(event) => onChange(path, event.target.value)}
        className={INPUT_CLASS}
      />
      {errorLine}
    </div>
  );
}

export interface FormEditorProps {
  fields: FormField[];
  path: string;
  data: unknown;
  onChange: (path: string, value: unknown) => void;
  issues: Map<string, ValidationIssue[]>;
}

/** The generated form for a block's payload. */
export function FormEditor({ fields, path, data, onChange, issues }: FormEditorProps) {
  if (fields.length === 0) {
    return <p className="text-[13px] text-slate-500">This block has no editable fields.</p>;
  }

  return (
    <div className="space-y-3">
      {fields.map((field) => (
        <FieldControl
          key={field.key}
          field={field}
          path={joinPath(path, field.key)}
          value={getAtPath(data, field.key)}
          onChange={onChange}
          issues={issues}
          depth={0}
        />
      ))}
    </div>
  );
}
