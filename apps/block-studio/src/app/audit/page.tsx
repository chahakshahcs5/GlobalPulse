'use client';

import React from 'react';
import type { StoryBlock } from '@ai-news/schemas';
import { BlockItem } from '@ai-news/blocks-ui';
import { listStudioBlocks, CATEGORY_ORDER, CATEGORY_LABELS } from '@ai-news/block-studio';

/**
 * A visual audit of every block and every variant.
 *
 * The studio shows one block at a time, which is right for working on a
 * block and wrong for checking the whole catalogue. This page draws every
 * block type with every one of its variants, so a treatment that quietly
 * stopped being drawn can be seen rather than inferred.
 *
 * `?only=type,type` narrows it to particular block types.
 * `?cols=3` lays the variants of a block out side by side, which is how
 * two treatments of the same block are best compared.
 */

export default function AuditPage() {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
  const [onlyDifferent, setOnlyDifferent] = React.useState(false);
  const [filter, setFilter] = React.useState<string[]>([]);
  const [cols, setCols] = React.useState(1);
  const [mounted, setMounted] = React.useState(false);

  /*
   * The filter is read after the page has mounted.
   *
   * Read during the first render it would differ between the server and
   * the browser, and the page would be rendered twice — which is exactly
   * the noise this page exists to find.
   */
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const only = params.get('only');
    if (only)
      setFilter(
        only
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      );
    const columns = Number(params.get('cols'));
    if (columns > 0) setCols(columns);
    setMounted(true);
  }, []);

  if (!mounted) return <div className="p-6 text-sm">Loading…</div>;

  const blocks = listStudioBlocks().filter(
    (block) => filter.length === 0 || filter.includes(block.type)
  );

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white/95 px-6 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <h1 className="text-sm font-bold text-slate-900 dark:text-white">
          Block &amp; variant audit
        </h1>
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
          {blocks.length} types
        </span>
        <label className="ml-auto flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={onlyDifferent}
            onChange={(e) => setOnlyDifferent(e.target.checked)}
          />
          one variant per type
        </label>
        <button
          type="button"
          onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200"
        >
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
      </header>

      <main className="space-y-10 px-6 py-8">
        {CATEGORY_ORDER.map((category) => {
          const inCategory = blocks.filter((block) => block.category === category);
          if (inCategory.length === 0) return null;

          return (
            <section key={category} data-category={category}>
              <h2 className="mb-4 border-b border-slate-200 pb-2 text-lg font-black text-slate-900 dark:border-slate-800 dark:text-white">
                {CATEGORY_LABELS[category]}
                <span className="ml-2 font-mono text-xs font-normal text-slate-400">
                  {inCategory.length} types
                </span>
              </h2>

              <div className="space-y-8">
                {inCategory.map((block) => {
                  const variants = onlyDifferent ? block.variants.slice(0, 1) : block.variants;

                  return (
                    <div key={block.type} data-block={block.type}>
                      <div className="mb-2 flex flex-wrap items-baseline gap-2">
                        <span className="font-mono text-sm font-bold text-blue-700 dark:text-blue-400">
                          {block.type}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {block.description}
                        </span>
                      </div>

                      <div
                        className={cols > 1 ? 'grid gap-4' : 'space-y-4'}
                        style={
                          cols > 1
                            ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }
                            : undefined
                        }
                      >
                        {variants.map((variant) => {
                          const treatment =
                            (variant.data as Record<string, unknown>).layout ??
                            (variant.data as Record<string, unknown>).style;

                          return (
                            <div
                              key={variant.id}
                              data-variant={`${block.type}/${variant.id}`}
                              className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800"
                            >
                              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs dark:border-slate-800 dark:bg-slate-900">
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                  {variant.label}
                                </span>
                                <span className="font-mono text-slate-400">{variant.id}</span>
                                {treatment !== undefined && (
                                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400">
                                    {String(treatment)}
                                  </span>
                                )}
                              </div>
                              <div
                                data-render={`${block.type}/${variant.id}`}
                                className="bg-white px-5 py-4 dark:bg-slate-900/60"
                              >
                                <BlockItem
                                  block={
                                    {
                                      id: `audit_${block.type}_${variant.id}`,
                                      blockType: block.type,
                                      sortOrder: 0,
                                      data: variant.data,
                                    } as unknown as StoryBlock
                                  }
                                  theme={theme}
                                  storyId="studio-preview"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
