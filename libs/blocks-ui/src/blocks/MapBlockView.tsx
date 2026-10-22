'use client';

import React from 'react';
import type { MapBlock } from '@ai-news/schemas';
import { buildMapConfig, MapRenderer } from '@ai-news/media';
import { MapCanvas } from './MapCanvas';

/**
 * A map.
 *
 * The map is drawn by a real map engine, on real tiles, with the story's
 * own layers, routes and marks on top of it. The reader can move it, zoom
 * it, turn it and tilt it.
 *
 * Where a map cannot be drawn — a browser without WebGL, a page printed to
 * paper, a reader with the pictures turned off — the block falls back to the
 * drawn map rather than showing an empty frame.
 */
export const MapBlockView: React.FC<{
  data: MapBlock['data'];
  theme?: 'dark' | 'light';
}> = ({ data, theme = 'light' }) => {
  const {
    title,
    mapType,
    center,
    zoom,
    style,
    projection,
    pitch,
    bearing,
    interactive,
    cluster,
    showControls,
    fitToMarkers,
    minZoom,
    maxZoom,
    markers,
    layers,
    routes,
    comparisonRegionIds,
    sourceAttribution,
    methodology,
    lastUpdated,
  } = data;

  const [fallback, setFallback] = React.useState<string | null>(null);

  const config = React.useMemo(
    () =>
      buildMapConfig(
        { title, mapType, center, zoom, style, markers, layers, routes } as MapBlock['data'],
        {
          interactive,
          showControls,
          projection,
          pitch,
          bearing,
          minZoom,
          maxZoom,
          cluster,
          fitToMarkers,
        }
      ),
    [
      title,
      mapType,
      center,
      zoom,
      style,
      markers,
      layers,
      routes,
      interactive,
      showControls,
      projection,
      pitch,
      bearing,
      minZoom,
      maxZoom,
      cluster,
      fitToMarkers,
    ]
  );

  const fallbackSvg = React.useMemo(
    () => (fallback ? MapRenderer.renderSvgFallback(data, 800, 420, theme) : ''),
    [fallback, data, theme]
  );

  /*
   * The marks and the bounds they make are kept as they are, so the map is
   * not rebuilt every time the block is drawn.
   */
  const drawnMarkers = React.useMemo(
    () => (cluster ? [] : config.markers),
    [cluster, config.markers]
  );
  const drawnBounds = React.useMemo(
    () => (fitToMarkers ? config.markers.map((marker) => marker.coordinates) : undefined),
    [fitToMarkers, config.markers]
  );

  return (
    <figure className="my-8 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      {title && (
        <figcaption className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
          {mapType && (
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {mapType === 'points'
                ? 'Points'
                : mapType === 'choropleth'
                  ? 'Choropleth'
                  : mapType === 'heatmap'
                    ? 'Heatmap'
                    : mapType === 'route'
                      ? 'Route'
                      : 'Comparison'}
            </p>
          )}
        </figcaption>
      )}

      {fallback ? (
        <div className="p-3">
          <div dangerouslySetInnerHTML={{ __html: fallbackSvg }} />
          <p className="px-2 py-2 text-[11px] text-slate-500 dark:text-slate-400">
            The interactive map could not be drawn here, so the map is shown as a picture.
          </p>
        </div>
      ) : (
        <MapCanvas
          config={config}
          layers={config.layers}
          markers={drawnMarkers}
          fitTo={drawnBounds}
          height={460}
          onFallback={setFallback}
        />
      )}

      {comparisonRegionIds && comparisonRegionIds.length > 0 && (
        <p className="px-5 pt-3 text-xs text-slate-600 dark:text-slate-400">
          Comparing: {comparisonRegionIds.join(', ')}
        </p>
      )}

      <footer className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
        <p>
          Basemap: {config.basemap.label}. {config.attribution}.
        </p>
        {sourceAttribution && <p>Source: {sourceAttribution}</p>}
        {methodology && <p>Methodology: {methodology}</p>}
        {lastUpdated && <p>Last updated: {lastUpdated}</p>}
      </footer>
    </figure>
  );
};
