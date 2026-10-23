'use client';

import { useState, useEffect } from 'react';
import { Maximize2, Moon, Sun, X, ZoomIn, ZoomOut } from 'lucide-react';
import type { StoryBlock } from '@ai-news/schemas';
import { BlockPreviewFrame } from './BlockPreviewFrame';
import type { StudioTheme } from './StudioShell';
import { useFocusTrap } from './useFocusTrap';

export interface FullscreenPreviewModalProps {
  block: StoryBlock;
  initialTheme: StudioTheme;
  label?: string;
  darkClass: string;
  onClose: () => void;
}

export function FullscreenPreviewModal({
  block,
  initialTheme,
  label,
  darkClass,
  onClose,
}: FullscreenPreviewModalProps) {
  const [theme, setTheme] = useState<StudioTheme>(initialTheme);
  const [zoom, setZoom] = useState<number>(100);
  const dialogRef = useFocusTrap<HTMLElement>(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleZoomIn = () => setZoom((z) => Math.min(200, z + 25));
  const handleZoomOut = () => setZoom((z) => Math.max(50, z - 25));
  const handleResetZoom = () => setZoom(100);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      {/* Header bar */}
      <header
        className={`flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-3 text-white ${darkClass}`}
      >
        <div className="flex items-center gap-3">
          <Maximize2 className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-bold tracking-tight">
            Fullscreen Inspection — {block.blockType}
          </span>
          {label && (
            <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300">
              {label}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2 py-1 text-xs">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              aria-label="Zoom out"
              className="rounded p-1 text-slate-400 hover:text-white disabled:opacity-30"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              title="Reset Zoom"
              className="px-1.5 font-mono text-[11px] font-semibold text-slate-300 hover:text-white"
            >
              {zoom}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              aria-label="Zoom in"
              className="rounded p-1 text-slate-400 hover:text-white disabled:opacity-30"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Theme switcher */}
          <button
            type="button"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} preview`}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
          >
            {theme === 'dark' ? (
              <Sun className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <Moon className="h-3.5 w-3.5 text-blue-400" />
            )}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Exit fullscreen"
            className="flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
          >
            <X className="h-4 w-4" />
            <span>Esc</span>
          </button>
        </div>
      </header>

      {/* Main expanded viewing canvas */}
      <main
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Fullscreen block inspection"
        className="flex-1 overflow-auto p-8 flex items-center justify-center"
      >
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 150ms cubic-bezier(0.16, 1, 0.3, 1)',
            width: '100%',
            maxWidth: '1200px',
          }}
          className="mx-auto"
        >
          <div className="rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50">
            <BlockPreviewFrame
              block={block}
              theme={theme}
              width={1100}
              label={`${block.blockType} Fullscreen`}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
