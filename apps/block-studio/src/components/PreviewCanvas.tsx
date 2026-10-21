'use client';

import React from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  Copy,
  FilePlus2,
  Monitor,
  Moon,
  Plus,
  Send,
  Smartphone,
  Tablet,
  Trash2,
} from 'lucide-react';
import type { StoryBlock } from '@ai-news/schemas';
import { BlockItem } from '@ai-news/blocks-ui';
import type { StudioBlock, StudioVariant } from '@ai-news/block-studio';
import { VariantNameDialog } from './VariantNameDialog';
import { SessionBadge } from './SessionBadge';
import { storyUrl, type StoryContext } from './story-context';
import type { StudioTheme, StudioViewport } from './StudioShell';

interface PreviewCanvasProps {
  block?: StudioBlock;
  variant?: StudioVariant;
  previewBlock: StoryBlock;
  theme: StudioTheme;
  viewport: StudioViewport;
  viewportWidth: string;
  isValid: boolean;
  /** The class that turns on the chrome's dark utilities. */
  darkClass: string;
  onThemeChange: (theme: StudioTheme) => void;
  onViewportChange: (viewport: StudioViewport) => void;
  onSelectVariant: (variantId: string) => void;
  onOpenLoader: () => void;
  onSaveVariant: (label: string) => void;
  onDeleteVariant: (variantId: string) => void;
  /** The story the studio is working in, when it was opened from one. */
  storyContext: StoryContext | null;
  /** True when the studio was opened by the story composer. */
  connectedToComposer: boolean;
  onSendToComposer: () => void;
  onImportToStory: () => void;
}

const VIEWPORTS: { id: StudioViewport; label: string; icon: React.ReactNode }[] = [
  { id: 'mobile', label: 'Mobile (390px)', icon: <Smartphone className="h-3.5 w-3.5" /> },
  { id: 'tablet', label: 'Tablet (768px)', icon: <Tablet className="h-3.5 w-3.5" /> },
  { id: 'desktop', label: 'Full width', icon: <Monitor className="h-3.5 w-3.5" /> },
];

/**
 * The preview.
 *
 * It renders the real block component, so a preview cannot drift from the
 * published article. The canvas is deliberately *not* nested inside the
 * studio's dark chrome: the blocks use a `dark:` variant, and a light
 * preview sitting under a `.dark` ancestor would still pick up the dark
 * styles.
 */
