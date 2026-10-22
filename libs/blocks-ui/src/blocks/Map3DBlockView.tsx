'use client';

import React from 'react';
import type { Map3DBlock } from '@ai-news/schemas';
import {
  buildExtrusionSpecs,
  buildLayerSpecs,
  buildMapConfig,
  buildMarkerSpecs,
  TERRAIN_SOURCE,
} from '@ai-news/media';
import { MapCanvas } from './MapCanvas';

/**
 * A map in three dimensions.
 *
 * Three kinds of scene, which read very differently:
 *
 * - `terrain` — the land itself, raised and shaded, with the camera tilted
 *   so the height of a valley is obvious.
 * - `extruded` — the story's own shapes lifted off the map, which is how a
 *   skyline or a set of towers becomes a picture of a number.
 * - `globe` — the round earth, which is the right shape for a story about
 *   distance or anything that crosses a meridian.
 */
export const Map3DBlockView: React.FC<{
  data: Map3DBlock['data'];
  theme?: 'dark' | 'light';
}> = ({ data }) => {
  const {
    title,
    subtitle,
    caption,
    scene,
    style,
    center,
    zoom,
    pitch,
    bearing,
    terrainExaggeration,
    extrusions,
    layers,
    markers,
    interactive,
    showControls,
    sourceAttribution,
    methodology,
    lastUpdated,
  } = data;

  const [fallback, setFallback] = React.useState<string | null>(null);

  const resolvedScene = scene ?? 'terrain';

  const config = React.useMemo(
    () =>
      buildMapConfig(
        {
          center: center ?? [0, 20],
          zoom: zoom ?? 3,
          style,
          markers,
        } as never,
        {
          interactive,
          showControls,
          projection: resolvedScene === 'globe' ? 'globe' : 'mercator',
          pitch: pitch ?? (resolvedScene === 'globe' ? 0 : 55),
          bearing: bearing ?? 0,
        }
      ),
    [center, zoom, style, markers, interactive, showControls, resolvedScene, pitch, bearing]
  );

  const drawnLayers = React.useMemo(
    () => [...buildLayerSpecs(layers), ...buildExtrusionSpecs(extrusions)],
    [layers, extrusions]
  );

  const drawnMarkers = React.useMemo(() => buildMarkerSpecs(markers as never), [markers]);

  return (
    <figure className="my-8 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      {(title || subtitle) && (
        <figcaption className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          {title && (
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
          )}
          {subtitle && <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>}
        </figcaption>
      )}

      {fallback ? (
        <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
          This three-dimensional map could not be drawn here. {fallback}
        </div>
      ) : (
        <MapCanvas
          config={config}
          layers={drawnLayers}
          markers={drawnMarkers}
          terrainExaggeration={terrainExaggeration ?? 1.2}
          terrainSource={resolvedScene === 'terrain' ? TERRAIN_SOURCE : undefined}
          height={520}
          onFallback={setFallback}
        />
      )}

      {caption && <p className="px-5 pt-3 text-sm text-slate-600 dark:text-slate-400">{caption}</p>}

      <footer className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
        <p>
          Basemap: {config.basemap.label}. {config.attribution}.
          {resolvedScene === 'terrain' && ' Terrain © JAXA.'}
        </p>
        {sourceAttribution && <p>Source: {sourceAttribution}</p>}
        {methodology && <p>Methodology: {methodology}</p>}
        {lastUpdated && <p>Last updated: {lastUpdated}</p>}
      </footer>
    </figure>
  );
};
