'use client';

import React from 'react';
import { ChevronDown, ChevronRight, ChevronUp, Plus, Trash2 } from 'lucide-react';
import type { FormField } from '../form-schema';
import type { ValidationIssue } from '../validation';
import { getAtPath } from '../path';
import { BLOCK_COLOR_SWATCHES, isFieldVisible } from '../hints';

interface FieldControlProps {
  field: FormField;
  path: string;
  value: unknown;
  /** The value this field had before the editor started. */
  baselineValue: unknown;
  onChange: (path: string, value: unknown) => void;
  issues: Map<string, ValidationIssue[]>;
  depth: number;
  /**
   * The whole payload, from its root.
   *
   * A field can depend on another one — a map's routes only apply to a
   * route map — so the rule is read against the payload rather than
   * against the value of the field being edited.
   */
  payload?: unknown;
}

const INPUT_CLASS =
  'w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-600';

const PANEL_CLASS =
  'rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30';

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
        className={`w-full resize-y rounded-md border bg-white p-2 font-mono text-[12px] leading-relaxed text-slate-800 focus:outline-none dark:bg-slate-950/70 dark:text-slate-200 ${
          error
            ? 'border-rose-400 dark:border-rose-500/60'
            : 'border-slate-300 focus:border-blue-500 dark:border-slate-700'
        }`}
      />
      {error && (
        <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-300">{error}</p>
      )}
    </div>
  );
}

/** Whether a value differs from the one the editor started with. */
function hasChanged(value: unknown, baseline: unknown): boolean {
  if (value === undefined && baseline === undefined) return false;
  return JSON.stringify(value ?? null) !== JSON.stringify(baseline ?? null);
}

/**
 * A colour, chosen from a swatch rather than typed.
 *
 * The palette is the one the renderers already draw with, so a colour picked
 * here is a colour that already looks right in a story. The hex box stays,
 * because a colour outside the palette is a legitimate choice — the schema
 * still checks it either way.
 */
function ColorField({
  path,
  value,
  onChange,
}: {
  path: string;
  value: unknown;
  onChange: (path: string, value: unknown) => void;
}) {
  const current = typeof value === 'string' ? value : '';
  const isSwatch = (swatch: string) => current.toLowerCase() === swatch.toLowerCase();

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        {BLOCK_COLOR_SWATCHES.map((swatch) => (
          <button
            key={swatch}
            type="button"
            title={swatch}
            aria-label={`Use the colour ${swatch}`}
            aria-pressed={isSwatch(swatch)}
            onClick={() => onChange(path, swatch)}
            className={`h-6 w-6 rounded-md border-2 transition-transform ${
              isSwatch(swatch)
                ? 'scale-110 border-blue-500'
                : 'border-slate-200 hover:scale-105 dark:border-slate-700'
            }`}
            style={{ backgroundColor: swatch }}
          />
        ))}
      </div>
      <input
        type="text"
        value={current}
        placeholder="#3b82f6"
        spellCheck={false}
        onChange={(event) => onChange(path, event.target.value)}
        className={`${INPUT_CLASS} mt-2 font-mono`}
      />
    </div>
  );
}

/**
 * A short list of options, as a row of buttons.
 *
 * A dropdown hides the alternatives behind a click, and for a field with
 * three or four choices the alternatives are the point — an editor should
 * be able to see them all at once.
 */
