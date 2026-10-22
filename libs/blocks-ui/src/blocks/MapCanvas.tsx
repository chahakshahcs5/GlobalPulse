'use client';

import React from 'react';
import type { MapConfig, LayerSpec, MarkerSpec } from '@ai-news/media';
import { buildRasterStyle } from '@ai-news/media';
import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * The map itself.
 *
 * MapLibre is a large library and a story without a map never needs it, so
 * it is loaded only when a map is on the page. Until it has loaded, and
 * whenever it cannot load at all, the caller is told so and can draw
 * something else.
 *
 * The map is built once and then kept: the things drawn on it are updated in
 * place, so a reader who has panned the map does not lose their view when a
 * value changes.
 */

export interface MapCanvasProps {
  config: MapConfig;
  /** The layers to draw over the basemap. */
  layers?: LayerSpec[];
  /** The marks to place on the map. */
  markers?: MarkerSpec[];
  /**
   * Points the map owns, which change as the block runs.
   *
   * The animated map hands the engine a new set of points for each frame,
   * and the engine redraws them without the map being rebuilt.
   */
  points?: Record<string, unknown>;
  /**
   * Where the camera should look.
   *
   * The map moves to these bounds when they change, which is how the
   * animated map follows a situation as it spreads.
   */
  fitTo?: Array<[number, number]>;
  /** How much the land is raised, when the scene has terrain. */
  terrainExaggeration?: number;
  /** The source of the terrain, when the scene has any. */
  terrainSource?: Record<string, unknown>;
  /** Called when the map has loaded and can be drawn on. */
  onReady?: (map: unknown) => void;
  /** Called when the map cannot be drawn, so the caller can fall back. */
  onFallback?: (reason: string) => void;
  /** The class name on the container, for the caller's own styling. */
  className?: string;
  /** The height of the map. */
  height?: number;
}

