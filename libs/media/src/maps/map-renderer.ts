import type { MapBlock } from '@ai-news/schemas';
import { escapeXml } from '@ai-news/shared';
import { CONTINENT_PATHS, scaleContinentPath } from './continent-paths';

export interface MapLibreConfig {
  container: string;
  style: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
  interactive: boolean;
  markers?: Array<{
    coordinates: [number, number];
    title: string;
    description?: string;
  }>;
}

export class MapRenderer {
  /**
   * Generates production MapLibre GL configuration options from a structured MapBlock.
   */
  static buildMapLibreOptions(
    mapData: MapBlock['data'],
    containerId = 'map-container'
  ): MapLibreConfig {
    const styleUrls: Record<string, string> = {
      dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      satellite: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      streets: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    };

    const centerCoords = parseCoordinates(mapData.center) || [0, 20];
    const markers = (mapData.markers || [])
      .map((m) => {
        const coords = parseCoordinates(
          (m as unknown as { coordinates?: unknown }).coordinates || m
        );
        if (!coords) return null;
        return {
          coordinates: coords,
          title: m.title || (m as unknown as { label?: string }).label || 'Marker',
          description: m.description,
        };
      })
      .filter((m): m is NonNullable<typeof m> => Boolean(m));

    return {
      container: containerId,
      style: styleUrls[mapData.style] || styleUrls.dark,
      center: centerCoords,
      zoom: mapData.zoom || 2,
      interactive: true,
      markers,
    };
  }

  /**
   * Renders a vector SVG map representation (used for headless preview, server-side rendering, and fallback).
   */
  static renderSvgFallback(
    mapData: MapBlock['data'],
    width = 800,
    height = 450,
    theme: 'dark' | 'light' = 'dark'
  ): string {
    const isDark = theme === 'dark';
    const bgColorStart = isDark ? '#090e17' : '#f1f5f9';
    const bgColorEnd = isDark ? '#0f172a' : '#e2e8f0';
    const landColor = isDark ? '#1e293b' : '#cbd5e1';
    const landStroke = isDark ? '#334155' : '#94a3b8';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const pinColor = '#ef4444';
    const pinGlow = 'rgba(239, 68, 68, 0.25)';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subtextColor = isDark ? '#94a3b8' : '#64748b';
    const pillBg = isDark ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.92)';
    const pillBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';

    // Projection calculation: Equirectangular projection (WGS84)
    const project = (lng: number, lat: number): [number, number] => {
      const x = ((lng + 180) / 360) * width;
      const y = ((90 - lat) / 180) * height;
      return [x, y];
    };

    // Geographic continent polygons (Equirectangular scaled to 800x450)
    const continentSvgPaths = CONTINENT_PATHS.map((p) => {
      const scaled = scaleContinentPath(p, width, height);
      return `<path d="${scaled}" fill="${landColor}" stroke="${landStroke}" stroke-width="1" stroke-linejoin="round" />`;
    }).join('\n');

    // Grid Lines (Equator, Tropics, Meridians)
    const equatorY = height * 0.5;
    const tropicNY = height * (1 - (90 + 23.5) / 180);
    const tropicSY = height * (1 - (90 - 23.5) / 180);

    const gridLines = `
      <!-- Longitude Meridians -->
      <line x1="${width * 0.166}" y1="0" x2="${width * 0.166}" y2="${height}" stroke="${gridColor}" stroke-dasharray="3,3" />
      <line x1="${width * 0.333}" y1="0" x2="${width * 0.333}" y2="${height}" stroke="${gridColor}" stroke-dasharray="3,3" />
      <line x1="${width * 0.5}" y1="0" x2="${width * 0.5}" y2="${height}" stroke="${gridColor}" stroke-dasharray="4,4" stroke-width="1.2" />
      <line x1="${width * 0.666}" y1="0" x2="${width * 0.666}" y2="${height}" stroke="${gridColor}" stroke-dasharray="3,3" />
      <line x1="${width * 0.833}" y1="0" x2="${width * 0.833}" y2="${height}" stroke="${gridColor}" stroke-dasharray="3,3" />
      <!-- Latitude Parallels -->
      <line x1="0" y1="${tropicNY}" x2="${width}" y2="${tropicNY}" stroke="${gridColor}" stroke-dasharray="2,3" />
      <line x1="0" y1="${equatorY}" x2="${width}" y2="${equatorY}" stroke="${gridColor}" stroke-dasharray="4,4" stroke-width="1.2" />
      <line x1="0" y1="${tropicSY}" x2="${width}" y2="${tropicSY}" stroke="${gridColor}" stroke-dasharray="2,3" />
    `;

