'use client';

import React from 'react';
import type { StoryBlock } from '@ai-news/schemas';
import {
  blockOf,
  getStudioBlock,
  listStudioBlocks,
  listStudioCategories,
  payloadOf,
  searchStudioBlocks,
  sendBlockToComposer,
  validateBlockPayload,
  withExtraVariants,
  type StudioPayload,
} from '@ai-news/block-studio';
import { BlockSidebar } from './BlockSidebar';
import { PreviewCanvas } from './PreviewCanvas';
import { DataInspector } from './DataInspector';
import { getStory, reorderBlocks } from '../lib/newsroom-api';
import { StoryBlockLoader, type BlockSource } from './StoryBlockLoader';
import { SaveToStoryDialog } from './SaveToStoryDialog';
import type { StoryContext } from './story-context';
import { useBlockVariants } from './useBlockVariants';

export type StudioTheme = 'light' | 'dark';
export type StudioViewport = 'mobile' | 'tablet' | 'desktop';
export type InspectorTab = 'form' | 'json';

/** The studio chrome's own theme — separate from the preview's. */
export type ChromeTheme = 'light' | 'dark';

/**
 * The widths the studio's own panels are opened at.
 *
 * They are capped as a share of the window, so that on a narrow screen the
 * panels give way instead of squeezing the canvas into nothing — and so that
 * the inspector can never be pushed off the edge of the window, where it
 * could not be reached.
 */
