import type { MapBlock } from '@ai-news/schemas';
import { resolveBasemap, type BasemapDefinition } from './map-style';

/**
 * Turning a map block into something a map engine can draw.
 *
 * All of this is arithmetic and data-shaping, with no map engine involved,
 * so it can be tested without a browser. The view draws what this builds.
 */

/** The colours a marker's severity gives it. */
const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  severe: '#f97316',
  high: '#f59e0b',
  medium: '#eab308',
  low: '#10b981',
  resolved: '#64748b',
  info: '#3b82f6',
};

/** The colour a marker of a given severity is drawn in. */
export function severityColor(severity: string | undefined): string {
  if (!severity) return '#3b82f6';
  return SEVERITY_COLORS[severity.toLowerCase()] ?? '#3b82f6';
}

export interface MarkerSpec {
  id: string;
  coordinates: [number, number];
  title: string;
  description?: string;
  /** The name of an icon, drawn inside the marker. */
  icon?: string;
  /** The colour the marker is drawn in. */
  color: string;
  entityIds: string[];
  sourceIds: string[];
}

/** A marker the map can draw. */
export function buildMarkerSpecs(markers: MapBlock['data']['markers'] | undefined): MarkerSpec[] {
  if (!Array.isArray(markers)) return [];
  return markers
    .map((marker, index) => ({
      id: `${marker.title}-${index}`,
      coordinates: marker.coordinates,
      title: marker.title,
      description: marker.description,
      icon: marker.icon,
      color: severityColor(marker.severity),
      entityIds: marker.entityIds ?? [],
      sourceIds: marker.sourceIds ?? [],
    }))
    .filter(
      (marker) =>
        Array.isArray(marker.coordinates) &&
        marker.coordinates.length >= 2 &&
        Number.isFinite(marker.coordinates[0]) &&
        Number.isFinite(marker.coordinates[1])
    );
}

export interface LayerSpec {
  id: string;
  type: 'fill' | 'line' | 'circle' | 'heatmap' | 'fill-extrusion';
  /** The GeoJSON the layer is drawn from. */
  data: Record<string, unknown>;
  paint: Record<string, unknown>;
  layout: Record<string, unknown>;
}

/** The values a GeoJSON property takes, so a scale can be drawn across them. */
function propertyRange(
  geojson: Record<string, unknown>,
  property: string | undefined
): { min: number; max: number } {
  if (!property) return { min: 0, max: 1 };
  const features =
    (geojson as { features?: Array<{ properties?: Record<string, unknown> }> }).features ?? [];
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const feature of features) {
    const value = Number(feature.properties?.[property]);
    if (!Number.isFinite(value)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 1 };
  if (min === max) return { min, max: min + 1 };
  return { min, max };
}

/**
 * The expression that colours a feature by one of its properties.
 *
 * The scale is a list of colours, and the value is placed across it, so a
 * three-colour scale goes green, amber, red as the number rises.
 */
export function colorScaleExpression(
  scale: string[] | undefined,
  property: string | undefined,
  min: number,
  max: number
): unknown {
  const colors = scale && scale.length > 0 ? scale : ['#3b82f6', '#1d4ed8'];
  if (!property) return colors[0];

  const stops: unknown[] = ['interpolate', ['linear'], ['get', property]];
  for (let index = 0; index < colors.length; index++) {
    const fraction = colors.length === 1 ? 0 : index / (colors.length - 1);
    stops.push(min + (max - min) * fraction, colors[index]);
  }
  return stops;
}

/** The layers the block asks for, ready for a map engine to draw. */
export function buildLayerSpecs(layers: MapBlock['data']['layers'] | undefined): LayerSpec[] {
  if (!Array.isArray(layers)) return [];

  return layers.map((layer) => {
    const geojson = layer.geojson ?? {};
    const { min, max } = propertyRange(geojson, layer.property);
    const color = colorScaleExpression(layer.colorScale, layer.property, min, max);

    if (layer.type === 'fill') {
      return {
        id: layer.id,
        type: 'fill',
        data: geojson,
        paint: {
          'fill-color': color,
          'fill-opacity': 0.45,
          'fill-outline-color': '#0f172a',
        },
        layout: {},
      };
    }

    if (layer.type === 'line') {
      return {
        id: layer.id,
        type: 'line',
        data: geojson,
        paint: {
          'line-color': color,
          'line-width': 2.5,
          'line-opacity': 0.9,
        },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      };
    }

    if (layer.type === 'heatmap') {
      return {
        id: layer.id,
        type: 'heatmap',
        data: geojson,
        paint: {
          'heatmap-weight': layer.property
            ? ['interpolate', ['linear'], ['get', layer.property], min, 0, max, 1]
            : 1,
          'heatmap-intensity': 1.2,
          'heatmap-radius': 28,
          'heatmap-opacity': 0.75,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(30,58,138,0)',
            0.2,
            '#1d4ed8',
            0.5,
            '#f59e0b',
            0.8,
            '#ef4444',
            1,
            '#7f1d1d',
          ],
        },
        layout: {},
      };
    }

    if (layer.type === 'fill-extrusion') {
      return {
        id: layer.id,
        type: 'fill-extrusion',
        data: geojson,
        paint: {
          'fill-extrusion-color': color,
          'fill-extrusion-height': layer.property ? ['get', layer.property] : 20,
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.85,
        },
        layout: {},
      };
    }

    return {
      id: layer.id,
      type: 'circle',
      data: geojson,
      paint: {
        'circle-color': color,
        'circle-radius': layer.property
          ? ['interpolate', ['linear'], ['get', layer.property], min, 4, max, 18]
          : 6,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1.5,
        'circle-opacity': 0.9,
      },
      layout: {},
    };
  });
}

