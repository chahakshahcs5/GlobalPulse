'use client';

import React from 'react';
import { ChevronDown, ChevronRight, ChevronUp, ExternalLink, Newspaper } from 'lucide-react';
import type { StoryBlock } from '@ai-news/schemas';
import type { StoryContext } from './story-context';
import { storyUrl } from './story-context';

/**
 * The story the studio is working in.
 *
 * The catalog answers "what kinds of block exist"; this answers "which
 * block am I looking at, and what else is in this story". Both belong in the
 * sidebar, because both are ways of choosing what to edit.
 */

/**
 * A readable name for a block.
 *
 * Blocks are stored as typed payloads, and each type names itself
 * differently — a heading has `text`, a chart has `title`, a poll has a
 * `question`. This looks for the first field that sounds like a heading, so
 * the list reads as a story outline rather than as a list of type names.
 */
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
    'subtitle',
  ];

  for (const key of candidates) {
    const value = data[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return block.blockType;
}

export interface StoryPanelProps {
  context: StoryContext | null;
  /** The block currently open in the studio. */
  activeBlockId?: string;
  onSelectBlock: (block: StoryBlock) => void;
  /** Moves a block up or down in the story. */
  onMoveBlock?: (blockId: string, delta: number) => void;
}

export function StoryPanel({
  context,
  activeBlockId,
  onSelectBlock,
  onMoveBlock,
}: StoryPanelProps) {
  /*
   * The panel is the first thing in the sidebar, so it starts open — the
   * editor arrived here because of a story, and the story is what they need
   * to see first. It collapses like any other section once it has been read.
   */
  const [open, setOpen] = React.useState(true);

  if (!context) return null;

  const blocks = context.blocks ?? [];

  return (
    <section className="border-b border-slate-200 dark:border-slate-800">
      <h2>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          className="flex w-full cursor-pointer items-start gap-2 px-4 py-2.5 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60"
        >
          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
            {open ? (
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <Newspaper className="h-3 w-3 shrink-0 text-slate-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Story
              </span>
              {context.status && (
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    context.status === 'PUBLISHED'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                  }`}
                >
                  {context.status}
                </span>
              )}
            </span>
            <span className="mt-0.5 block truncate text-[13px] font-semibold text-slate-800 dark:text-slate-100">
              {context.storyTitle}
            </span>
            <span className="mt-0.5 block font-mono text-[10px] tabular-nums text-slate-400">
              {blocks.length} block{blocks.length === 1 ? '' : 's'} in this story
            </span>
          </span>
        </button>
      </h2>

      {open && (
        <div className="max-h-[38vh] overflow-y-auto pb-2">
          {blocks.length === 0 && (
            <p className="px-4 py-2 text-[12px] text-slate-500">This story has no blocks yet.</p>
          )}

          <ul className="space-y-px px-2">
            {blocks.map((block, index) => {
              const isActive = block.id === activeBlockId;
              return (
                <li key={block.id}>
                  <button
                    type="button"
                    onClick={() => onSelectBlock(block)}
                    aria-current={isActive ? 'true' : undefined}
                    className={`flex w-full cursor-pointer items-start gap-2 rounded-md py-1.5 pl-2 pr-2 text-left transition-colors ${
                      isActive
                        ? 'bg-blue-50 ring-1 ring-blue-500/30 dark:bg-blue-600/20 dark:ring-blue-500/40'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <span className="mt-px shrink-0 font-mono text-[10px] tabular-nums text-slate-400">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate font-mono text-[11px] font-semibold ${
                          isActive
                            ? 'text-blue-700 dark:text-blue-200'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {block.blockType}
                      </span>
                      <span
                        className={`block truncate text-[12px] ${
                          isActive
                            ? 'text-blue-900 dark:text-blue-100'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {blockLabel(block)}
                      </span>
                    </span>
                  </button>

                  {onMoveBlock && (
                    <div className="ml-auto flex shrink-0 items-center gap-0.5 pl-1">
                      <button
                        type="button"
                        onClick={() => onMoveBlock(block.id, -1)}
                        disabled={index === 0}
                        aria-label={`Move ${block.blockType} ${index + 1} up`}
                        title="Move up"
                        className="cursor-pointer rounded p-0.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      >
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveBlock(block.id, 1)}
                        disabled={index === blocks.length - 1}
                        aria-label={`Move ${block.blockType} ${index + 1} down`}
                        title="Move down"
                        className="cursor-pointer rounded p-0.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="px-3 pt-1">
            <a
              href={storyUrl(context)}
              target="_blank"
              rel="noreferrer"
              className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-[12px] font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open the story in the portal
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
