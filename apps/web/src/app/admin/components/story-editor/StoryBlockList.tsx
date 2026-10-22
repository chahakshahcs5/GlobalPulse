'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, ChevronUp, ExternalLink, Plus, Trash2 } from 'lucide-react';
import type { StoryBlock } from '@ai-news/schemas';
import { blockOf, type StudioPayload } from '@ai-news/block-studio';
import { BlockTypePicker } from './BlockTypePicker';
import { BlockSchemaEditor } from './BlockSchemaEditor';
import type { BlockChange } from './types';

/**
 * The story's blocks, in the order they read.
 *
 * A story is made of blocks, and the composer edits the blocks the story
 * actually has — every type, not a handful of special cases. That is what
 * makes the composer safe to open on a story someone else wrote: nothing is
 * hidden from it and nothing is dropped on the way out.
 *
 * The list is the story. Reordering it reorders the story, and the blocks
 * can be added, edited, moved and removed from here.
 */

interface StoryBlockListProps {
  blocks: StoryBlock[];
  onChange: (blocks: StoryBlock[], change: BlockChange) => void;
  /** Opens a block in the Block Studio. */
  onOpenInStudio?: (block: StoryBlock) => void;
}

/** A readable name for a block, so the list reads as an outline. */
function blockLabel(block: StoryBlock): string {
  const data = (block.data ?? {}) as Record<string, unknown>;
  const candidates = [
    'headline',
    'title',
    'text',
    'question',
    'label',
    'name',
    'value',
    'caption',
    'altText',
  ];

  for (const key of candidates) {
    const value = data[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return block.blockType;
}

export function StoryBlockList({ blocks, onChange, onOpenInStudio }: StoryBlockListProps) {
  /*
   * A block starts collapsed, so a long story is a list rather than a wall
   * of forms. The first block starts open — it is the one an editor is
   * almost always here to change.
   */
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [pickerOpen, setPickerOpen] = useState(false);

  const toggle = (id: string) =>
    setExpanded((previous) => ({ ...previous, [id]: !(previous[id] ?? id === blocks[0]?.id) }));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    onChange(
      next.map((block, order) => ({ ...block, sortOrder: order })),
      { kind: 'reordered' }
    );
  };

  const remove = (index: number) => {
    const removed = blocks[index];
    onChange(
      blocks
        .filter((_, position) => position !== index)
        .map((block, order) => ({ ...block, sortOrder: order })),
      { kind: 'removed', block: removed }
    );
  };

  /**
   * A block was edited.
   *
   * The whole block is rebuilt from the payload, so the presentation, the
   * accessibility text, the provenance and the citations travel with it — a
   * block that is edited in the composer keeps everything it had.
   */
  const update = (id: string, payload: StudioPayload) => {
    const changed = blocks.find((block) => block.id === id);
    if (!changed) return;

    const rebuilt = blockOf(changed.blockType, changed.id, changed.sortOrder, payload);

    onChange(
      blocks.map((block) => (block.id === id ? rebuilt : block)),
      { kind: 'edited', block: rebuilt }
    );
  };

  const addBlock = (block: StoryBlock) => {
    onChange([...blocks, { ...block, sortOrder: blocks.length }], { kind: 'added', block });
    setExpanded((previous) => ({ ...previous, [block.id]: true }));
    setPickerOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
            Story Blocks
          </h3>
          <p className="text-[11px] text-slate-500">
            {blocks.length} block{blocks.length === 1 ? '' : 's'} — the order here is the order they
            read.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex cursor-pointer items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Add a block
        </button>
      </div>

      {pickerOpen && <BlockTypePicker onPick={addBlock} onClose={() => setPickerOpen(false)} />}

      {blocks.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center dark:border-slate-700">
          <p className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">
            This story has no blocks yet.
          </p>
          <p className="mx-auto mt-1 max-w-sm text-[12px] text-slate-500">
            A story is made of blocks — a headline, a lead, a chart, a pull quote. Add the first
            one, or build it in the Block Studio and send it here.
          </p>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Choose a block
          </button>
        </div>
      )}

      {blocks.map((block, index) => {
        const isOpen = expanded[block.id] ?? index === 0;

        return (
          <div
            key={block.id}
            className="rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2 dark:border-slate-700">
              <button
                type="button"
                onClick={() => toggle(block.id)}
                aria-expanded={isOpen}
                aria-label={isOpen ? `Collapse block ${index + 1}` : `Expand block ${index + 1}`}
                className="flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                )}
                <span className="font-mono text-[10px] tabular-nums text-slate-400">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  {block.blockType}
                </span>
                <span className="max-w-[16rem] truncate text-[12px] text-slate-600 dark:text-slate-300">
                  {blockLabel(block)}
                </span>
              </button>

              <div className="ml-auto flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move block ${index + 1} up`}
                  title="Move up"
                  className="cursor-pointer rounded p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === blocks.length - 1}
                  aria-label={`Move block ${index + 1} down`}
                  title="Move down"
                  className="cursor-pointer rounded p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>

                {onOpenInStudio && (
                  <button
                    type="button"
                    onClick={() => onOpenInStudio(block)}
                    aria-label={`Open block ${index + 1} in the Block Studio`}
                    title="Open this block in the Block Studio"
                    className="cursor-pointer rounded p-1 text-slate-400 transition-colors hover:bg-blue-100 hover:text-blue-600 dark:text-slate-500 dark:hover:bg-blue-500/20 dark:hover:text-blue-300"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Remove block ${index + 1}`}
                  title="Remove this block"
                  className="cursor-pointer rounded p-1 text-slate-400 transition-colors hover:bg-rose-100 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-500/20 dark:hover:text-rose-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {isOpen && (
              <div className="p-3">
                <BlockSchemaEditor
                  block={block}
                  onChange={(payload) => update(block.id, payload)}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