    // Safely collect valid markers from diverse coordinate formats
    const validMarkers: Array<{
      coords: [number, number];
      title: string;
      description?: string;
      severity?: string;
      icon?: string;
    }> = [];

    if (Array.isArray(mapData.markers)) {
      mapData.markers.forEach((m) => {
        if (!m) return;
        const coords = parseCoordinates(
          (m as unknown as { coordinates?: unknown }).coordinates || m
        );
        if (coords) {
          validMarkers.push({
            coords,
            title:
              m.title ||
              (m as unknown as { label?: string }).label ||
              (m as unknown as { name?: string }).name ||
              'Location',
            description: m.description,
            severity: m.severity,
            icon: m.icon,
          });
        }
      });
    }

    // Tracking Arc between markers if multiple exist
    let trackingArcs = '';
    if (validMarkers.length >= 2) {
      for (let i = 0; i < validMarkers.length - 1; i++) {
        const [x1, y1] = project(validMarkers[i].coords[0], validMarkers[i].coords[1]);
        const [x2, y2] = project(validMarkers[i + 1].coords[0], validMarkers[i + 1].coords[1]);
        const midX = (x1 + x2) / 2;
        const midY = Math.min(y1, y2) - 40; // upward arch
        trackingArcs += `
          <path d="M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="5,4" stroke-opacity="0.8" />
        `;
      }
    }

    // Render Markers with legible badges
    let markerSvgs = '';
    validMarkers.forEach((m) => {
      const [x, y] = project(m.coords[0], m.coords[1]);
      const titleSafe = escapeXml(m.title);
      /*
       * A marker's severity is what the reader scans for first, so it
       * decides the colour of the pin.
       */
      const severityColor =
        m.severity === 'high'
          ? '#ef4444'
          : m.severity === 'medium'
            ? '#f59e0b'
            : m.severity === 'low'
              ? '#22c55e'
              : pinColor;
      const severityGlow =
        m.severity === 'high'
          ? 'rgba(239, 68, 68, 0.25)'
          : m.severity === 'medium'
            ? 'rgba(245, 158, 11, 0.25)'
            : m.severity === 'low'
              ? 'rgba(34, 197, 94, 0.25)'
              : pinGlow;
      const textWidth = Math.max(70, titleSafe.length * 7 + 16);
      const textOffsetLeft = x > width - 180;
      const labelX = textOffsetLeft ? x - textWidth - 12 : x + 14;
      const labelRectX = textOffsetLeft ? x - textWidth - 16 : x + 10;

      markerSvgs += `
        <g transform="translate(${x}, ${y})">
          <!-- Ping Waves -->
          <circle cx="0" cy="0" r="18" fill="${severityGlow}" />
          <circle cx="0" cy="0" r="9" fill="${severityColor}" fill-opacity="0.4" />
          <circle cx="0" cy="0" r="5" fill="${severityColor}" stroke="#ffffff" stroke-width="1.5" />
          ${
            m.icon
              ? `<text x="0" y="-11" font-size="11" text-anchor="middle" fill="${severityColor}" font-family="system-ui, sans-serif">${escapeXml(m.icon)}</text>`
              : ''
          }
          <!-- Pill Backdrop -->
          <rect x="${labelRectX - x}" y="-13" width="${textWidth}" height="24" rx="6" fill="${pillBg}" stroke="${pillBorder}" stroke-width="1" />
          <text x="${labelX - x}" y="3" font-size="11" font-weight="700" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${titleSafe}</text>
        </g>
      `;
    });

