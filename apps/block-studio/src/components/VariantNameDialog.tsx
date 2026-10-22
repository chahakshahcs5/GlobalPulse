'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from './useFocusTrap';

/**
 * Name a saved variant.
 *
 * A browser prompt would do the job, but it is unstyled, blocks the whole
 * page, and cannot say what it is for. This is the same thing, in the
 * studio's own language.
 */
export function VariantNameDialog({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (label: string) => void;
}) {
  const [label, setLabel] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  /** Keeps the keyboard inside the dialog and gives the focus back after. */
  const dialogRef = useFocusTrap<HTMLDivElement>(true);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  const submit = () => {
    const trimmed = label.trim();
    if (trimmed.length === 0) return;
    onSave(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-6 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Save as a variant"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0d1220]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Save as a variant</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              The payload as it stands now, saved to the newsroom so that everybody editing a story
              is offered the same treatment. The samples in the repository are untouched.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4">
          <label
            htmlFor="variant-name"
            className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
          >
            Name
          </label>
          <input
            id="variant-name"
            ref={inputRef}
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submit();
              }
            }}
            placeholder="e.g. Dark theme, with sources"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={label.trim().length === 0}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save variant
          </button>
        </div>
      </div>
    </div>
  );
}
