'use client';

import React from 'react';
import { AlertTriangle, Check, Loader2, X } from 'lucide-react';
import type { StoryBlock } from '@ai-news/schemas';
import {
  NewsroomApiError,
  commitStoryVersion,
  getStory,
  updateStoryBlock,
} from '../lib/newsroom-api';
import type { BlockSource } from './StoryBlockLoader';

export type SaveMode = 'version' | 'block';

/**
 * Save an edited block back to the story it came from.
 *
 * The platform has no staged-revision concept: there is no "pending
 * revision" that waits for a publish. A version commit *is* the audit record
 * *and* the publish — the story keeps its status and the new content goes
 * live at once. So the two ways back are:
 *
 *  - **Save as a new version** — the proper path. It snapshots an immutable
 *    version, records an audit entry with the change summary, and prepends a
 *    `what_changed` block so readers can see what moved. This is the default.
 *
 *  - **Update the block in place** — surgical and immediate, but it creates
 *    no version, no audit entry and no diff block. The story's version
 *    history will not mention it, and a reader looking at "version 3" will
 *    not see what the reader is seeing now.
 */
export function SaveToStoryDialog({
  block,
  source,
  onClose,
  onSaved,
}: {
  block: StoryBlock;
  source: BlockSource;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [mode, setMode] = React.useState<SaveMode>('version');
  const [summary, setSummary] = React.useState('');
  const [state, setState] = React.useState<'idle' | 'saving' | 'error'>('idle');
  const [error, setError] = React.useState<string | null>(null);

  const save = async () => {
    setState('saving');
    setError(null);

    try {
      if (mode === 'block') {
        await updateStoryBlock(source.storyId, block);
        onSaved(`The block was updated in “${source.storyTitle}”.`);
        onClose();
        return;
      }

      /*
       * A version commit replaces the whole block list, so the story is
       * read first and only the one block is changed. Sending a partial
       * list would delete every block the editor did not send.
       */
      const story = await getStory(source.storyId);
      const blocks = (story.blocks ?? []).map((existing) =>
        existing.id === source.blockId ? block : existing
      );

      const result = await commitStoryVersion(
        source.storyId,
        blocks,
        summary.trim() || 'Block updated in the Block Studio'
      );

      onSaved(
        result.versionNumber
          ? `Saved as version ${result.versionNumber} of “${source.storyTitle}”.`
          : `Saved to “${source.storyTitle}”.`
      );
      onClose();
    } catch (cause) {
      const message =
        cause instanceof NewsroomApiError
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Save back to the story"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0d1220]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Save back to the story
            </h2>
            <p className="mt-0.5 truncate text-[11px] text-slate-500">
              {source.storyTitle} · {block.blockType} block
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <fieldset className="space-y-2">
            <legend className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              How
            </legend>

            <label
              className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors ${
                mode === 'version'
                  ? 'border-blue-500 bg-blue-50/60 dark:border-blue-500/50 dark:bg-blue-500/10'
                  : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50'
              }`}
            >
              <input
                type="radio"
                name="save-mode"
                checked={mode === 'version'}
                onChange={() => setMode('version')}
                className="mt-0.5 accent-blue-600"
              />
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                  Save as a new version
                </span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">
                  Snapshots an immutable version, records the change in the audit log, and prepends
                  a “what changed” block for readers. The story keeps its status and the new content
                  goes live at once — the platform has no staged revision that waits for a publish.
                </span>
              </span>
            </label>

            <label
              className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors ${
                mode === 'block'
                  ? 'border-blue-500 bg-blue-50/60 dark:border-blue-500/50 dark:bg-blue-500/10'
                  : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50'
              }`}
            >
              <input
                type="radio"
                name="save-mode"
                checked={mode === 'block'}
                onChange={() => setMode('block')}
                className="mt-0.5 accent-blue-600"
              />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  Update the block in place
                </span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">
                  Surgical, and live immediately. But it creates no version, no audit entry and no
                  diff block — the story&apos;s version history will not mention the change.
                </span>
              </span>
            </label>
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

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/50">
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
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            {mode === 'version' ? 'Save as a new version' : 'Update the block'}
          </button>
        </div>
      </div>
    </div>
  );
}
