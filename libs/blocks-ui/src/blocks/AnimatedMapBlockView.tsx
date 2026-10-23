'use client';

import React from 'react';
import type { AnimatedMapBlock } from '@ai-news/schemas';
import { NUMBER_LOCALE, AnimatedMapRenderer, buildMapConfig } from '@ai-news/media';
import { MapCanvas } from './MapCanvas';

/**
 * Animated map.
 *
 * The reader scrubs through the frames, so the block shows how a situation
 * spread rather than only its end state. The frames are ordered by the
 * publisher; the scrubber is the reader's control.
 *
 * The map is a real one, so the places are where they are and the camera can
 * follow the situation as it moves. Where a map cannot be drawn, each frame
 * is drawn as a picture instead, so the block still shows what happened.
 */
export const AnimatedMapBlockView: React.FC<{
  data: AnimatedMapBlock['data'];
  theme?: 'dark' | 'light';
}> = ({ data, theme = 'light' }) => {
  /*
   * How the map is drawn.
   *
   * As a scrubber the reader drags, as a slideshow that plays on its
   * own, or as a single static frame. The frames are the same; only the
   * treatment changes.
   */
  const layout = data.layout ?? 'scrubber';
  const isStatic = layout === 'static';
  const isSlideshow = layout === 'slideshow';

  const [frameIndex, setFrameIndex] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [fallback, setFallback] = React.useState<string | null>(null);

  const frameCount = data.frames.length;
  const frameDurationMs = data.frameDurationMs ?? 1200;

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
    }, frameDurationMs);
    return () => clearInterval(timer);
  }, [isPlaying, frameCount, frameDurationMs]);

  // Autoplay starts once, when the block is first seen. A slideshow always
  // plays; the other treatments only do so if the block asks for it.
  const hasAutoplayed = React.useRef(false);
  React.useEffect(() => {
    if (hasAutoplayed.current) return;
    hasAutoplayed.current = true;
    if (data.autoplay || isSlideshow) setIsPlaying(true);
  }, [data.autoplay, isSlideshow]);

  const frame = data.frames[frameIndex];

  /*
   * The frame becomes a set of points the map draws.
   *
   * The value is kept on the point so the map can size it, and the highlight
   * so the place the story is about can be picked out.
   */
  const points = React.useMemo(
    () => ({
      type: 'FeatureCollection',
      features: frame.points.map((point) => ({
        type: 'Feature',
        properties: {
          value: point.value ?? 0,
          label: point.label ?? '',
          highlight: Boolean(point.highlight),
        },
        geometry: { type: 'Point', coordinates: [point.lng, point.lat] },
      })),
    }),
    [frame]
  );

  const config = React.useMemo(
    () =>
      buildMapConfig(
        {
          center: frame.points[0] ? [frame.points[0].lng, frame.points[0].lat] : [0, 20],
          zoom: 3,
          style: data.style,
        } as never,
        {
          showControls: data.showControls ?? true,
          projection: data.projection,
          pitch: data.pitch,
        }
      ),
    [frame, data.style, data.showControls, data.projection, data.pitch]
  );

  /*
   * The camera follows the situation, unless the block says it should not.
   *
   * It is fitted to the places in the frame, so a story that spreads shows
   * the spreading rather than a fixed view of one place.
   */
  const fitTo = React.useMemo(
    () =>
      data.flyToFrame
        ? frame.points.map((point) => [point.lng, point.lat] as [number, number])
        : undefined,
    [frame, data.flyToFrame]
  );

  const svg = React.useMemo(
    () =>
      fallback
        ? AnimatedMapRenderer.renderFrame(data, frameIndex, {
            theme,
            width: 800,
            height: 450,
          })
        : '',
    [fallback, data, frameIndex, theme]
  );

  const totalValue = frame.points.reduce((sum, point) => sum + (point.value ?? 0), 0);

  return (
    <section
      aria-label={data.title}
      className={[
        isStatic ? 'my-6' : 'my-8',
        isStatic ? 'rounded-xl' : 'rounded-2xl',
        'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden',
      ].join(' ')}
    >
      <header className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
        {data.description && (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{data.description}</p>
        )}
      </header>

      {fallback ? (
        <div className="p-3 sm:p-4">
          <div
            className="[&_svg]:w-full [&_svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <p className="px-2 py-2 text-[11px] text-slate-500 dark:text-slate-400">
            The interactive map could not be drawn here, so each frame is shown as a picture.
          </p>
        </div>
      ) : (
        <MapCanvas
          config={config}
          points={points}
          fitTo={fitTo}
          height={450}
          onFallback={setFallback}
        />
      )}

      <div className="px-5 pb-4">
        {/*
         * A static frame is a single frame: there is nothing to scrub and
         * nothing to play, so the controls are left out rather than shown
         * doing nothing.
         */}
        {!isStatic && (
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
        )}

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
          <span>
            {frame.label ?? frame.at}
            {data.valueLabel ? ` · ${data.valueLabel}` : ''}
          </span>
          <span className="font-mono">
            {frame.points.length} location{frame.points.length === 1 ? '' : 's'}
            {data.valueLabel && totalValue > 0
              ? ` · ${totalValue.toLocaleString(NUMBER_LOCALE)}${data.unit ? ` ${data.unit}` : ''}`
              : ''}
          </span>
        </div>
      </div>

      <footer className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
        <p>
          Basemap: {config.basemap.label}. {config.attribution}.
        </p>
        {data.methodology && <p>Methodology: {data.methodology}</p>}
        {data.sourceAttribution && <p>Source: {data.sourceAttribution}</p>}
      </footer>
    </section>
  );
};