/** A marker's element, with its name beside it. */
function markerElement(marker: MarkerSpec): HTMLElement {
  const element = document.createElement('button');
  element.type = 'button';
  element.setAttribute('aria-label', marker.title);
  element.style.cssText = [
    'width:28px',
    'height:28px',
    'border-radius:50% 50% 50% 0',
    'transform:rotate(-45deg)',
    `background:${marker.color}`,
    'border:2px solid #ffffff',
    'box-shadow:0 2px 6px rgba(0,0,0,0.35)',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'cursor:pointer',
    'padding:0',
    'position:relative',
  ].join(';');

  const dot = document.createElement('span');
  dot.style.cssText = [
    'transform:rotate(45deg)',
    'width:8px',
    'height:8px',
    'border-radius:50%',
    'background:#ffffff',
  ].join(';');
  element.appendChild(dot);

  const label = document.createElement('span');
  label.textContent = marker.title;
  label.style.cssText = [
    'position:absolute',
    'left:30px',
    'top:6px',
    'transform:rotate(45deg)',
    'transform-origin:left center',
    'white-space:nowrap',
    'font:600 11px system-ui, sans-serif',
    'color:#0f172a',
    'background:rgba(255,255,255,0.92)',
    'border:1px solid rgba(0,0,0,0.12)',
    'border-radius:6px',
    'padding:2px 6px',
    'pointer-events:none',
  ].join(';');
  element.appendChild(label);

  return element;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({
  config,
  layers,
  markers,
  points,
  fitTo,
  terrainExaggeration,
  terrainSource,
  onReady,
  onFallback,
  className,
  height = 460,
}) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<import('maplibre-gl').Map | null>(null);
  const engineRef = React.useRef<typeof import('maplibre-gl') | null>(null);
  const markersRef = React.useRef<Array<{ remove: () => void }>>([]);
  const onReadyRef = React.useRef(onReady);
  const onFallbackRef = React.useRef(onFallback);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    onReadyRef.current = onReady;
    onFallbackRef.current = onFallback;
  }, [onReady, onFallback]);

  /**
   * The map is built from the settings that change what the map *is*, not
   * from the things drawn on it. The layers and the marks are updated in
   * place, so a reader who has moved the map does not lose their view.
   */
  const {
    styleUrl,
    basemap,
    center,
    zoom,
    pitch,
    bearing,
    minZoom,
    maxZoom,
    interactive,
    showControls,
    projection,
  } = config;

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    const start = async () => {
      let engine: typeof import('maplibre-gl');
      try {
        engine = await import('maplibre-gl');
      } catch {
        if (!cancelled) onFallbackRef.current?.('The map library could not be loaded.');
        return;
      }
      if (cancelled) return;
      engineRef.current = engine;

      // A browser without WebGL cannot draw a map at all.
      const supportsWebGl = (() => {
        try {
          const canvas = document.createElement('canvas');
          return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
        } catch {
          return false;
        }
      })();
      if (!supportsWebGl) {
        if (!cancelled) onFallbackRef.current?.('This browser cannot draw a map.');
        return;
      }

      const style = (styleUrl ?? buildRasterStyle(basemap)) as
        string | import('maplibre-gl').StyleSpecification;

      let map: import('maplibre-gl').Map;
      try {
        map = new engine.Map({
          container,
          style,
          center,
          zoom,
          pitch,
          bearing,
          minZoom,
          maxZoom,
          interactive,
          attributionControl: false,
          dragRotate: interactive,
          touchZoomRotate: interactive,
        });
      } catch {
        if (!cancelled) onFallbackRef.current?.('The map could not be started.');
        return;
      }

      mapRef.current = map;

      map.on('load', () => {
        if (cancelled) return;

        if (projection === 'globe' && basemap.globe) {
          try {
            map.setProjection({ type: 'globe' });
          } catch {
            // A basemap that cannot be a globe simply stays flat.
          }
        }

        if (showControls) {
          map.addControl(new engine.NavigationControl({ visualizePitch: true }), 'top-right');
          map.addControl(new engine.ScaleControl({ unit: 'metric' }), 'bottom-left');
          map.addControl(new engine.AttributionControl({ compact: true }), 'bottom-right');
        }

        setReady(true);
        onReadyRef.current?.(map);
      });

      map.on('error', (event: { error?: Error }) => {
        // A tile that will not load is not worth tearing the map down for.
        if (event?.error && /style|json|glyphs|sprite/i.test(event.error.message ?? '')) {
          onFallbackRef.current?.(event.error.message);
        }
      });
    };

    void start();

    return () => {
      cancelled = true;
      setReady(false);
      for (const marker of markersRef.current) marker.remove();
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
      engineRef.current = null;
    };
  }, [
    styleUrl,
    basemap,
    center,
    zoom,
    pitch,
    bearing,
    minZoom,
    maxZoom,
    interactive,
    showControls,
    projection,
  ]);

  /** The story's own layers, drawn over the basemap. */
  React.useEffect(() => {
    const map = mapRef.current;
    const engine = engineRef.current;
    if (!ready || !map || !engine || !layers) return;

    for (const layer of layers) {
      const sourceId = `${layer.id}-source`;
      try {
        if (map.getSource(sourceId)) {
          (map.getSource(sourceId) as { setData?: (data: unknown) => void }).setData?.(layer.data);
          continue;
        }
        map.addSource(sourceId, { type: 'geojson', data: layer.data as never });
        map.addLayer({
          id: layer.id,
          type: layer.type,
          source: sourceId,
          paint: layer.paint as never,
          layout: layer.layout as never,
        } as never);
      } catch {
        // A layer the engine will not take is left out rather than taking the
        // whole map with it.
      }
    }
  }, [ready, layers]);

  /** The points the block owns, which change as it runs. */
  React.useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !points) return;
    try {
      const source = map.getSource('block-points') as
        { setData?: (data: unknown) => void } | undefined;
      if (source) {
        source.setData?.(points);
        return;
      }
      map.addSource('block-points', { type: 'geojson', data: points as never });
      map.addLayer({
        id: 'block-points',
        type: 'circle',
        source: 'block-points',
        paint: {
          'circle-color': ['boolean', ['get', 'highlight'], '#ef4444', '#f59e0b'],
          'circle-radius': ['interpolate', ['linear'], ['get', 'value'], 0, 5, 100, 18],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.5,
          'circle-opacity': 0.9,
        },
      } as never);
    } catch {
      // The points are drawn by the fallback if the engine will not take
      // them.
    }
  }, [ready, points]);

  /** The land, raised. */
  React.useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !terrainSource) return;
    try {
      if (!map.getSource('terrain')) {
        map.addSource('terrain', terrainSource as never);
      }
      map.setTerrain({ source: 'terrain', exaggeration: terrainExaggeration ?? 1 });
    } catch {
      // Without a terrain source the scene is simply flat.
    }
  }, [ready, terrainSource, terrainExaggeration]);

  /** The marks, placed on the map. */
  React.useEffect(() => {
    const map = mapRef.current;
    const engine = engineRef.current;
    if (!ready || !map || !engine) return;

    for (const marker of markersRef.current) marker.remove();
    markersRef.current = [];

    for (const marker of markers ?? []) {
      const element = markerElement(marker);
      const popup = new engine.Popup({ offset: 26, closeButton: false }).setDOMContent(
        (() => {
          const wrapper = document.createElement('div');
          const heading = document.createElement('strong');
          heading.textContent = marker.title;
          wrapper.appendChild(heading);
          if (marker.description) {
            const body = document.createElement('p');
            body.textContent = marker.description;
            body.style.margin = '4px 0 0';
            wrapper.appendChild(body);
          }
          return wrapper;
        })()
      );

      const instance = new engine.Marker({ element, anchor: 'bottom' })
        .setLngLat(marker.coordinates)
        .setPopup(popup)
        .addTo(map);
      markersRef.current.push(instance);
    }
  }, [ready, markers]);

  /** A new place to look moves the camera there. */
  React.useEffect(() => {
    const map = mapRef.current;
    const engine = engineRef.current;
    if (!ready || !map || !engine || !fitTo || fitTo.length < 2) return;
    const box = new engine.LngLatBounds();
    for (const coordinate of fitTo) box.extend(coordinate);
    map.fitBounds(box, { padding: 60, maxZoom: 12, duration: 900 });
  }, [ready, fitTo]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height: `${height}px`, width: '100%' }}
      role="application"
      aria-label="Interactive map"
    />
  );
};