const SIDEBAR_WIDTH = 300;
const INSPECTOR_WIDTH = 420;
const COLLAPSED_WIDTH = 44;

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
  /*
   * The studio opens on the first block in the catalog — the same one the
   * sidebar lists first — rather than an arbitrary pick, so what you land on
   * is always what you see at the top of the list.
   */
  const initial = React.useMemo(() => {
    const first = listStudioCategories()[0]?.blocks[0];
    if (!first) return { type: '', variantId: '', payload: { data: {} } as StudioPayload };
    const variant = first.variants[0];
    return {
      type: first.type,
      variantId: variant.id,
      payload: { data: cloneData(variant.data) } as StudioPayload,
    };
  }, []);

  const [selectedType, setSelectedType] = React.useState<string>(initial.type);
  const [variantId, setVariantId] = React.useState<string>(initial.variantId);
  /**
   * The whole block, minus the platform's own bookkeeping.
   *
   * It is the content, how the block is presented, how it is described for
   * readers who cannot see it, where it came from and what it cites — so
   * that all of it can be edited, and none of it can be lost on the way
   * back to the story.
   */
  const [payload, setPayload] = React.useState<StudioPayload>(initial.payload);
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
   * been changed since. It starts as the payload itself, so nothing looks
   * edited until something actually is.
   */
  const [baseline, setBaseline] = React.useState<StudioPayload>(initial.payload);
  /** The story the studio is working in, when it was opened from one. */
  const [storyContext, setStoryContext] = React.useState<StoryContext | null>(null);
  /**
   * The composer session that opened the studio.
   *
   * A story being written does not exist on the server yet, so the block is
   * handed back to the composer through the browser rather than written
   * straight to the API.
   */
  const [composerSession, setComposerSession] = React.useState<string | null>(null);
  const [importing, setImporting] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);

  /**
   * Open the story the studio was sent to.
   *
   * The CMS links here with `?story=<id>&block=<id>`, so an editor can land
   * in the studio with the block they were working on already open, and go
   * back to the story afterwards.
   */
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const storyId = params.get('story');
    const session = params.get('draft');
    if (session) setComposerSession(session);
    if (!storyId) return;

    let cancelled = false;
    void (async () => {
      try {
        const story = await getStory(storyId);
        if (cancelled) return;

        const blockId = params.get('block') ?? undefined;
        setStoryContext({
          storyId: story.id,
          storyTitle: story.title,
          storySlug: story.slug,
          status: story.status,
          blocks: story.blocks ?? [],
          blockId,
        });

        if (blockId) {
          const block = (story.blocks ?? []).find((candidate) => candidate.id === blockId);
          if (block) {
            const loaded = payloadOf(block);
            setSelectedType(block.blockType);
            setPayload(loaded);
            setBaseline(loaded);
          }
        }
      } catch {
        // The story could not be read. The studio still works as a preview.
        setStoryContext(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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

  /**
   * Hand the block back to the composer that opened the studio.
   *
   * This is the path for a story that is still being written: it has no
   * server id yet, so the block travels through the browser and lands in the
   * composer's draft.
   */
  const sendToComposer = React.useCallback(() => {
    if (!composerSession) return;
    sendBlockToComposer(composerSession, {
      blockType: selectedType,
      payload,
      blockId: storyContext?.blockId,
    });
    setNotice('The block was sent to the story. Switch back to the composer to see it.');
    setTimeout(() => setNotice(null), 6000);
  }, [composerSession, payload, selectedType, storyContext?.blockId]);

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

  // The newsroom's saved variants, merged into the catalog.
  const {
    variants: savedVariants,
    saveVariant,
    removeVariant,
    source: variantSource,
    error: variantError,
  } = useBlockVariants();
  const studioBlocks = React.useMemo(
    () => withExtraVariants(listStudioBlocks(), savedVariants),
    [savedVariants]
  );

  /*
   * Say where the variants came from.
   *
   * A studio reading the browser's own variants is not the same as one
   * reading the newsroom's, and an editor should not have to guess which
   * one they are looking at.
   */
  React.useEffect(() => {
    if (!variantError) return;
    setNotice(variantError);
    const timer = setTimeout(() => setNotice(null), 8000);
    return () => clearTimeout(timer);
  }, [variantError]);

  const block = studioBlocks.find((candidate) => candidate.type === selectedType);
  const variant =
    block?.variants.find((candidate) => candidate.id === variantId) ?? block?.variants[0];

  const selectType = React.useCallback(
    (type: string) => {
      const next = studioBlocks.find((candidate) => candidate.type === type);
      if (!next) return;
      setSelectedType(type);
      setVariantId(next.defaultVariantId);
      const fresh: StudioPayload = { data: cloneData(next.variants[0].data) };
      setPayload(fresh);
      setBaseline(fresh);
    },
    [studioBlocks]
  );

  const selectVariant = React.useCallback(
    (id: string) => {
      const next = block?.variants.find((candidate) => candidate.id === id);
      if (!next) return;
      setVariantId(id);
      // A variant is a treatment of the content. What the block says about
      // itself — its accessibility text, its provenance — belongs to the
      // block, so it stays.
      setPayload((current) => ({ ...current, data: cloneData(next.data) }));
      setBaseline((current) => ({ ...current, data: cloneData(next.data) }));
    },
    [block]
  );

  /**
   * Keep the payload as it stands now, under a name of the editor's choosing.
   *
   * The variant goes to the newsroom, so that everybody editing a story is
   * offered the same treatment. When the newsroom cannot take it, the
   * studio says so rather than pretending it was shared.
   */
  const saveCurrentAsVariant = React.useCallback(
    async (label: string) => {
      const name = label.trim();
      if (!name) return;
      const id = `local_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;

      const saved = await saveVariant(selectedType, {
        id,
        label: name,
        description: 'Saved from the Block Studio.',
        data: cloneData(payload.data),
      });

      setVariantId(saved.id);

      if (!saved.shared) {
        setNotice(
          'The variant could not be saved to the newsroom, so it is only kept in this browser.'
        );
        setTimeout(() => setNotice(null), 8000);
      }
    },
    [payload, saveVariant, selectedType]
  );

  const deleteSavedVariant = React.useCallback(
    (id: string) => {
      void removeVariant(selectedType, id);
      const fallback = block?.variants.find((candidate) => candidate.id !== id);
      if (fallback) {
        setVariantId(fallback.id);
        setPayload((current) => ({ ...current, data: cloneData(fallback.data) }));
      }
    },
    [block, removeVariant, selectedType]
  );

  const reset = React.useCallback(() => {
    if (!variant) return;
    setPayload((current) => ({ ...current, data: cloneData(variant.data) }));
  }, [variant]);

  const updatePayload = React.useCallback((next: StudioPayload) => {
    setPayload(next);
  }, []);

  /**
   * Open a block that is already live in a story.
   *
   * The block type is switched to match, and the payload replaces whatever
   * was being edited — the variant is kept, so the studio still knows which
   * sample the editor started from.
   */
  const loadBlock = React.useCallback(
    (blockType: string, blockPayload: StudioPayload, from: BlockSource) => {
      if (!getStudioBlock(blockType)) return;
      setSelectedType(blockType);
      setPayload(blockPayload);
      setBaseline(blockPayload);
      // Picking a block from a story means the studio is working in that
      // story from now on, and the story's own blocks are shown alongside
      // the catalog.
      setStoryContext((current) =>
        current && current.storyId === from.story.id
          ? { ...current, blockId: from.blockId }
          : {
              storyId: from.story.id,
              storyTitle: from.story.title,
              storySlug: from.story.slug,
              status: from.story.status,
              blocks: from.story.blocks ?? [],
              blockId: from.blockId,
            }
      );
    },
    []
  );

  /**
   * Move to another block in the story the studio is working in.
   *
   * The block's own payload is what the editor sees, so the variant is left
   * alone: the studio is looking at a live block, not at a sample of a type.
   */
  const selectStoryBlock = React.useCallback((block: StoryBlock) => {
    if (!getStudioBlock(block.blockType)) return;
    const loaded = payloadOf(block);
    setSelectedType(block.blockType);
    setPayload(loaded);
    setBaseline(loaded);
    setStoryContext((current) => (current ? { ...current, blockId: block.id } : current));
  }, []);

  /**
   * Move a block up or down in the story.
   *
   * The order is the story's, so it is written to the API rather than kept
   * in the studio. The studio's list follows the platform's.
   */
  const moveStoryBlock = React.useCallback(
    async (blockId: string, delta: number) => {
      const context = storyContext;
      if (!context) return;

      const blocks = context.blocks ?? [];
      const index = blocks.findIndex((block) => block.id === blockId);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= blocks.length) return;

      const order = blocks.map((block) => block.id);
      const [moved] = order.splice(index, 1);
      order.splice(target, 0, moved);

      try {
        await reorderBlocks(context.storyId, order);
        setStoryContext({
          ...context,
          blocks: order.map((id, position) => {
            const block = blocks.find((candidate) => candidate.id === id);
            return block ? { ...block, sortOrder: position } : block;
          }) as StoryBlock[],
        });
      } catch (cause) {
        setNotice(
          cause instanceof Error
            ? `The story could not be reordered: ${cause.message}`
            : 'The story could not be reordered.'
        );
        setTimeout(() => setNotice(null), 6000);
      }
    },
    [storyContext]
  );

  const validation = React.useMemo(
    () => validateBlockPayload(selectedType, payload),
    [selectedType, payload]
  );

  const previewBlock = React.useMemo(
    () => blockOf(selectedType, 'studio_preview', 0, payload),
    [selectedType, payload]
  );

  const categories = React.useMemo(() => {
    if (query.trim().length === 0) return listStudioCategories(savedVariants);
    const matches = new Set(searchStudioBlocks(query).map((candidate) => candidate.type));
    return listStudioCategories(savedVariants)
      .map((group) => ({
        ...group,
        blocks: group.blocks.filter((candidate) => matches.has(candidate.type)),
      }))
      .filter((group) => group.blocks.length > 0);
  }, [query, savedVariants]);

  return (
    <div
      className="grid h-screen overflow-hidden bg-[#f8fafc] dark:bg-[#080c16]"
      style={{
        /*
         * A collapsed pane keeps a narrow strip, so the button that brings
         * it back is always on screen — a pane collapsed to nothing would
         * take its own way back with it.
         *
         * An open pane is capped as a share of the window. Without the cap,
         * the two panels together take more room than a narrow window has,
         * the canvas is squeezed to nothing, and the inspector is pushed off
         * the edge where it cannot be reached at all.
         */
        gridTemplateColumns: `${sidebarOpen ? `min(${SIDEBAR_WIDTH}px, 30vw)` : `${COLLAPSED_WIDTH}px`} minmax(0,1fr) ${
          inspectorOpen ? `min(${INSPECTOR_WIDTH}px, 34vw)` : `${COLLAPSED_WIDTH}px`
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
        storyContext={storyContext}
        activeBlockId={storyContext?.blockId}
        onSelectStoryBlock={selectStoryBlock}
        onMoveStoryBlock={moveStoryBlock}
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
        isValid={validation.ok}
        darkClass={chromeDarkClass}
        onThemeChange={changePreviewTheme}
        onViewportChange={setViewport}
        onSelectVariant={selectVariant}
        onOpenLoader={() => setLoaderOpen(true)}
        onSaveVariant={saveCurrentAsVariant}
        onDeleteVariant={deleteSavedVariant}
        variantSource={variantSource}
        storyContext={storyContext}
        connectedToComposer={Boolean(composerSession)}
        onSendToComposer={sendToComposer}
        onImportToStory={() => setImporting(true)}
      />

      <DataInspector
        blockType={selectedType}
        payload={payload}
        baseline={baseline}
        tab={tab}
        validation={validation}
        open={inspectorOpen}
        darkClass={chromeDarkClass}
        onTabChange={setTab}
        onChange={updatePayload}
        onReset={reset}
        onToggleOpen={() => setInspectorOpen((current) => !current)}
      />

      {loaderOpen && (
        <StoryBlockLoader
          onClose={() => setLoaderOpen(false)}
          onLoad={loadBlock}
          darkClass={chromeDarkClass}
        />
      )}

      {importing && storyContext && (
        <SaveToStoryDialog
          context={storyContext}
          blockType={selectedType}
          payload={payload}
          onClose={() => setImporting(false)}
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
