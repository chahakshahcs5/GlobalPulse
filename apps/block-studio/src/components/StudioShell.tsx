'use client';

import React from 'react';
import type { StoryBlock } from '@ai-news/schemas';
import {
  getStudioBlock,
  listStudioBlocks,
  listStudioCategories,
  searchStudioBlocks,
  validateBlockData,
  withExtraVariants,
} from '@ai-news/block-studio';
import { BlockSidebar } from './BlockSidebar';
import { PreviewCanvas } from './PreviewCanvas';
import { DataInspector } from './DataInspector';
import { StoryBlockLoader, type BlockSource } from './StoryBlockLoader';
import { SaveToStoryDialog } from './SaveToStoryDialog';
import { useLocalVariants } from './useLocalVariants';

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
  const [loaderOpen, setLoaderOpen] = React.useState(false);
  /**
   * The payload as it was when it was loaded, so the form can mark what has
   * been changed since.
   */
  const [baseline, setBaseline] = React.useState<Record<string, unknown>>({});
  /** Where the loaded block came from, so it can be saved back. */
  const [source, setSource] = React.useState<BlockSource | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);

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

  /*
   * The chrome theme is applied to the document element for the page-level
   * colours, and to the chrome panels themselves for their `dark:` utilities.
   * The preview surface carries its own `dark` class, so the two themes stay
   * independent.
   */
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
    root.classList.toggle('studio-shell-dark', chromeTheme === 'dark');
    storeTheme(THEME_STORAGE_KEY, chromeTheme);
  }, [chromeTheme, chromeReady]);

  /** The class the chrome panels carry so their `dark:` utilities apply. */
  const chromeDarkClass = chromeTheme === 'dark' ? 'dark' : '';

  // Variants the editor saved on their own machine, merged into the catalog.
  const { variants: localVariants, saveVariant, removeVariant } = useLocalVariants();
  const studioBlocks = React.useMemo(
    () => withExtraVariants(listStudioBlocks(), localVariants),
    [localVariants]
  );

  const block = studioBlocks.find((candidate) => candidate.type === selectedType);
  const variant =
    block?.variants.find((candidate) => candidate.id === variantId) ?? block?.variants[0];

  const selectType = React.useCallback(
    (type: string) => {
      const next = studioBlocks.find((candidate) => candidate.type === type);
      if (!next) return;
      setSelectedType(type);
      setVariantId(next.defaultVariantId);
      setData(cloneData(next.variants[0].data));
      setBaseline(cloneData(next.variants[0].data));
    },
    [studioBlocks]
  );

  const selectVariant = React.useCallback(
    (id: string) => {
      const next = block?.variants.find((candidate) => candidate.id === id);
      if (!next) return;
      setVariantId(id);
      setData(cloneData(next.data));
      setBaseline(cloneData(next.data));
    },
    [block]
  );

  /** Keep the payload as it stands now, under a name of the editor's choosing. */
  const saveCurrentAsVariant = React.useCallback(
    (label: string) => {
      const name = label.trim();
      if (!name) return;
      const id = `local_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
      saveVariant(selectedType, {
        id,
        label: name,
        description: 'Saved in this browser.',
        data: cloneData(data),
      });
      setVariantId(id);
    },
    [data, saveVariant, selectedType]
  );

  const deleteLocalVariant = React.useCallback(
    (id: string) => {
      removeVariant(selectedType, id);
      const fallback = block?.variants.find((candidate) => candidate.id !== id);
      if (fallback) {
        setVariantId(fallback.id);
        setData(cloneData(fallback.data));
      }
    },
    [block, removeVariant, selectedType]
  );

  const reset = React.useCallback(() => {
    if (!variant) return;
    setData(cloneData(variant.data));
  }, [variant]);

  const updateData = React.useCallback((next: Record<string, unknown>) => {
    setData(next);
  }, []);

  /**
   * Open a block that is already live in a story.
   *
   * The block type is switched to match, and the payload replaces whatever
   * was being edited — the variant is kept, so the studio still knows which
   * sample the editor started from.
   */
  const loadBlock = React.useCallback(
    (blockType: string, blockData: Record<string, unknown>, from: BlockSource) => {
      if (!getStudioBlock(blockType)) return;
      setSelectedType(blockType);
      setData(blockData);
      setBaseline(blockData);
      setSource(from);
    },
    []
  );

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
      className="grid h-screen overflow-hidden bg-[#f8fafc] dark:bg-[#080c16]"
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
        darkClass={chromeDarkClass}
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
        darkClass={chromeDarkClass}
        onThemeChange={changePreviewTheme}
        onViewportChange={setViewport}
        onSelectVariant={selectVariant}
        onOpenLoader={() => setLoaderOpen(true)}
        onSaveVariant={saveCurrentAsVariant}
        onDeleteVariant={deleteLocalVariant}
        source={source}
        onSaveToStory={() => setSaving(true)}
      />

      <DataInspector
        blockType={selectedType}
        data={data}
        baseline={baseline}
        tab={tab}
        validation={validation}
        open={inspectorOpen}
        darkClass={chromeDarkClass}
        onTabChange={setTab}
        onChange={updateData}
        onReset={reset}
        onToggleOpen={() => setInspectorOpen((current) => !current)}
      />

      {loaderOpen && <StoryBlockLoader onClose={() => setLoaderOpen(false)} onLoad={loadBlock} />}

      {saving && source && (
        <SaveToStoryDialog
          block={
            {
              id: source.blockId,
              blockType: selectedType,
              sortOrder: 0,
              data,
            } as StoryBlock
          }
          source={source}
          onClose={() => setSaving(false)}
          onSaved={(message) => {
            setNotice(message);
            setTimeout(() => setNotice(null), 6000);
          }}
        />
      )}

      {notice && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[12px] font-semibold text-emerald-800 shadow-lg dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
          {notice}
        </div>
      )}
    </div>
  );
}
