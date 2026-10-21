'use client';

import React from 'react';
import type { StoryBlock } from '@ai-news/schemas';
import {
  getStudioBlock,
  listStudioCategories,
  searchStudioBlocks,
  validateBlockData,
} from '@ai-news/block-studio';
import { BlockSidebar } from './BlockSidebar';
import { PreviewCanvas } from './PreviewCanvas';
import { DataInspector } from './DataInspector';

export type StudioTheme = 'light' | 'dark';
export type StudioViewport = 'mobile' | 'tablet' | 'desktop';
export type InspectorTab = 'form' | 'json';

/** The studio chrome's own theme — separate from the preview's. */
export type ChromeTheme = 'light' | 'dark';

/**
 * The widths the preview can be shown at.
 *
 * The canvas column is narrower than a laptop screen, so a viewport wider
 * than the column scrolls rather than silently collapsing to the column's
 * width — otherwise "tablet" and "laptop" would look identical.
 */
const VIEWPORT_WIDTH: Record<StudioViewport, string> = {
  mobile: '390px',
  tablet: '768px',
  desktop: '100%',
};

const THEME_STORAGE_KEY = 'block_studio_theme';
const PREVIEW_THEME_STORAGE_KEY = 'block_studio_preview_theme';

function readStoredTheme(key: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function storeTheme(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private mode; the theme simply will not persist.
  }
}

function cloneData(data: Record<string, unknown>): Record<string, unknown> {
  return structuredClone(data);
}

/**
 * The Block Studio.
 *
 * A workbench for every block the platform can render: pick a type, pick a
 * variant, edit the payload, and watch the real renderer update as you type.
 * The preview uses the very same components the published article uses, so
 * what an editor sees here is what a reader sees there.
 */
export function StudioShell() {
  const [selectedType, setSelectedType] = React.useState<string>('chart');
  const [variantId, setVariantId] = React.useState<string>('line');
  const [data, setData] = React.useState<Record<string, unknown>>(() => {
    const block = getStudioBlock('chart');
    return block ? cloneData(block.variants[0].data) : {};
  });
  const [theme, setTheme] = React.useState<StudioTheme>('dark');
  const [viewport, setViewport] = React.useState<StudioViewport>('desktop');
  const [tab, setTab] = React.useState<InspectorTab>('form');
  const [query, setQuery] = React.useState('');
  const [chromeTheme, setChromeTheme] = React.useState<ChromeTheme>('dark');
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [inspectorOpen, setInspectorOpen] = React.useState(true);

  // The studio chrome and the preview each keep their own theme, and both
  // are remembered between visits.
  const [storedPreviewTheme, setStoredPreviewTheme] = React.useState<StudioTheme | null>(null);

  React.useEffect(() => {
    const stored = readStoredTheme(PREVIEW_THEME_STORAGE_KEY, 'dark');
    if (stored === 'light' || stored === 'dark') setTheme(stored);
    setStoredPreviewTheme('light');
  }, []);

  React.useEffect(() => {
    // Wait until the stored value has been read, so the first render does
    // not overwrite it with the default.
    if (!storedPreviewTheme) return;
    storeTheme(PREVIEW_THEME_STORAGE_KEY, theme);
  }, [theme, storedPreviewTheme]);

  const changePreviewTheme = React.useCallback((next: StudioTheme) => {
    setTheme(next);
    storeTheme(PREVIEW_THEME_STORAGE_KEY, next);
  }, []);

  // The chrome theme is applied to the document element, because the studio
  // chrome wraps the preview. It uses its own `studio-dark` class so it never
  // collides with the blocks' `dark` variant.
  const [chromeReady, setChromeReady] = React.useState(false);

  React.useEffect(() => {
    const stored = readStoredTheme(THEME_STORAGE_KEY, 'dark');
    setChromeTheme(stored === 'light' ? 'light' : 'dark');
    setChromeReady(true);
  }, []);

  React.useEffect(() => {
    // Wait until the stored value has been read, so the first render does
    // not overwrite the reader's choice with the default.
    if (!chromeReady) return;
    const root = document.documentElement;
    root.classList.toggle('studio-dark', chromeTheme === 'dark');
    storeTheme(THEME_STORAGE_KEY, chromeTheme);
  }, [chromeTheme, chromeReady]);

  const block = getStudioBlock(selectedType);
  const variant =
    block?.variants.find((candidate) => candidate.id === variantId) ?? block?.variants[0];

  const selectType = React.useCallback((type: string) => {
    const next = getStudioBlock(type);
    if (!next) return;
    setSelectedType(type);
    setVariantId(next.defaultVariantId);
    setData(cloneData(next.variants[0].data));
  }, []);

  const selectVariant = React.useCallback(
    (id: string) => {
      const next = block?.variants.find((candidate) => candidate.id === id);
      if (!next) return;
      setVariantId(id);
      setData(cloneData(next.data));
    },
    [block]
  );

  const reset = React.useCallback(() => {
    if (!variant) return;
    setData(cloneData(variant.data));
  }, [variant]);

  const updateData = React.useCallback((next: Record<string, unknown>) => {
    setData(next);
  }, []);

  const validation = React.useMemo(
    () => validateBlockData(selectedType, data),
    [selectedType, data]
  );

  const previewBlock = React.useMemo(
    () =>
      ({
        id: 'studio_preview',
        blockType: selectedType,
        sortOrder: 0,
        data,
      }) as unknown as StoryBlock,
    [selectedType, data]
  );

  const categories = React.useMemo(() => {
    if (query.trim().length === 0) return listStudioCategories();
    const matches = new Set(searchStudioBlocks(query).map((candidate) => candidate.type));
    return listStudioCategories()
      .map((group) => ({
        ...group,
        blocks: group.blocks.filter((candidate) => matches.has(candidate.type)),
      }))
      .filter((group) => group.blocks.length > 0);
  }, [query]);

  return (
    <div
      className="grid h-screen overflow-hidden bg-[#f8fafc] studio-dark:bg-[#080c16]"
      style={{
        /*
         * A collapsed pane keeps a narrow strip, so the button that brings
         * it back is always on screen — a pane collapsed to nothing would
         * take its own way back with it.
         */
        gridTemplateColumns: `${sidebarOpen ? '300px' : '44px'} minmax(0,1fr) ${
          inspectorOpen ? '420px' : '44px'
        }`,
      }}
    >
      <BlockSidebar
        categories={categories}
        selectedType={selectedType}
        query={query}
        chromeTheme={chromeTheme}
        open={sidebarOpen}
        onQueryChange={setQuery}
        onSelectType={selectType}
        onToggleChromeTheme={() =>
          setChromeTheme((current) => (current === 'dark' ? 'light' : 'dark'))
        }
        onToggleOpen={() => setSidebarOpen((current) => !current)}
      />

      <PreviewCanvas
        block={block}
        variant={variant}
        previewBlock={previewBlock}
        theme={theme}
        viewport={viewport}
        viewportWidth={VIEWPORT_WIDTH[viewport]}
        isValid={validation.ok}
        onThemeChange={changePreviewTheme}
        onViewportChange={setViewport}
        onSelectVariant={selectVariant}
      />

      <DataInspector
        blockType={selectedType}
        data={data}
        tab={tab}
        validation={validation}
        open={inspectorOpen}
        onTabChange={setTab}
        onChange={updateData}
        onReset={reset}
        onToggleOpen={() => setInspectorOpen((current) => !current)}
      />
    </div>
  );
}
