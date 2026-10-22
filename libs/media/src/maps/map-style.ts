/**
 * The basemaps the newsroom can draw on.
 *
 * A basemap is the picture underneath the story: the roads, the rivers, the
 * boundaries, the buildings. It is not part of the block's data, and it is
 * not the newsroom's to draw — it comes from somewhere, and where it comes
 * from has to be shown to the reader.
 *
 * The vector basemaps are OpenFreeMap, which serves the OpenStreetMap planet
 * with no API key and no usage cap. The satellite basemap is Esri's World
 * Imagery, which is also keyless but is a raster: labels have to be drawn
 * over it rather than being part of it.
 */

export interface BasemapDefinition {
  /** The name shown to the reader, and to the editor. */
  label: string;
  /** A MapLibre style URL, for a basemap that has one. */
  styleUrl?: string;
  /** A raster tile template, for a basemap that is only images. */
  tiles?: string[];
  /** The size of a raster tile, in pixels. */
  tileSize?: number;
  /** Where the map's data comes from, which the map has to show. */
  attribution: string;
  /** The furthest in a reader can zoom. */
  maxZoom: number;
  /** Whether the basemap can be drawn as a globe. */
  globe: boolean;
  /** Whether the basemap carries three-dimensional buildings. */
  threeDimensional: boolean;
}

/** Where OpenFreeMap's glyphs live, for basemaps that need labels of their own. */
export const GLYPHS_URL = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';

const OPENFREEMAP = 'https://tiles.openfreemap.org/styles';

export const BASEMAPS: Record<string, BasemapDefinition> = {
  streets: {
    label: 'Streets',
    styleUrl: `${OPENFREEMAP}/liberty`,
    attribution: '© OpenStreetMap contributors',
    maxZoom: 20,
    globe: true,
    threeDimensional: true,
  },
  light: {
    label: 'Light',
    styleUrl: `${OPENFREEMAP}/positron`,
    attribution: '© OpenStreetMap contributors',
    maxZoom: 20,
    globe: true,
    threeDimensional: true,
  },
  bright: {
    label: 'Bright',
    styleUrl: `${OPENFREEMAP}/bright`,
    attribution: '© OpenStreetMap contributors',
    maxZoom: 20,
    globe: true,
    threeDimensional: true,
  },
  dark: {
    label: 'Dark',
    styleUrl: `${OPENFREEMAP}/dark`,
    attribution: '© OpenStreetMap contributors',
    maxZoom: 20,
    globe: true,
    threeDimensional: true,
  },
  fiord: {
    label: 'Fiord',
    styleUrl: `${OPENFREEMAP}/fiord`,
    attribution: '© OpenStreetMap contributors',
    maxZoom: 20,
    globe: true,
    threeDimensional: true,
  },
  satellite: {
    label: 'Satellite',
    tiles: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    ],
    tileSize: 256,
    attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
    globe: false,
    threeDimensional: false,
  },
};

/** The basemaps, in the order they are offered. */
export const BASEMAP_KEYS = ['streets', 'light', 'bright', 'dark', 'fiord', 'satellite'] as const;

export type BasemapKey = (typeof BASEMAP_KEYS)[number];

/** The basemap a block asked for, or the one it gets when it did not say. */
export function resolveBasemap(style: string | undefined): BasemapDefinition {
  return BASEMAPS[style ?? ''] ?? BASEMAPS.streets;
}

/**
 * A MapLibre style for a basemap that is only images.
 *
 * Esri's imagery has no style of its own, so one is built: the raster tiles,
 * and nothing else. Labels and the story's own layers are added over it by
 * the map itself.
 */
export function buildRasterStyle(basemap: BasemapDefinition): Record<string, unknown> {
  return {
    version: 8,
    name: `GlobalPulse ${basemap.label}`,
    glyphs: GLYPHS_URL,
    sources: {
      basemap: {
        type: 'raster',
        tiles: basemap.tiles,
        tileSize: basemap.tileSize ?? 256,
        attribution: basemap.attribution,
        maxzoom: basemap.maxZoom,
      },
    },
    layers: [
      {
        id: 'basemap',
        type: 'raster',
        source: 'basemap',
        paint: { 'raster-opacity': 1 },
      },
    ],
  };
}

/**
 * The terrain the three-dimensional map is drawn over.
 *
 * It is a raster digital elevation model, tinted by the shading in the image
 * rather than by a computed hillshade, so a mountain reads as a mountain at
 * any zoom.
 */
export const TERRAIN_SOURCE = {
  type: 'raster-dem',
  tiles: ['https://demotiles.maplibre.org/terrain-tiles/{z}/{x}/{y}.png'],
  encoding: 'terrarium',
  tileSize: 256,
  maxzoom: 15,
  attribution: 'Terrain © JAXA',
};

/** The imagery the terrain is drawn over, where the basemap is satellite. */
export const HILLSHADE_SOURCE = {
  type: 'raster',
  tiles: ['https://demotiles.maplibre.org/terrain-tiles/{z}/{x}/{y}.png'],
  tileSize: 256,
  maxzoom: 15,
};