    // Routes. A route map draws the path itself, not just its endpoints.
    let routeSvgs = '';
    if (mapData.routes && mapData.routes.length > 0) {
      const routeColors = ['#f59e0b', '#ec4899', '#06b6d4', '#a855f7'];
      mapData.routes.forEach((route, idx) => {
        if (!route?.coordinates || route.coordinates.length < 2) return;
        const points = route.coordinates
          .map((coord) => {
            const parsed = parseCoordinates(coord);
            if (!parsed) return null;
            const [px, py] = project(parsed[0], parsed[1]);
            return `${px.toFixed(1)},${py.toFixed(1)}`;
          })
          .filter(Boolean)
          .join(' ');
        if (!points) return;
        const color = routeColors[idx % routeColors.length];
        routeSvgs += `
          <polyline points="${points}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" stroke-opacity="0.9" />
          <polyline points="${points}" fill="none" stroke="#ffffff" stroke-width="1" stroke-opacity="0.35" stroke-dasharray="1,7" stroke-linecap="round" />
          <text x="${project(route.coordinates[0][0], route.coordinates[0][1])[0] + 10}" y="${project(route.coordinates[0][0], route.coordinates[0][1])[1] - 8}" font-size="11" font-weight="700" fill="${color}" font-family="system-ui, sans-serif">${escapeXml(route.name || 'Route')}</text>
        `;
      });
    }

    /*
     * The layers.
     *
     * A choropleth shades the regions by their value, a heatmap blurs the
     * intensity, a circle layer marks a point and a line layer draws a
     * path. Without this the map is a picture of pins whatever the data
     * says, and a choropleth looks exactly like a points map.
     */
    let layerSvgs = '';
    if (mapData.layers && mapData.layers.length > 0) {
      mapData.layers.forEach((layer) => {
        const features = geoJsonFeatures(layer.geojson);
        if (features.length === 0) return;

        const values = features
          .map((feature) => Number((feature.properties ?? {})[layer.property ?? '']))
          .filter((value) => Number.isFinite(value));
        const min = values.length ? Math.min(...values) : 0;
        const max = values.length ? Math.max(...values) : 1;
        const span = max - min || 1;
        const scale = layer.colorScale ?? [];

        const colourFor = (value: number): string => {
          if (scale.length === 0) return '#3b82f6';
          const position = (value - min) / span;
          const index = Math.min(
            scale.length - 1,
            Math.max(0, Math.round(position * (scale.length - 1)))
          );
          return scale[index];
        };

        features.forEach((feature) => {
          const raw = (feature.properties ?? {})[layer.property ?? ''];
          const value = Number(raw);
          const shade = Number.isFinite(value) ? colourFor(value) : '#94a3b8';
          const rings = polygonRings(feature);
          if (rings.length === 0) return;

          if (layer.type === 'line') {
            rings.forEach((ring) => {
              const points = ring
                .map((coord) => {
                  const [px, py] = project(coord[0], coord[1]);
                  return `${px.toFixed(1)},${py.toFixed(1)}`;
                })
                .join(' ');
              layerSvgs += `<polyline points="${points}" fill="none" stroke="${shade}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" stroke-opacity="0.9" />`;
            });
            return;
          }

          if (layer.type === 'circle') {
            const centre = ringCentre(rings[0]);
            const [cx, cy] = project(centre[0], centre[1]);
            const intensity = Number.isFinite(value) ? (value - min) / span : 0;
            const radius = 6 + intensity * 22;
            layerSvgs += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${radius.toFixed(1)}" fill="${shade}" fill-opacity="0.7" stroke="#ffffff" stroke-width="1" />`;
            return;
          }

          if (layer.type === 'heatmap') {
            const centre = ringCentre(rings[0]);
            const [cx, cy] = project(centre[0], centre[1]);
            const intensity = Number.isFinite(value) ? (value - min) / span : 0;
            const radius = 14 + intensity * 46;
            layerSvgs += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${radius.toFixed(1)}" fill="${shade}" fill-opacity="${(0.18 + intensity * 0.5).toFixed(2)}" />`;
            return;
          }

          rings.forEach((ring) => {
            const points = ring
              .map((coord) => {
                const [px, py] = project(coord[0], coord[1]);
                return `${px.toFixed(1)},${py.toFixed(1)}`;
              })
              .join(' ');
            layerSvgs += `<polygon points="${points}" fill="${shade}" fill-opacity="0.6" stroke="${shade}" stroke-width="1.2" stroke-linejoin="round" />`;
          });
        });
      });
    }

    // The map type decides what the reader is looking at, so it is stated
    // on the map rather than left implicit.
    const mapTypeLabel: Record<string, string> = {
      points: 'Points',
      choropleth: 'Choropleth',
      heatmap: 'Heatmap',
      route: 'Route',
      comparison: 'Comparison',
    };
    const resolvedMapType = mapData.mapType || 'points';
    const mapTypeText = mapTypeLabel[resolvedMapType] || resolvedMapType;