function SegmentField({
  field,
  path,
  value,
  onChange,
}: {
  field: FormField;
  path: string;
  value: unknown;
  onChange: (path: string, value: unknown) => void;
}) {
  const current = value === undefined || value === null ? '' : String(value);

  return (
    <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-900/70">
      {(field.options ?? []).map((option) => {
        const isSelected = current === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(path, option.value)}
            className={`rounded-md px-2.5 py-1 text-[12px] font-semibold transition-colors ${
              isSelected
                ? 'bg-blue-600 text-white'
                : 'text-slate-500 hover:bg-white hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * A date.
 *
 * The value is a string, and it is often a full timestamp — a publication
 * time, not a date. The picker edits the date part of it and leaves the
 * time alone, so picking a day never silently drops the hour.
 */
function DateField({
  path,
  value,
  onChange,
}: {
  path: string;
  value: unknown;
  onChange: (path: string, value: unknown) => void;
}) {
  const current = typeof value === 'string' ? value : '';
  const datePart = /^\d{4}-\d{2}-\d{2}/.test(current) ? current.slice(0, 10) : '';
  const timePart = /T(\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)/.exec(current)?.[1];

  return (
    <input
      type="date"
      value={datePart}
      onChange={(event) => {
        const next = event.target.value;
        if (!next) {
          onChange(path, '');
          return;
        }
        onChange(path, timePart ? `${next}T${timePart}` : next);
      }}
      className={INPUT_CLASS}
    />
  );
}

/** A short label for an array item, so the collapsed list stays readable. */ function summariseItem(
  field: FormField,
  item: unknown,
  index: number
): string {
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
function ArrayField({
  field,
  path,
  value,
  baselineValue,
  onChange,
  issues,
  depth,
  payload,
}: FieldControlProps) {
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
          className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 transition-colors hover:border-blue-500 hover:text-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
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
              className="overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/40"
            >
              <div className="flex items-center gap-1 px-1.5 py-1">
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  aria-expanded={isOpen}
                  aria-label={isOpen ? `Collapse ${summary}` : `Expand ${summary}`}
                  className="flex min-w-0 flex-1 items-center gap-1.5 rounded px-1 py-0.5 text-left text-[12px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white"
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
                    className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
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
                    className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => replace(items.filter((_, i) => i !== index))}
                    className="rounded p-1 text-slate-400 transition-colors hover:bg-rose-100 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-500/20 dark:hover:text-rose-300"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-slate-200 p-2 dark:border-slate-800">
                  {item && field.ofObjects ? (
                    <div className="space-y-2">
                      {(item.fields ?? []).map((child) => (
                        <FieldControl
                          key={child.key}
                          field={child}
                          path={joinPath(itemPath, child.key)}
                          value={getAtPath(entry, child.key)}
                          baselineValue={getAtPath(baselineValue, `${index}.${child.key}`)}
                          onChange={onChange}
                          issues={issues}
                          depth={depth + 1}
                          payload={payload}
                        />
                      ))}
                    </div>
                  ) : (
                    item && (
                      <FieldControl
                        field={item}
                        path={itemPath}
                        value={entry}
                        baselineValue={getAtPath(baselineValue, String(index))}
                        onChange={onChange}
                        issues={issues}
                        depth={depth + 1}
                        payload={payload}
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
function FieldControl({
  field,
  path,
  value,
  baselineValue,
  onChange,
  issues,
  depth,
  payload,
}: FieldControlProps) {
  const fieldIssues = issues.get(path) ?? [];
  const hasError = fieldIssues.length > 0;
  const changed = hasChanged(value, baselineValue);

  /** Whether an advanced field has been opened. */
  const [opened, setOpened] = React.useState(false);

  /**
   * Whether the field applies.
   *
   * A field can depend on another one — a map's routes only apply to a
   * route map — so a field that does not apply is not drawn at all. An
   * editor is never shown a control that would have no effect.
   */
  const visible = isFieldVisible(field.visibleWhen, (target) => getAtPath(payload, target));
  if (!visible) return null;

  if (field.kind === 'object') {
    const children = (field.fields ?? []).filter((child) =>
      isFieldVisible(child.visibleWhen, (target) => getAtPath(payload, target))
    );
    // An object whose every child is out of scope has nothing to show.
    if (children.length === 0) return null;

    return (
      <fieldset className={`${PANEL_CLASS} ${depth === 0 ? 'p-2.5' : 'p-2'}`}>
        <legend className="px-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {field.label}
        </legend>
        <div className="space-y-2.5">
          {children.map((child) => (
            <FieldControl
              key={child.key}
              field={child}
              path={joinPath(path, child.key)}
              value={getAtPath(value, child.key)}
              baselineValue={getAtPath(baselineValue, child.key)}
              onChange={onChange}
              issues={issues}
              depth={depth + 1}
              payload={payload}
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
        baselineValue={baselineValue}
        onChange={onChange}
        issues={issues}
        depth={depth}
        payload={payload}
      />
    );
  }

  const errorLine = hasError ? (
    <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-300">
      {fieldIssues[0].message}
    </p>
  ) : null;

  /** The guidance a hint attached to the field. */
  const helpLine = field.help ? (
    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{field.help}</p>
  ) : null;

  const label = (
    <label className="mb-1 flex items-baseline gap-1.5">
      <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">
        {field.label}
      </span>
      {field.unit && <span className="font-mono text-[10px] text-slate-500">{field.unit}</span>}
      {!field.required && <span className="text-[9px] uppercase text-slate-500">optional</span>}
      {changed && (
        <span
          title="Changed since this payload was loaded"
          className="rounded bg-amber-100 px-1 py-px text-[9px] font-bold uppercase text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
        >
          edited
        </span>
      )}
      {hasError && (
        <span className="text-[9px] font-bold uppercase text-rose-600 dark:text-rose-400">
          invalid
        </span>
      )}
    </label>
  );

  /**
   * An advanced field is folded away until it is asked for.
   *
   * Some options matter to a specialist and mean nothing to most editors —
   * a chart's facet field, a table's page size. Keeping them out of the way
   * is what makes a long form readable, without hiding them.
   */
  if (field.advanced && !opened) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpened(true)}
          className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ChevronRight className="h-3 w-3" />
          {field.label}
          <span className="text-[9px] uppercase text-slate-400">advanced</span>
        </button>
        {helpLine}
        {errorLine}
      </div>
    );
  }

  /** The control itself, drawn the way the field's control asks for. */
  const control = (() => {
    if (field.kind === 'boolean') {
      /*
       * A boolean the payload leaves unset shows its schema default, so the
       * control agrees with what the renderer actually does. `chart.legend.show`
       * defaults to true, so an absent legend is drawn — and the checkbox says
       * so too.
       */
      const effective = value === undefined ? Boolean(field.defaultValue) : Boolean(value);

      return (
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
      );
    }

    if (field.control === 'segment') {
      return <SegmentField field={field} path={path} value={value} onChange={onChange} />;
    }

    if (field.control === 'color') {
      return <ColorField path={path} value={value} onChange={onChange} />;
    }

    if (field.control === 'date') {
      return <DateField path={path} value={value} onChange={onChange} />;
    }

    if (field.kind === 'select') {
      return (
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
      );
    }

    if (field.kind === 'number') {
      return (
        <div>
          {label}
          <input
            id={`field_${path}`}
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
        </div>
      );
    }

    if (field.kind === 'textarea') {
      return (
        <textarea
          rows={3}
          value={value === undefined || value === null ? '' : String(value)}
          placeholder={placeholderFor(field)}
          onChange={(event) => onChange(path, event.target.value)}
          className={`${INPUT_CLASS} resize-y font-mono leading-relaxed`}
        />
      );
    }

    if (field.kind === 'json') {
      return <JsonField path={path} value={value} onChange={onChange} />;
    }

    return (
      <input
        type={field.format === 'url' ? 'url' : 'text'}
        value={value === undefined || value === null ? '' : String(value)}
        placeholder={placeholderFor(field)}
        onChange={(event) => onChange(path, event.target.value)}
        className={INPUT_CLASS}
      />
    );
  })();

  return (
    <div>
      {label}
      {control}
      {helpLine}
      {errorLine}
    </div>
  );
}

export interface FormEditorProps {
  fields: FormField[];
  path: string;
  data: unknown;
  /**
   * The payload as it was before editing began. Fields that differ from it
   * are marked, so an editor can see at a glance what they have changed.
   */
  baseline?: unknown;
  onChange: (path: string, value: unknown) => void;
  issues: Map<string, ValidationIssue[]>;
  /**
   * The whole payload, from its root.
   *
   * Fields that depend on other fields are decided against the payload
   * rather than against the value of the field being edited.
   */
  payload?: unknown;
}

/** The generated form for a block's payload. */
export function FormEditor({
  fields,
  path,
  data,
  baseline,
  onChange,
  issues,
  payload,
}: FormEditorProps) {
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
          baselineValue={getAtPath(baseline, field.key)}
          onChange={onChange}
          issues={issues}
          depth={0}
          payload={payload}
        />
      ))}
    </div>
  );
}
