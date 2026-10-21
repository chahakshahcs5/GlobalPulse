'use client';

import React from 'react';
import { Check, Copy, Monitor, Moon, Smartphone, Tablet } from 'lucide-react';
import type { StoryBlock } from '@ai-news/schemas';
import { BlockItem } from '@ai-news/blocks-ui';
import type { StudioBlock, StudioVariant } from '@ai-news/block-studio';
import type { StudioTheme, StudioViewport } from './StudioShell';

interface PreviewCanvasProps {
  block?: StudioBlock;
  variant?: StudioVariant;
  previewBlock: StoryBlock;
  theme: StudioTheme;
  viewport: StudioViewport;
  viewportWidth: string;
  isValid: boolean;
  onThemeChange: (theme: StudioTheme) => void;
  onViewportChange: (viewport: StudioViewport) => void;
  onSelectVariant: (variantId: string) => void;
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
  onThemeChange,
  onViewportChange,
  onSelectVariant,
}: PreviewCanvasProps) {
  const [copied, setCopied] = React.useState<'json' | 'block' | null>(null);

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
    <main className="flex h-screen min-w-0 flex-col overflow-hidden bg-slate-100 studio-dark:bg-[#080c16]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5 studio-dark:border-slate-800 studio-dark:bg-[#0d1220]">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-mono text-sm font-bold text-slate-900 studio-dark:text-white">
              {block?.type ?? '—'}
            </h2>
            {block && (
              <span className="shrink-0 rounded bg-slate-200 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 studio-dark:bg-slate-800 studio-dark:text-slate-400">
                {block.category}
              </span>
            )}
            {!isValid && (
              <span className="shrink-0 rounded bg-rose-100 px-1.5 py-0.5 text-[11px] font-bold text-rose-700 ring-1 ring-rose-500/30 studio-dark:bg-rose-500/15 studio-dark:text-rose-300">
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
          <div className="flex items-center rounded-lg border border-slate-300 bg-slate-100 p-0.5 studio-dark:border-slate-700 studio-dark:bg-slate-900/60">
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
                    : 'text-slate-500 hover:bg-slate-200 hover:text-slate-800 studio-dark:text-slate-400 studio-dark:hover:bg-slate-800 studio-dark:hover:text-slate-200'
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
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-100 px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 studio-dark:border-slate-700 studio-dark:bg-slate-900/60 studio-dark:text-slate-300 studio-dark:hover:border-slate-600 studio-dark:hover:text-white"
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
              onClick={() => copy('json')}
              title="Copy the block's data payload as JSON"
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-100 px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 studio-dark:border-slate-700 studio-dark:bg-slate-900/60 studio-dark:text-slate-300 studio-dark:hover:border-slate-600 studio-dark:hover:text-white"
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
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-100 px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 studio-dark:border-slate-700 studio-dark:bg-slate-900/60 studio-dark:text-slate-300 studio-dark:hover:border-slate-600 studio-dark:hover:text-white"
            >
              {copied === 'block' ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied === 'block' ? 'Copied' : 'Copy block'}
            </button>
          </div>
        </div>
      </header>

      {block && block.variants.length > 0 && (
        <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 px-4 py-2 studio-dark:border-slate-800 studio-dark:bg-[#0b101c]">
          {block.variants.map((candidate) => {
            const isActive = candidate.id === variant?.id;
            return (
              <button
                key={candidate.id}
                type="button"
                onClick={() => onSelectVariant(candidate.id)}
                title={candidate.description}
                className={`shrink-0 rounded-md px-2.5 py-1 text-[12px] font-semibold transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300 studio-dark:bg-slate-800/60 studio-dark:text-slate-400 studio-dark:hover:bg-slate-700/70 studio-dark:hover:text-slate-200'
                }`}
              >
                {candidate.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex-1 overflow-auto p-6">
        {/*
          The preview is sized to the chosen viewport. When that is wider
          than the canvas, the canvas scrolls rather than shrinking the
          preview — otherwise a laptop viewport would be indistinguishable
          from a tablet one.
        */}
        <div
          className="preview-surface mx-auto transition-[max-width] duration-200"
          style={{
            maxWidth: viewportWidth,
            width: viewportWidth === '100%' ? '100%' : viewportWidth,
          }}
        >
          <div
            className={`min-h-[320px] rounded-xl border border-slate-200 ${
              theme === 'dark' ? 'dark bg-slate-900' : 'bg-white'
            } studio-dark:border-slate-800`}
          >
            <div className="px-6 py-5 sm:px-8">
              <BlockItem block={previewBlock} theme={theme} storyId="studio-preview" />
            </div>
          </div>

          {variant?.description && (
            <p className="mt-3 text-center text-[12px] text-slate-500">{variant.description}</p>
          )}
        </div>
      </div>
    </main>
  );
}