    // Layer Badges
    const paddingRight = 20;
    let layerBadges = '';
    if (mapData.layers && mapData.layers.length > 0) {
      mapData.layers.forEach((layer, idx) => {
        const lx = width - paddingRight - 130;
        const ly = 24 + idx * 26;
        layerBadges += `
          <g transform="translate(${lx}, ${ly})">
            <rect width="110" height="22" rx="4" fill="${isDark ? 'rgba(30,41,59,0.85)' : 'rgba(241,245,249,0.92)'}" stroke="${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}" />
            <circle cx="10" cy="11" r="4" fill="#3b82f6" />
            <text x="20" y="15" font-size="10" font-weight="600" fill="${textColor}" font-family="system-ui, sans-serif">${escapeXml(layer.id)} (${layer.type})</text>
          </g>
        `;
      });
    }

    // Regions under comparison, listed so the comparison is legible.
    let comparisonBadges = '';
    if (mapData.comparisonRegionIds && mapData.comparisonRegionIds.length > 0) {
      const cx0 = 20;
      const cy0 = height - 40;
      const text = `Comparing: ${mapData.comparisonRegionIds.join(', ')}`;
      const badgeWidth = Math.min(width - 40, Math.max(120, text.length * 6.4 + 20));
      comparisonBadges = `
        <g transform="translate(${cx0}, ${cy0})">
          <rect width="${badgeWidth}" height="22" rx="4" fill="${isDark ? 'rgba(30,41,59,0.85)' : 'rgba(241,245,249,0.92)'}" stroke="${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}" />
          <text x="10" y="15" font-size="10" font-weight="600" fill="${textColor}" font-family="system-ui, sans-serif">${escapeXml(text)}</text>
        </g>
      `;
    }

    // Header card with auto-sizing to eliminate text overflow
    const mapTitle = mapData.title || 'Geographic Overview';
    const titleLength = mapTitle.length;
    const headerWidth = Math.min(width - 40, Math.max(300, titleLength * 8.4 + 48));
    const headerHeight = 52;

    const centerCoords = parseCoordinates(mapData.center) || (validMarkers[0]?.coords ?? [0, 20]);
    const [cx, cy] = project(centerCoords[0], centerCoords[1]);
    const lat = centerCoords[1];
    const lng = centerCoords[0];
    const latStr = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}`;
    const lngStr = `${Math.abs(lng).toFixed(2)}°${lng >= 0 ? 'E' : 'W'}`;
    const zoomLevel = mapData.zoom ?? 2;
    const coordLabel = `Coordinates: ${latStr}, ${lngStr} | Zoom: ${zoomLevel}x`;

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: ${bgColorStart}; border-radius: 16px; overflow: hidden;" role="img" aria-label="${escapeXml(mapTitle)}">
        <defs>
          <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${bgColorStart}" />
            <stop offset="100%" stop-color="${bgColorEnd}" />
          </linearGradient>
        </defs>
        
        <!-- Ocean Background -->
        <rect width="${width}" height="${height}" fill="url(#oceanGrad)" />
        
        <!-- Coordinate Grid -->
        ${gridLines}
        
        <!-- World Continents -->
        <g id="continents">
          ${continentSvgPaths}
        </g>
        
        <!-- Tracking Links -->
        ${trackingArcs}

        <!-- Routes -->
        ${routeSvgs}

        <!-- Center Target Reticle -->
        <g transform="translate(${cx}, ${cy})">
          <circle cx="0" cy="0" r="7" fill="none" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="2,2" />
          <circle cx="0" cy="0" r="2.5" fill="#3b82f6" />
        </g>

        <!-- Data Layers -->
        ${layerSvgs}

        <!-- Interactive Marker Points -->
        ${markerSvgs}

        <!-- Layer Badges -->
        ${layerBadges}

        <!-- Comparison Regions -->
        ${comparisonBadges}

        <!-- Map Type -->
        <g transform="translate(20, ${height - 66})">
          <rect width="86" height="20" rx="4" fill="${pillBg}" stroke="${pillBorder}" stroke-width="1" />
          <text x="10" y="14" font-size="10" font-weight="700" fill="${subtextColor}" font-family="system-ui, sans-serif">${escapeXml(mapTypeText)}</text>
        </g>

        <!-- Dynamic Header Card (No Overflow) -->
        <g transform="translate(20, 20)">
          <rect width="${headerWidth}" height="${headerHeight}" rx="10" fill="${pillBg}" stroke="${pillBorder}" stroke-width="1" />
          <circle cx="20" cy="26" r="5" fill="#3b82f6" />
          <text x="34" y="23" font-size="13" font-weight="700" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(mapTitle)}</text>
          <text x="34" y="39" font-size="10.5" font-mono font-weight="500" fill="${subtextColor}" font-family="ui-monospace, monospace">${coordLabel}</text>
        </g>
      </svg>
    `;
  }
}

