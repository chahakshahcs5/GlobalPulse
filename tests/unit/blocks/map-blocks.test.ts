import { describe, it, expect } from 'vitest';
import {
  Map3DBlockSchema,
  MapBlockSchema,
  StoryBlockSchema,
  getBlockDefinition,
} from '@ai-news/schemas';
import {
  BASEMAPS,
  buildExtrusionSpecs,
  buildLayerSpecs,
  buildMapConfig,
  buildMarkerSpecs,
  buildRasterStyle,
  buildRouteSpecs,
  colorScaleExpression,
  resolveBasemap,
  severityColor,
} from '@ai-news/media';
import { extractTextContent } from '@ai-news/content';

const base = { id: 'blk_map_test', sortOrder: 0 };

const mapData = {
  center: [34.5, 41.2] as [number, number],
  zoom: 8,
  style: 'streets' as const,
  markers: [
    { coordinates: [34.1, 41.4] as [number, number], title: 'Northfield', severity: 'low' },
    { coordinates: [35.2, 40.8] as [number, number], title: 'Harbour East', severity: 'critical' },
  ],
  layers: [
    {
      id: 'regions',
      type: 'fill' as const,
      geojson: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { rate: 2 },
            geometry: { type: 'Point', coordinates: [0, 0] },
          },
          {
            type: 'Feature',
            properties: { rate: 8 },
            geometry: { type: 'Point', coordinates: [1, 1] },
          },
        ],
      },
      property: 'rate',
      colorScale: ['#10b981', '#f59e0b', '#ef4444'],
    },
  ],
  routes: [
    {
      id: 'r1',
      name: 'The line',
      coordinates: [[34.1, 41.4] as [number, number], [34.5, 41.2] as [number, number]],
    },
  ],
};

describe('The map block', () => {
  it('validates the map', () => {
    const block = MapBlockSchema.parse({ ...base, blockType: 'map', data: mapData });
    expect(block.data.markers).toHaveLength(2);
    expect(block.data.layers).toHaveLength(1);
  });

  it('is part of the story block union', () => {
    const parsed = StoryBlockSchema.parse({ ...base, blockType: 'map', data: mapData });
    expect(parsed.blockType).toBe('map');
  });

  it('takes a basemap, a projection and a tilt', () => {
    const parsed = MapBlockSchema.parse({
      ...base,
      blockType: 'map',
      data: { ...mapData, projection: 'globe', pitch: 55, bearing: -20 },
    });
    expect(parsed.data.projection).toBe('globe');
    expect(parsed.data.pitch).toBe(55);
  });

  it('rejects a tilt that is not a tilt', () => {
    expect(() =>
      MapBlockSchema.parse({ ...base, blockType: 'map', data: { ...mapData, pitch: 120 } })
    ).toThrow();
  });

  it('rejects a basemap that does not exist', () => {
    expect(() =>
      MapBlockSchema.parse({ ...base, blockType: 'map', data: { ...mapData, style: 'terrain' } })
    ).toThrow();
  });

  it('reaches the text extractor', () => {
    const text = extractTextContent([
      { ...base, blockType: 'map', data: { ...mapData, title: 'The four sites' } } as never,
    ]);
    expect(text).toContain('The four sites');
  });
});

