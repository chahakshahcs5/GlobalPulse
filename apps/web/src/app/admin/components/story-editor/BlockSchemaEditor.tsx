'use client';

import { useMemo } from 'react';
import {
  FormEditor,
  buildDataFormFields,
  issuesByPath,
  schemaForType,
  setAtPath,
  validateBlockData,
} from '@ai-news/block-studio';
import type { MediaBlockDraft } from './types';

/**
 * The composer's block editor.
 *
 * It is the same schema-driven form the Block Studio uses, so an editor
 * edits a block the same way in both places, and the form can never offer a
 * field the platform would reject.
 */
export function BlockSchemaEditor({
  block,
  baseline,
  onChange,
}: {
  block: MediaBlockDraft;
  /** The payload as it was when the block was added, for marking changes. */
  baseline?: MediaBlockDraft['data'];
  onChange: (data: MediaBlockDraft['data']) => void;
}) {
  const schema = useMemo(() => schemaForType(block.type), [block.type]);
  const fields = useMemo(() => (schema ? buildDataFormFields(schema) : null), [schema]);
  const validation = useMemo(
    () => validateBlockData(block.type, block.data),
    [block.type, block.data]
  );
  const issues = useMemo(() => issuesByPath(validation.issues), [validation.issues]);

  if (!fields) {
    return (
      <p className="text-xs text-slate-500 dark:text-slate-400">
        No schema is registered for the {block.type} block.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {!validation.ok && (
        <ul className="space-y-0.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 dark:border-rose-500/30 dark:bg-rose-500/10">
          {validation.issues.map((issue, index) => (
            <li key={index} className="font-mono text-[11px] text-rose-700 dark:text-rose-300">
              {issue.path || '(block)'} — {issue.message}
            </li>
          ))}
        </ul>
      )}

      <FormEditor
        fields={fields.fields ?? []}
        path=""
        data={block.data}
        baseline={baseline}
        onChange={(path, value) =>
          onChange(setAtPath(block.data, path, value) as MediaBlockDraft['data'])
        }
        issues={issues}
      />
    </div>
  );
}