/**
 * A GeoJSON feature, as far as the layers use it.
 *
 * The layers carry whatever the editor supplied, so a FeatureCollection, a
 * bare Feature and a plain geometry are all accepted.
 */
interface GeoFeature {
  type?: string;
  properties?: Record<string, unknown>;
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
}

/** The features of a GeoJSON object. */
function geoJsonFeatures(geojson: unknown): GeoFeature[] {
  if (!geojson || typeof geojson !== 'object') return [];
  const source = geojson as GeoFeature;
  if (source.type === 'FeatureCollection') {
    const features = (source as { features?: unknown }).features;
    return Array.isArray(features) ? (features as GeoFeature[]) : [];
  }
  if (source.type === 'Feature') return [source];
  if (source.type) {
    return [{ type: 'Feature', properties: {}, geometry: source as GeoFeature['geometry'] }];
  }
  return [];
}

/**
 * The rings of a feature, as arrays of coordinates.
 *
 * A polygon is a list of rings, the first of which is the outside; a
 * multi-polygon is a list of polygons. A line is a single ring.
 */
function polygonRings(feature: GeoFeature): Array<Array<[number, number]>> {
  const geometry = feature?.geometry;
  if (!geometry || typeof geometry !== 'object') return [];

  const asRing = (ring: unknown): Array<[number, number]> =>
    Array.isArray(ring)
      ? ring
          .map((coord) => parseCoordinates(coord))
          .filter((coord): coord is [number, number] => coord !== null)
      : [];

  if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates)) {
    return geometry.coordinates
      .map(asRing)
      .filter((ring: Array<[number, number]>) => ring.length > 1);
  }
  if (geometry.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)) {
    return geometry.coordinates.flatMap((polygon: unknown) =>
      Array.isArray(polygon)
        ? polygon.map(asRing).filter((ring: Array<[number, number]>) => ring.length > 1)
        : []
    );
  }
  if (geometry.type === 'LineString') {
    const ring = asRing(geometry.coordinates);
    return ring.length > 1 ? [ring] : [];
  }
  if (geometry.type === 'MultiLineString' && Array.isArray(geometry.coordinates)) {
    return geometry.coordinates
      .map(asRing)
      .filter((ring: Array<[number, number]>) => ring.length > 1);
  }
  if (geometry.type === 'Point') {
    const point = parseCoordinates(geometry.coordinates);
    return point ? [[point]] : [];
  }
  return [];
}

/** The middle of a ring, used to place a circle or a heat spot. */
function ringCentre(ring: Array<[number, number]>): [number, number] {
  if (ring.length === 0) return [0, 0];
  const sum = ring.reduce(
    (total, coord) => [total[0] + coord[0], total[1] + coord[1]] as [number, number],
    [0, 0] as [number, number]
  );
  return [sum[0] / ring.length, sum[1] / ring.length];
}

function parseCoordinates(input: unknown): [number, number] | null {
  if (!input) return null;
  if (Array.isArray(input) && input.length >= 2) {
    const lng = Number(input[0]);
    const lat = Number(input[1]);
    if (!isNaN(lng) && !isNaN(lat)) return [lng, lat];
  }
  if (typeof input === 'object') {
    const obj = input as Record<string, unknown>;
    if (obj.coordinates) {
      const nested = parseCoordinates(obj.coordinates);
      if (nested) return nested;
    }
    const lng = Number(obj.lng ?? obj.longitude ?? obj.lon ?? obj.x);
    const lat = Number(obj.lat ?? obj.latitude ?? obj.y);
    if (!isNaN(lng) && !isNaN(lat)) return [lng, lat];
  }
  return null;
}
