'use client';

import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ExternalLink,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import type { StoryBlock } from '@ai-news/schemas';
import { blockOf, listStudioCategories, type StudioPayload } from '@ai-news/block-studio';
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
  const [query, setQuery] = useState('');

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

  const update = (id: string, payload: StudioPayload) => {
    const changed = blocks.find((block) => block.id === id);
    if (!changed) return;
    // The whole block is replaced, so the presentation, the accessibility
    // text, the provenance and the citations travel with the content.
    const updated = blockOf(changed.blockType, changed.id, changed.sortOrder, payload);
    onChange(blocks.map((block) => (block.id === id ? updated : block)) as StoryBlock[], {
      kind: 'edited',
      block: updated,
    });
  };

  const categories = useMemo(() => listStudioCategories(), []);

  const visibleCategories = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) return categories;
    return categories
      .map((group) => ({
        ...group,
        blocks: group.blocks.filter(
          (block) =>
            block.type.toLowerCase().includes(needle) ||
            block.description.toLowerCase().includes(needle) ||
            group.label.toLowerCase().includes(needle)
        ),
      }))
      .filter((group) => group.blocks.length > 0);
  }, [categories, query]);

  const addBlock = (type: string) => {
    const group = categories.find((candidate) =>
      candidate.blocks.some((block) => block.type === type)
    );
    const definition = group?.blocks.find((block) => block.type === type);
    const sample = definition?.variants.find(
      (variant) => variant.id === definition.defaultVariantId
    );

    const id = `blk_${type}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

    /*
     * The platform's block type is a strict union of every type it knows,
     * which is right for a stored block and awkward for one whose type is
     * chosen at runtime. The cast is the same one the Block Studio makes.
     */
    const block = {
      id,
      blockType: type,
      sortOrder: blocks.length,
      data: (sample?.data ?? {}) as StoryBlock['data'],
    } as unknown as StoryBlock;

    onChange([...blocks, block], { kind: 'added', block });
    setExpanded((previous) => ({ ...previous, [id]: true }));
    setPickerOpen(false);
    setQuery('');
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
          onClick={() => setPickerOpen((current) => !current)}
          className="flex cursor-pointer items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Add a block
        </button>
      </div>

      {pickerOpen && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the block catalog…"
              aria-label="Search block types"
              className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-2 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="mt-2.5 max-h-64 space-y-2 overflow-y-auto pr-1">
            {visibleCategories.map((group) => (
              <div key={group.category}>
                <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.blocks.map((block) => (
                    <button
                      key={block.type}
                      type="button"
                      onClick={() => addBlock(block.type)}
                      title={block.description}
                      className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono text-[11px] font-semibold text-slate-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:bg-blue-500/10 dark:hover:text-blue-200"
                    >
                      + {block.type}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {visibleCategories.length === 0 && (
              <p className="px-1 py-3 text-[12px] text-slate-500">
                No block type matches “{query}”.
              </p>
            )}
          </div>
        </div>
      )}

      {blocks.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center dark:border-slate-700">
          <p className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">
            This story has no blocks yet.
          </p>
          <p className="mx-auto mt-1 max-w-sm text-[12px] text-slate-500">
            A story is made of blocks — a headline, a lead, a chart, a pull quote. Add the first
            one, or build it in the Block Studio and send it here.
          </p>
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