describe('The basemaps', () => {
  it('has a basemap for every one the block offers', () => {
    for (const key of ['streets', 'light', 'bright', 'dark', 'fiord', 'satellite']) {
      expect(BASEMAPS[key], key).toBeDefined();
      expect(BASEMAPS[key].attribution.length).toBeGreaterThan(5);
      expect(BASEMAPS[key].maxZoom).toBeGreaterThan(5);
    }
  });

  it('gives every vector basemap a style to load', () => {
    for (const key of ['streets', 'light', 'bright', 'dark', 'fiord']) {
      expect(BASEMAPS[key].styleUrl, key).toMatch(/^https:\/\//);
    }
  });

  it('builds a style for the basemap that is only pictures', () => {
    const satellite = resolveBasemap('satellite');
    expect(satellite.styleUrl).toBeUndefined();
    const style = buildRasterStyle(satellite) as {
      version: number;
      sources: Record<string, { type: string; tiles: string[] }>;
      layers: Array<{ type: string }>;
    };
    expect(style.version).toBe(8);
    expect(style.sources.basemap.type).toBe('raster');
    expect(style.sources.basemap.tiles[0]).toMatch(/\{z\}/);
    expect(style.layers[0].type).toBe('raster');
  });

  it('falls back to streets when the basemap is not one it knows', () => {
    expect(resolveBasemap('nonsense').label).toBe('Streets');
  });
});

describe('Building a map', () => {
  it('resolves the basemap the block asked for', () => {
    const config = buildMapConfig(mapData);
    expect(config.basemap.label).toBe('Streets');
    expect(config.styleUrl).toContain('liberty');
  });

  it('carries the camera the block asked for', () => {
    const config = buildMapConfig(mapData, { pitch: 60, bearing: -20, projection: 'globe' });
    expect(config.pitch).toBe(60);
    expect(config.bearing).toBe(-20);
    expect(config.projection).toBe('globe');
  });

  it('never tilts the camera further than a map can go', () => {
    const config = buildMapConfig(mapData, { pitch: 200 });
    expect(config.pitch).toBe(85);
  });

  it('colours a marker by its severity', () => {
    expect(severityColor('critical')).toBe('#ef4444');
    expect(severityColor('low')).toBe('#10b981');
    expect(severityColor(undefined)).toBe('#3b82f6');
  });

  it('keeps only the markers that are somewhere', () => {
    const markers = buildMarkerSpecs([
      { coordinates: [1, 2], title: 'Here' },
      { coordinates: [Number.NaN, 2], title: 'Nowhere' },
    ]);
    expect(markers).toHaveLength(1);
    expect(markers[0].title).toBe('Here');
  });

  it('turns the layers into things a map can draw', () => {
    const layers = buildLayerSpecs(mapData.layers);
    expect(layers).toHaveLength(1);
    expect(layers[0].type).toBe('fill');
    expect(layers[0].paint['fill-color']).toBeDefined();
  });

  it('turns a route into a line', () => {
    const routes = buildRouteSpecs(mapData.routes);
    expect(routes).toHaveLength(1);
    const geometry = routes[0].data.geometry as { type: string };
    expect(geometry.type).toBe('LineString');
  });

  it('places a value across the colour scale', () => {
    const expression = colorScaleExpression(
      ['#10b981', '#f59e0b', '#ef4444'],
      'rate',
      0,
      10
    ) as unknown[];
    expect(expression[0]).toBe('interpolate');
    expect(expression).toContain('#ef4444');
  });

  it('lifts a shape off the map by a property of its own', () => {
    const layers = buildExtrusionSpecs([
      {
        id: 'sites',
        geojson: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: { height: 42 },
              geometry: { type: 'Point', coordinates: [0, 0] },
            },
          ],
        },
        heightKey: 'height',
      },
    ]);
    expect(layers).toHaveLength(1);
    expect(layers[0].type).toBe('fill-extrusion');
    expect(layers[0].paint['fill-extrusion-height']).toEqual(['get', 'height']);
  });
});

describe('The three-dimensional map block', () => {
  const sceneData = {
    title: 'The valley',
    scene: 'terrain' as const,
    style: 'streets' as const,
    center: [34.5, 41.2] as [number, number],
    zoom: 11,
    pitch: 60,
    terrainExaggeration: 1.5,
  };

  it('validates the scene', () => {
    const block = Map3DBlockSchema.parse({
      ...base,
      blockType: 'map_3d',
      data: sceneData,
    });
    expect(block.data.scene).toBe('terrain');
    expect(block.data.terrainExaggeration).toBe(1.5);
  });

  it('is part of the story block union', () => {
    const parsed = StoryBlockSchema.parse({
      ...base,
      blockType: 'map_3d',
      data: sceneData,
    });
    expect(parsed.blockType).toBe('map_3d');
  });

  it('rejects a scene it does not have', () => {
    expect(() =>
      Map3DBlockSchema.parse({
        ...base,
        blockType: 'map_3d',
        data: { ...sceneData, scene: 'city' },
      })
    ).toThrow();
  });

  it('rejects a land raised beyond recognition', () => {
    expect(() =>
      Map3DBlockSchema.parse({
        ...base,
        blockType: 'map_3d',
        data: { ...sceneData, terrainExaggeration: 40 },
      })
    ).toThrow();
  });

  it('is registered in the immersive category', () => {
    const definition = getBlockDefinition('map_3d');
    expect(definition).toBeDefined();
    expect(definition!.category).toBe('immersive');
    expect(definition!.description.length).toBeGreaterThan(10);
  });
});