export function PreviewCanvas({
  block,
  variant,
  previewBlock,
  theme,
  viewport,
  viewportWidth,
  isValid,
  darkClass,
  onThemeChange,
  onViewportChange,
  onSelectVariant,
  onOpenLoader,
  onSaveVariant,
  onDeleteVariant,
  storyContext,
  connectedToComposer,
  onSendToComposer,
  onImportToStory,
}: PreviewCanvasProps) {
  const [copied, setCopied] = React.useState<'json' | 'block' | null>(null);
  /** The variant shown alongside the current one, when comparing. */
  const [compareWith, setCompareWith] = React.useState<string>('');
  /** Whether the "name this variant" dialog is open. */
  const [namingVariant, setNamingVariant] = React.useState(false);

  const compareVariant = React.useMemo(
    () => block?.variants.find((candidate) => candidate.id === compareWith) ?? null,
    [block, compareWith]
  );
  const isComparing = Boolean(compareVariant) && compareVariant?.id !== variant?.id;

  const copy = React.useCallback(
    async (what: 'json' | 'block') => {
      const text =
        what === 'json'
          ? JSON.stringify(previewBlock.data, null, 2)
          : JSON.stringify(
              {
                id: previewBlock.id,
                blockType: previewBlock.blockType,
                sortOrder: previewBlock.sortOrder,
                data: previewBlock.data,
              },
              null,
              2
            );
      try {
        await navigator.clipboard.writeText(text);
        setCopied(what);
        setTimeout(() => setCopied(null), 1600);
      } catch {
        // Clipboard access can be refused; the JSON tab still shows the payload.
      }
    },
    [previewBlock]
  );

  return (
    /*
     * The canvas background follows the chrome theme directly rather than
     * through the `dark` variant: the preview lives inside this element, and
     * a `dark` ancestor would force the blocks' dark styles on it.
     */
    <main
      className={`flex h-screen min-w-0 flex-col overflow-hidden ${
        darkClass ? 'bg-[#080c16]' : 'bg-slate-100'
      }`}
    >
      <header
        className={`flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-[#0d1220] ${darkClass}`}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-mono text-sm font-bold text-slate-900 dark:text-white">
              {block?.type ?? '—'}
            </h2>
            {block && (
              <span className="shrink-0 rounded bg-slate-200 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {block.category}
              </span>
            )}
            {!isValid && (
              <span className="shrink-0 rounded bg-rose-100 px-1.5 py-0.5 text-[11px] font-bold text-rose-700 ring-1 ring-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300">
                invalid payload
              </span>
            )}
          </div>
          {block && (
            <p className="mt-0.5 max-w-xl truncate text-[12px] text-slate-500">
              {block.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center rounded-lg border border-slate-300 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-900/60">
            {VIEWPORTS.map((option) => (
              <button
                key={option.id}
                type="button"
                title={option.label}
                aria-label={option.label}
                onClick={() => onViewportChange(option.id)}
                className={`rounded-md p-1.5 transition-colors ${
                  viewport === option.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {option.icon}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle the preview theme"
            className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 bg-slate-100 px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
          >
            {theme === 'dark' ? (
              <Moon className="h-3.5 w-3.5" />
            ) : (
              <Check className="h-3.5 w-3.5 text-amber-500" />
            )}
            Preview: {theme === 'dark' ? 'Dark' : 'Light'}
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenLoader}
              title="Open a block from a live story"
              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 bg-slate-100 px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
            >
              <BookOpen className="h-3.5 w-3.5" />
              From a story
            </button>

            {connectedToComposer && !storyContext && (
              <button
                type="button"
                onClick={onSendToComposer}
                title="Send this block to the story you are writing"
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-blue-600 px-2.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <Send className="h-3.5 w-3.5" />
                Send to story
              </button>
            )}

            {storyContext && (
              <button
                type="button"
                onClick={onImportToStory}
                title={`Import this block into “${storyContext.storyTitle}”`}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-[12px] font-semibold text-emerald-800 transition-colors hover:border-emerald-400 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300"
              >
                <FilePlus2 className="h-3.5 w-3.5" />
                {storyContext.blockId ? 'Save to story' : 'Add to story'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => copy('json')}
              title="Copy the block's data payload as JSON"
              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 bg-slate-100 px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
            >
              {copied === 'json' ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied === 'json' ? 'Copied' : 'Copy JSON'}
            </button>
            <button
              type="button"
              onClick={() => copy('block')}
              title="Copy the whole block — id, type, sort order and data — ready to paste into a story"
              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 bg-slate-100 px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
            >
              {copied === 'block' ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied === 'block' ? 'Copied' : 'Copy block'}
            </button>

            {/*
              The session sits at the end of the toolbar. It is the state
              of the editor rather than an action on the block, so it reads
              last — after the things you can do to the block itself.
            */}
            <SessionBadge darkClass={darkClass} />
          </div>
        </div>
      </header>

      {storyContext && (
        <div
          className={`flex flex-wrap items-center justify-between gap-3 border-b border-emerald-200 bg-emerald-50 px-4 py-2 dark:border-emerald-500/25 dark:bg-emerald-500/10 ${darkClass}`}
        >
          <div className="flex min-w-0 items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
            <span className="truncate text-[12px] font-semibold text-emerald-900 dark:text-emerald-200">
              {storyContext.storyTitle}
            </span>
            <span className="shrink-0 text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
              {storyContext.blockId
                ? 'editing a block in this story'
                : 'crafting a block for this story'}
            </span>
          </div>
          <a
            href={storyUrl(storyContext)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-emerald-800 underline underline-offset-2 hover:text-emerald-950 dark:text-emerald-300 dark:hover:text-emerald-100"
          >
            Open the story
            <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      )}

      {block && block.variants.length > 0 && (
        <div
          className={`flex items-center gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-800 dark:bg-[#0b101c] ${darkClass}`}
        >
          {block.variants.map((candidate) => {
            const isActive = candidate.id === variant?.id;
            const isLocal = candidate.id.startsWith('local_');
            return (
              <span key={candidate.id} className="group relative flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => onSelectVariant(candidate.id)}
                  title={candidate.description}
                  className={`rounded-md px-2.5 py-1 text-[12px] font-semibold transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:bg-slate-700/70 dark:hover:text-slate-200'
                  }`}
                >
                  {candidate.label}
                </button>
                {isLocal && (
                  <button
                    type="button"
                    onClick={() => onDeleteVariant(candidate.id)}
                    title="Remove this saved variant"
                    aria-label={`Remove the ${candidate.label} variant`}
                    className="ml-1 rounded p-0.5 text-slate-400 opacity-0 transition-opacity hover:text-rose-500 focus:opacity-100 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </span>
            );
          })}

          <button
            type="button"
            onClick={() => setNamingVariant(true)}
            title="Save the payload as it stands now as a new variant"
            className="ml-1 flex shrink-0 items-center gap-1 rounded-md border border-dashed border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-500 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-500 dark:hover:text-blue-300"
          >
            <Plus className="h-3 w-3" />
            Save as variant
          </button>

          {block && block.variants.length > 1 && (
            <div className="ml-auto flex shrink-0 items-center gap-1.5 pl-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Compare
              </span>
              <select
                value={compareWith}
                onChange={(event) => setCompareWith(event.target.value)}
                aria-label="Compare with another variant"
                className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-[11px] font-semibold text-slate-600 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300"
              >
                <option value="">Off</option>
                {block.variants
                  .filter((candidate) => candidate.id !== variant?.id)
                  .map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.label}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>
      )}

      {namingVariant && (
        <VariantNameDialog
          onCancel={() => setNamingVariant(false)}
          onSave={(label) => {
            onSaveVariant(label);
            setNamingVariant(false);
          }}
        />
      )}

      <div className="@container flex-1 overflow-auto p-6">
        {/*
          The preview is sized to the chosen viewport. When that is wider
          than the canvas, the canvas scrolls rather than shrinking the
          preview — otherwise a laptop viewport would be indistinguishable
          from a tablet one.

          A comparison splits into two columns when the canvas has room for
          them, not when the window does. The window is mostly taken by the
          catalog and the inspector, so a window-sized breakpoint would
          almost never fire and the comparison would always stack.
        */}
        <div
          className={`preview-surface mx-auto transition-[max-width] duration-200 ${
            isComparing ? 'max-w-none grid grid-cols-1 gap-4 @min-[34rem]:grid-cols-2' : ''
          }`}
          style={
            isComparing
              ? undefined
              : {
                  maxWidth: viewportWidth,
                  width: viewportWidth === '100%' ? '100%' : viewportWidth,
                }
          }
        >
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isComparing ? 'Editing' : (variant?.label ?? 'Preview')}
            </p>
            <div
              className={`min-h-[320px] rounded-xl border border-slate-200 ${
                theme === 'dark' ? 'dark bg-slate-900' : 'bg-white'
              } dark:border-slate-800`}
            >
              <div className="px-6 py-5 sm:px-8">
                <BlockItem block={previewBlock} theme={theme} storyId="studio-preview" />
              </div>
            </div>

            {variant?.description && (
              <p className="mt-3 text-center text-[12px] text-slate-500">{variant.description}</p>
            )}
          </div>

          {isComparing && compareVariant && (
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {compareVariant.label}
              </p>
              <div
                className={`min-h-[320px] rounded-xl border border-dashed border-slate-300 ${
                  theme === 'dark' ? 'dark bg-slate-900/60' : 'bg-slate-50'
                } dark:border-slate-700`}
              >
                <div className="px-6 py-5 sm:px-8">
                  <BlockItem
                    block={
                      {
                        id: 'studio_compare',
                        blockType: previewBlock.blockType,
                        sortOrder: 0,
                        data: compareVariant.data,
                      } as StoryBlock
                    }
                    theme={theme}
                    storyId="studio-preview"
                  />
                </div>
              </div>
              <p className="mt-3 text-center text-[12px] text-slate-500">
                {compareVariant.description ? `— ${compareVariant.description}` : '—'}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