/**
 * The shapes a three-dimensional scene lifts off the map.
 *
 * A shape's height is read from one of its properties, so the same block
 * can raise a skyline by floor count, by height in metres, or by whatever
 * the data happens to hold.
 */
export function buildExtrusionSpecs(
  extrusions:
    | Array<{
        id: string;
        geojson: Record<string, unknown>;
        heightKey?: string;
        baseKey?: string;
        color?: string;
        colorScale?: string[];
      }>
    | undefined
): LayerSpec[] {
  if (!Array.isArray(extrusions)) return [];

  return extrusions.map((extrusion) => {
    const { min, max } = propertyRange(extrusion.geojson, extrusion.heightKey);
    const color = extrusion.color
      ? extrusion.color
      : colorScaleExpression(extrusion.colorScale, extrusion.heightKey, min, max);

    return {
      id: extrusion.id,
      type: 'fill-extrusion',
      data: extrusion.geojson,
      paint: {
        'fill-extrusion-color': color,
        'fill-extrusion-height': extrusion.heightKey ? ['get', extrusion.heightKey] : max,
        'fill-extrusion-base': extrusion.baseKey ? ['get', extrusion.baseKey] : 0,
        'fill-extrusion-opacity': 0.9,
        'fill-extrusion-vertical-gradient': true,
      },
      layout: {},
    };
  });
}

export interface RouteSpec {
  id: string;
  name: string;
  description?: string;
  /** The line, as GeoJSON. */
  data: Record<string, unknown>;
  color: string;
}

const ROUTE_COLORS = ['#f59e0b', '#ec4899', '#06b6d4', '#a855f7', '#10b981'];

/** The routes the block asks for. */
export function buildRouteSpecs(routes: MapBlock['data']['routes'] | undefined): RouteSpec[] {
  if (!Array.isArray(routes)) return [];
  return routes
    .map((route, index) => ({
      id: route.id,
      name: route.name,
      description: route.description,
      data: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: route.coordinates },
      },
      color: ROUTE_COLORS[index % ROUTE_COLORS.length],
    }))
    .filter((route) => {
      const coordinates = (route.data.geometry as { coordinates?: unknown[] }).coordinates;
      return Array.isArray(coordinates) && coordinates.length >= 2;
    });
}

export interface MapViewOptions {
  /** Whether the reader can move the map. */
  interactive?: boolean;
  /** Whether the zoom, compass and attribution controls are shown. */
  showControls?: boolean;
  /** Whether the map is drawn as a globe rather than a flat plane. */
  projection?: 'mercator' | 'globe';
  /** How far the map is tilted, in degrees. */
  pitch?: number;
  /** Which way the map is turned, in degrees. */
  bearing?: number;
  /** The furthest the reader can zoom in. */
  maxZoom?: number;
  /** The furthest the reader can zoom out. */
  minZoom?: number;
  /** Whether the camera is fitted to what the map shows rather than to a centre. */
  fitToMarkers?: boolean;
  /** Whether the map's marks are gathered together when they are close. */
  cluster?: boolean;
}

export interface MapConfig {
  basemap: BasemapDefinition;
  /** The style to load, when the basemap has one. */
  styleUrl?: string;
  /** A style built for a basemap that has none. */
  style?: Record<string, unknown>;
  center: [number, number];
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  pitch: number;
  bearing: number;
  projection: 'mercator' | 'globe';
  interactive: boolean;
  showControls: boolean;
  cluster: boolean;
  fitToMarkers: boolean;
  markers: MarkerSpec[];
  layers: LayerSpec[];
  routes: RouteSpec[];
  attribution: string;
}

/**
 * The whole of a map block, resolved into one thing the view can draw.
 */
export function buildMapConfig(mapData: MapBlock['data'], options: MapViewOptions = {}): MapConfig {
  const basemap = resolveBasemap(mapData.style);
  const markers = buildMarkerSpecs(mapData.markers);
  const layers = buildLayerSpecs(mapData.layers);
  const routes = buildRouteSpecs(mapData.routes);

  const center: [number, number] =
    Array.isArray(mapData.center) &&
    Number.isFinite(mapData.center[0]) &&
    Number.isFinite(mapData.center[1])
      ? [mapData.center[0], mapData.center[1]]
      : (markers[0]?.coordinates ?? [0, 20]);

  return {
    basemap,
    styleUrl: basemap.styleUrl,
    center,
    zoom: mapData.zoom ?? 3,
    minZoom: options.minZoom,
    maxZoom: options.maxZoom ?? basemap.maxZoom,
    pitch: Math.max(0, Math.min(85, options.pitch ?? 0)),
    bearing: Math.max(-180, Math.min(180, options.bearing ?? 0)),
    projection: options.projection ?? 'mercator',
    interactive: options.interactive ?? true,
    showControls: options.showControls ?? true,
    cluster: options.cluster ?? false,
    fitToMarkers: options.fitToMarkers ?? false,
    markers,
    layers,
    routes,
    attribution: basemap.attribution,
  };
}
