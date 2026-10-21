'use client';

import React from 'react';
import { AlertTriangle, Check, FilePlus2, Loader2 } from 'lucide-react';
import type { StoryBlock } from '@ai-news/schemas';
import {
  ApiError,
  addStoryBlock,
  blockOf,
  commitStoryVersion,
  getStory,
  newBlockId,
  updateStoryBlock,
  type StudioPayload,
} from '../lib/newsroom-api';
import type { StoryContext } from './story-context';

export type SaveMode = 'version' | 'block' | 'add';

/**
 * Import the block the editor has been working on into the story.
 *
 * The platform has no staged-revision concept: there is no "pending
 * revision" that waits for a publish. A version commit *is* the audit record
 * *and* the publish — the story keeps its status and the new content goes
 * live at once. So there are three ways back, and they are not equivalent:
 *
 *  - **Add the block to the story** — for a block the editor built from a
 *    sample. It is appended at the end and the API records an audit entry.
 *
 *  - **Save as a new version** — for a block that is already in the story.
 *    It snapshots an immutable version, records the change in the audit log
 *    with the change summary, and prepends a `what_changed` block so
 *    readers can see what moved.
 *
 *  - **Update the block in place** — surgical and immediate, but it creates
 *    no version, no audit entry and no diff block. The story's version
 *    history will not mention it.
 */
export function SaveToStoryDialog({
  context,
  blockType,
  payload,
  onClose,
  onSaved,
}: {
  context: StoryContext;
  blockType: string;
  payload: StudioPayload;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const isUpdate = Boolean(context.blockId);
  const [mode, setMode] = React.useState<SaveMode>(isUpdate ? 'version' : 'add');
  const [summary, setSummary] = React.useState('');
  const [state, setState] = React.useState<'idle' | 'saving' | 'error'>('idle');
  const [error, setError] = React.useState<string | null>(null);

  // Escape closes the dialog.
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && state !== 'saving') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, state]);

  const save = async () => {
    setState('saving');
    setError(null);

    /*
     * The whole block goes back, not just its content: the presentation, the
     * accessibility text, the provenance and the citations are part of the
     * block, and a block that came through the studio keeps them.
     */
    const block = blockOf(
      blockType,
      isUpdate ? context.blockId! : newBlockId(blockType),
      0,
      payload
    ) as StoryBlock;

    try {
      if (mode === 'add') {
        await addStoryBlock(context.storyId, block);
        onDone(`The block was added to “${context.storyTitle}”.`);
        onClose();
        return;
      }

      if (mode === 'block') {
        await updateStoryBlock(context.storyId, block.id, block);
        onDone(`The block was updated in “${context.storyTitle}”.`);
        onClose();
        return;
      }

      /*
       * A version commit replaces the whole block list, so the story is
       * read first and only the one block is changed. Sending a partial
       * list would delete every block the editor did not send.
       */
      const story = await getStory(context.storyId);
      const blocks = (story.blocks ?? []).map((existing) =>
        existing.id === context.blockId ? block : existing
      );

      const result = await commitStoryVersion(
        context.storyId,
        blocks,
        summary.trim() || 'Block updated in the Block Studio'
      );

      onDone(
        result.versionNumber
          ? `Saved as version ${result.versionNumber} of “${context.storyTitle}”.`
          : `Saved to “${context.storyTitle}”.`
      );
      onClose();
    } catch (cause) {
      const message =
        cause instanceof ApiError
          ? cause.message
          : cause instanceof Error
            ? cause.message
            : 'The story could not be saved.';

      /*
       * A version commit is the right path, but it depends on the API being
       * able to write a version. When it cannot, say so plainly and point at
       * the in-place update rather than leaving the editor guessing.
       */
      setState('error');
      setError(
        mode === 'version'
          ? `${message}\n\nThe API could not commit a version. “Update the block in place” writes the same change without a version, an audit entry or a diff block.`
          : message
      );
    }
  };

  const onDone = (message: string) => onSaved(message);

  const choices: { mode: SaveMode; title: string; detail: string; warning?: boolean }[] = [
    ...(isUpdate
      ? []
      : [
          {
            mode: 'add' as SaveMode,
            title: 'Add the block to the story',
            detail:
              'The block is appended to the end of the story, and the API records an audit entry for it.',
          },
        ]),
    ...(isUpdate
      ? [
          {
            mode: 'version' as SaveMode,
            title: 'Save as a new version',
            detail:
              'Snapshots an immutable version, records the change in the audit log, and prepends a “what changed” block for readers. The story keeps its status and the new content goes live at once — the platform has no staged revision that waits for a publish.',
          },
          {
            mode: 'block' as SaveMode,
            title: 'Update the block in place',
            detail:
              'Surgical, and live immediately. But it creates no version, no audit entry and no diff block — the story’s version history will not mention the change.',
            warning: true,
          },
        ]
      : []),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Import into the story"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0d1220]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {isUpdate ? 'Save the block back' : 'Import the block into the story'}
            </h2>
            <p className="mt-0.5 truncate text-[11px] text-slate-500">
              {context.storyTitle} · {blockType} block
            </p>
          </div>
        </div>

        <div className="space-y-3 px-5 py-4">
          <fieldset className="space-y-2">
            <legend className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              How
            </legend>

            {choices.map((choice) => (
              <label
                key={choice.mode}
                className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors ${
                  mode === choice.mode
                    ? 'border-blue-500 bg-blue-50/60 dark:border-blue-500/50 dark:bg-blue-500/10'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="save-mode"
                  checked={mode === choice.mode}
                  onChange={() => setMode(choice.mode)}
                  className="mt-0.5 accent-blue-600"
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                    {choice.warning && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                    {choice.title}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">
                    {choice.detail}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          {mode === 'version' && (
            <div>
              <label
                htmlFor="change-summary"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
              >
                What changed
              </label>
              <input
                id="change-summary"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void save();
                  }
                }}
                placeholder="e.g. Corrected the overstatement figure"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <p className="mt-1 text-[10px] text-slate-500">
                Recorded in the audit log and shown in the version history.
              </p>
            </div>
          )}

          {state === 'error' && (
            <p className="whitespace-pre-line rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium leading-relaxed text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={state === 'saving'}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {state === 'saving' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : mode === 'add' ? (
              <FilePlus2 className="h-3.5 w-3.5" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            {mode === 'add'
              ? 'Add to story'
              : mode === 'version'
                ? 'Save as a new version'
                : 'Update the block'}
          </button>
        </div>
      </div>
    </div>
  );
}
