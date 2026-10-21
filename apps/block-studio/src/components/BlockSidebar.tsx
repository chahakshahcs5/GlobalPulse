'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Moon, PanelLeft, Search, Sun } from 'lucide-react';
import type { StudioCategoryGroup } from '@ai-news/block-studio';
import type { ChromeTheme } from './StudioShell';

interface BlockSidebarProps {
  categories: StudioCategoryGroup[];
  selectedType: string;
  query: string;
  chromeTheme: ChromeTheme;
  open: boolean;
  onQueryChange: (query: string) => void;
  onSelectType: (type: string) => void;
  onToggleChromeTheme: () => void;
  onToggleOpen: () => void;
}

/**
 * One category of block types.
 *
 * The catalog is long, so each category collapses to its heading. The first
 * category starts open — it is the one an editor is usually reaching for —
 * and the rest start closed.
 */
function CategoryGroup({
  group,
  isOpen,
  onToggle,
  selectedType,
  onSelectType,
}: {
  group: StudioCategoryGroup;
  isOpen: boolean;
  onToggle: () => void;
  selectedType: string;
  onSelectType: (type: string) => void;
}) {
  return (
    <section className="mb-2">
      <h2>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          className="group flex w-full items-center gap-2 rounded-md py-1.5 pl-1.5 pr-2 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 studio-dark:hover:bg-slate-800/60 studio-dark:hover:text-slate-300"
        >
          <span className="flex h-4 w-4 shrink-0 items-center justify-center">
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </span>
          <span className="flex-1 truncate">{group.label}</span>
          {/*
            Both counts are plain numbers on the same right edge, so their
            digits line up. A chip around one of them and not the other
            would inset its digit and break the column.
          */}
          <span className="shrink-0 font-mono text-[11px] font-normal normal-case tabular-nums text-slate-400">
            {group.blocks.length}
          </span>
        </button>
      </h2>

      {isOpen && (
        <ul className="mt-0.5 space-y-px">
          {group.blocks.map((block) => {
            const isSelected = block.type === selectedType;
            return (
              <li key={block.type}>
                <button
                  type="button"
                  onClick={() => onSelectType(block.type)}
                  aria-current={isSelected ? 'true' : undefined}
                  className={`flex w-full items-center justify-between gap-2 rounded-md py-1.5 pl-[30px] pr-2 text-left text-[13px] transition-colors ${
                    isSelected
                      ? 'bg-blue-50 font-semibold text-blue-700 ring-1 ring-blue-500/30 studio-dark:bg-blue-600/20 studio-dark:text-blue-200 studio-dark:ring-blue-500/40'
                      : 'text-slate-600 hover:bg-slate-100 studio-dark:text-slate-300 studio-dark:hover:bg-slate-800/70'
                  }`}
                >
                  <span className="truncate font-mono">{block.type}</span>
                  {block.variants.length > 1 && (
                    <span
                      title={`${block.variants.length} variants`}
                      className="shrink-0 font-mono text-[11px] tabular-nums text-slate-400"
                    >
                      {block.variants.length}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/**
 * The catalog.
 *
 * Every registered block type, grouped by the registry's own categories, so
 * the sidebar cannot drift from what the platform actually supports.
 */
export function BlockSidebar({
  categories,
  selectedType,
  query,
  chromeTheme,
  open,
  onQueryChange,
  onSelectType,
  onToggleChromeTheme,
  onToggleOpen,
}: BlockSidebarProps) {
  const total = categories.reduce((count, group) => count + group.blocks.length, 0);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const isGroupOpen = (category: string, index: number) => openGroups[category] ?? index === 0;

  const toggleGroup = (category: string, index: number) =>
    setOpenGroups((previous) => ({ ...previous, [category]: !isGroupOpen(category, index) }));

  if (!open) {
    return (
      <aside className="flex h-screen w-11 flex-col items-center gap-2 overflow-hidden border-r border-slate-200 bg-white py-3 studio-dark:border-slate-800 studio-dark:bg-[#0d1220]">
        <button
          type="button"
          onClick={onToggleOpen}
          title="Show the block catalog"
          aria-label="Show the block catalog"
          className="rounded-md border border-slate-300 p-1.5 text-slate-500 transition-colors hover:text-slate-800 studio-dark:border-slate-700 studio-dark:text-slate-400"
        >
          <PanelLeft className="h-3.5 w-3.5" />
        </button>
        <span
          className="text-[11px] font-bold uppercase tracking-wider text-slate-400"
          style={{ writingMode: 'vertical-rl' }}
        >
          Catalog
        </span>
      </aside>
    );
  }

  return (
    <aside className="flex h-screen flex-col overflow-hidden border-r border-slate-200 bg-white studio-dark:border-slate-800 studio-dark:bg-[#0d1220]">
      <div className="border-b border-slate-200 px-4 py-3.5 studio-dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-600 text-[12px] font-black text-white">
            B
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold text-slate-900 studio-dark:text-white">
              Block Studio
            </h1>
            <p className="truncate text-[11px] text-slate-500">
              {total} block type{total === 1 ? '' : 's'} in view
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleOpen}
            title="Hide the block catalog"
            aria-label="Hide the block catalog"
            className="shrink-0 rounded-md border border-slate-300 p-1.5 text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-800 studio-dark:border-slate-700 studio-dark:text-slate-400 studio-dark:hover:text-slate-100"
          >
            <PanelLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onToggleChromeTheme}
            title={
              chromeTheme === 'dark' ? 'Switch to the light studio' : 'Switch to the dark studio'
            }
            aria-label="Toggle the studio theme"
            className="shrink-0 rounded-md border border-slate-300 p-1.5 text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-800 studio-dark:border-slate-700 studio-dark:text-slate-400 studio-dark:hover:text-slate-100"
          >
            {chromeTheme === 'dark' ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search blocks…"
            aria-label="Search block types"
            className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none studio-dark:border-slate-700 studio-dark:bg-slate-900/80 studio-dark:text-slate-200 studio-dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {categories.length === 0 && (
          <p className="px-2 py-6 text-center text-[13px] text-slate-500">
            No block type matches “{query}”.
          </p>
        )}

        {categories.map((group, index) => (
          <CategoryGroup
            key={group.category}
            group={group}
            isOpen={isGroupOpen(group.category, index)}
            onToggle={() => toggleGroup(group.category, index)}
            selectedType={selectedType}
            onSelectType={onSelectType}
          />
        ))}
      </nav>
    </aside>
  );
}
