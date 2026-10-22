'use client';

import React from 'react';
import { ChevronDown, ChevronRight, Plus, Search, X } from 'lucide-react';
import { BlockItem } from '@ai-news/blocks-ui';
import {
  blockOf,
  listStudioCategories,
  type StudioBlock,
  type StudioVariant,
} from '@ai-news/block-studio';
import { listBlockVariants } from '@ai-news/api-client';
import type { StoryBlock } from '@ai-news/schemas';

/**
 * Choosing a block.
 *
 * The newsroom can make every kind of block the platform supports, and
 * there are more than fifty of them. A list of their names is not a choice:
 * it asks the editor to already know what they want, in the platform's
 * words, before they can see any of it.
 *
 * So the picker shows the blocks. Each one is drawn — the same renderer the
 * article uses — so the editor sees what a block looks like before they
 * commit to it, and says what it is for underneath.
 */

/** A name an editor would use, rather than the platform's identifier. */
function humanise(type: string): string {
  const words = type.replace(/_/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** A colour per category, so the groups are told apart at a glance. */
const CATEGORY_TINT: Record<string, string> = {
  media: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
  data: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  interactive: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
  maps: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  text: 'bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200',
  context: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
  evidence: 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300',
  specialized: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300',
};

export interface BlockTypePickerProps {
  /** Called with the block that was chosen, ready to be added. */
  onPick: (block: StoryBlock) => void;
  onClose: () => void;
}
export function BlockTypePicker({ onPick, onClose }: BlockTypePickerProps) {
  const [query, setQuery] = React.useState('');
  const [openCategories, setOpenCategories] = React.useState<Record<string, boolean>>({});

  /**
   * The newsroom's own variants.
   *
   * A treatment one editor agreed on is offered to everybody, so the
   * composer and the Block Studio read the same list. When the newsroom
   * cannot be reached the picker still works — it just offers the samples
   * that ship with the platform.
   */
  const [savedVariants, setSavedVariants] = React.useState<Record<string, StudioVariant[]>>({});

  /**
   * The variant chosen for each block type.
   *
   * The first variant is the default; the editor can choose another before
   * the block is added.
   */
  const [chosenVariant, setChosenVariant] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const variants = await listBlockVariants();
        if (cancelled) return;

        const grouped: Record<string, StudioVariant[]> = {};
        for (const variant of variants) {
          const existing = grouped[variant.blockType] ?? [];
          existing.push({
            id: variant.id,
            label: variant.label,
            description: variant.description,
            data: variant.data,
          });
          grouped[variant.blockType] = existing;
        }
        setSavedVariants(grouped);
      } catch {
        // The newsroom could not be reached. The shipped samples are still
        // there, so the picker still works.
        if (!cancelled) setSavedVariants({});
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = React.useMemo(() => listStudioCategories(savedVariants), [savedVariants]);

  /*
   * The first category starts open — it is the one an editor is usually
   * reaching for — and the rest wait.
   */
  React.useEffect(() => {
    setOpenCategories((previous) =>
      Object.keys(previous).length > 0 ? previous : { [categories[0]?.category ?? '']: true }
    );
  }, [categories]);

  const visible = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) return categories;

    return categories
      .map((group) => ({
        ...group,
        blocks: group.blocks.filter(
          (block) =>
            block.type.toLowerCase().includes(needle) ||
            humanise(block.type).toLowerCase().includes(needle) ||
            block.description.toLowerCase().includes(needle)
        ),
      }))
      .filter((group) => group.blocks.length > 0);
  }, [categories, query]);

  const toggle = (category: string) =>
    setOpenCategories((previous) => ({ ...previous, [category]: !previous[category] }));

  const choose = (block: StudioBlock) => {
    const variantId = chosenVariant[block.type] ?? block.defaultVariantId;
    const variant = block.variants.find((candidate) => candidate.id === variantId);
    /*
     * The platform's block type is a strict union of every type it knows,
     * which is right for a stored block and awkward for one whose type is
     * chosen at runtime. `blockOf` is the same helper the Block Studio uses.
     */
    onPick(
      blockOf(
        block.type,
        `blk_${block.type}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        0,
        { data: (variant?.data ?? {}) as Record<string, unknown> }
      )
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 p-4 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add a block"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Add a block</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Every kind of block the platform can render. Each one is drawn as it will appear in
              the story.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close the block picker"
            className="shrink-0 cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-slate-200 px-5 py-3 dark:border-slate-800">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the blocks — a chart, a map, a timeline…"
              aria-label="Search the block catalog"
              autoFocus
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {visible.length === 0 && (
            <p className="py-10 text-center text-[13px] text-slate-500">
              No block matches “{query}”.
            </p>
          )}

          {visible.map((group, groupIndex) => {
            const isOpen = query.trim().length > 0 || openCategories[group.category] === true;
            const tint =
              CATEGORY_TINT[group.category] ??
              'bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200';

            return (
              <section key={group.category} className="mb-4 last:mb-0">
                <button
                  type="button"
                  onClick={() => toggle(group.category)}
                  aria-expanded={isOpen}
                  className="group flex w-full cursor-pointer items-center gap-2 rounded-lg py-1.5 pl-1 pr-2 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60"
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tint}`}
                  >
                    {group.label}
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-slate-400">
                    {group.blocks.length}
                  </span>
                </button>

                {isOpen && (
                  <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {group.blocks.map((block) => (
                      <BlockCard
                        key={block.type}
                        block={block}
                        chosenVariant={chosenVariant[block.type] ?? block.defaultVariantId}
                        onChooseVariant={(variantId) =>
                          setChosenVariant((previous) => ({
                            ...previous,
                            [block.type]: variantId,
                          }))
                        }
                        onChoose={choose}
                      />
                    ))}
                  </div>
                )}
                {groupIndex === visible.length - 1 && <div className="h-2" />}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * One block, drawn.
 *
 * The card shows the block rendered — the same renderer the article uses —
 * so the choice is made by looking rather than by guessing from a name.
 *
 * A block the newsroom has kept variants for offers them: the editor picks
 * the treatment before the block is added, so the story starts from the
 * house style rather than from a blank one.
 */
function BlockCard({
  block,
  chosenVariant,
  onChooseVariant,
  onChoose,
}: {
  block: StudioBlock;
  /** The variant the editor has chosen for this block type. */
  chosenVariant: string;
  onChooseVariant: (variantId: string) => void;
  onChoose: (block: StudioBlock) => void;
}) {
  const variant =
    block.variants.find((candidate) => candidate.id === chosenVariant) ??
    block.variants.find((candidate) => candidate.id === block.defaultVariantId);

  const preview = {
    id: `preview_${block.type}`,
    blockType: block.type,
    sortOrder: 0,
    data: (variant?.data ?? {}) as StoryBlock['data'],
  } as unknown as StoryBlock;
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-blue-500">
      <button
        type="button"
        onClick={() => onChoose(block)}
        className="flex cursor-pointer flex-col text-left focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      >
        <div className="relative h-28 w-full overflow-hidden border-b border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-700/60 dark:bg-slate-950/50">
          {/*
            The block is drawn at its natural size and cropped, so the card
            shows its shape without pretending to be the whole thing.
          */}
          <div className="pointer-events-none origin-top-left scale-[0.72] [&_*]:!pointer-events-none">
            <BlockItem block={preview} theme="light" storyId="story-picker" />
          </div>
          <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
            <Plus className="h-3.5 w-3.5" />
          </span>
        </div>

        <div className="flex-1 p-3">
          <p className="text-[13px] font-bold text-slate-900 dark:text-white">
            {humanise(block.type)}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
            {block.description}
          </p>
          <p className="mt-1.5 font-mono text-[10px] text-slate-400">{block.type}</p>
        </div>
      </button>

      {block.variants.length > 1 && (
        <div className="border-t border-slate-100 px-3 py-2 dark:border-slate-700/60">
          <label className="sr-only" htmlFor={`variant_${block.type}`}>
            Variant of {humanise(block.type)}
          </label>
          <select
            id={`variant_${block.type}`}
            value={chosenVariant}
            onChange={(event) => onChooseVariant(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            className="w-full rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] font-medium text-slate-600 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300"
          >
            {block.variants.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.label}
                {candidate.saved ? ' · newsroom' : ''}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
