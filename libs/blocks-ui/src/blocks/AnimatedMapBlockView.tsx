'use client';

import React from 'react';
import type { AnimatedMapBlock } from '@ai-news/schemas';
import { AnimatedMapRenderer } from '@ai-news/media';

/**
 * Animated map.
 *
 * The reader scrubs through the frames, so the block shows how a situation
 * spread rather than only its end state. The frames are ordered by the
 * publisher; the scrubber is the reader's control.
 */
export const AnimatedMapBlockView: React.FC<{
  data: AnimatedMapBlock['data'];
  theme?: 'dark' | 'light';
}> = ({ data, theme = 'light' }) => {
  const [frameIndex, setFrameIndex] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);

  const frameCount = data.frames.length;

  // Autoplay advances through the frames and stops at the end.
  React.useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setFrameIndex((current) => {
        if (current >= frameCount - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1200);
    return () => clearInterval(timer);
  }, [isPlaying, frameCount]);

  // Autoplay starts once, when the block is first seen.
  const hasAutoplayed = React.useRef(false);
  React.useEffect(() => {
    if (hasAutoplayed.current) return;
    hasAutoplayed.current = true;
    if (data.autoplay) setIsPlaying(true);
  }, [data.autoplay]);

  const svg = React.useMemo(
    () =>
      AnimatedMapRenderer.renderFrame(data, frameIndex, {
        theme,
        width: 800,
        height: 450,
      }),
    [data, frameIndex, theme]
  );

  const frame = data.frames[frameIndex];
  const totalValue = frame.points.reduce((sum, point) => sum + (point.value ?? 0), 0);

  return (
    <section
      aria-label={data.title}
      className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden"
    >
      <header className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
        {data.description && (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{data.description}</p>
        )}
      </header>

      <div className="p-3 sm:p-4">
        <div className="[&_svg]:w-full [&_svg]:h-auto" dangerouslySetInnerHTML={{ __html: svg }} />
      </div>

      <div className="px-5 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (frameIndex >= frameCount - 1) setFrameIndex(0);
              setIsPlaying((playing) => !playing);
            }}
            aria-label={isPlaying ? 'Pause the animation' : 'Play the animation'}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition-colors hover:bg-indigo-500"
          >
            {isPlaying ? '❚❚' : '▶'}
          </button>

          <input
            type="range"
            min={0}
            max={frameCount - 1}
            step={1}
            value={frameIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setFrameIndex(Number(e.target.value));
            }}
            aria-label="Frame"
            aria-valuetext={frame.label ?? frame.at}
            className="w-full accent-indigo-600 dark:accent-indigo-400"
          />

          <span className="shrink-0 font-mono text-xs text-slate-500 dark:text-slate-400">
            {frameIndex + 1}/{frameCount}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
          <span>
            {frame.label ?? frame.at}
            {data.valueLabel ? ` · ${data.valueLabel}` : ''}
          </span>
          <span className="font-mono">
            {frame.points.length} location{frame.points.length === 1 ? '' : 's'}
            {data.valueLabel && totalValue > 0
              ? ` · ${totalValue.toLocaleString()}${data.unit ? ` ${data.unit}` : ''}`
              : ''}
          </span>
        </div>
      </div>

      <footer className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
        {data.methodology && <p>Methodology: {data.methodology}</p>}
        {data.sourceAttribution && <p>Source: {data.sourceAttribution}</p>}
      </footer>
    </section>
  );
};
