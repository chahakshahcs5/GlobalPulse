'use client';

import React from 'react';

interface JsonEditorProps {
  data: unknown;
  onChange: (data: Record<string, unknown>) => void;
}

/**
 * The raw payload.
 *
 * Sometimes the form is not the fastest way in — a long list, or a payload
 * pasted in from somewhere else. This is the escape hatch, and it reports
 * its own parse errors rather than silently dropping the edit.
 */
export function JsonEditor({ data, onChange }: JsonEditorProps) {
  const [text, setText] = React.useState(() => JSON.stringify(data, null, 2));
  const [error, setError] = React.useState<string | null>(null);

  // Adopt an external change (a different variant, a reset) unless the text
  // on screen already describes it.
  React.useEffect(() => {
    setText((previous) => {
      try {
        if (JSON.stringify(JSON.parse(previous)) === JSON.stringify(data)) return previous;
      } catch {
        return previous;
      }
      return JSON.stringify(data, null, 2);
    });
  }, [data]);

  const handleChange = (next: string) => {
    setText(next);
    try {
      const parsed = JSON.parse(next) as unknown;
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setError('The payload must be a JSON object.');
        return;
      }
      setError(null);
      onChange(parsed as Record<string, unknown>);
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : 'Invalid JSON.');
    }
  };

  return (
    <div>
      <textarea
        value={text}
        onChange={(event) => handleChange(event.target.value)}
        spellCheck={false}
        aria-label="Block payload as JSON"
        className={`h-[calc(100vh-320px)] min-h-[320px] w-full resize-none rounded-lg border bg-white p-3 font-mono text-[12px] leading-relaxed text-slate-800 focus:outline-none dark:bg-slate-950/70 dark:text-slate-200 ${
          error
            ? 'border-rose-400 dark:border-rose-500/60'
            : 'border-slate-300 focus:border-blue-500 dark:border-slate-700'
        }`}
      />
      {error && (
        <p className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[12px] font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}
