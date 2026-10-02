import type { MapBlock } from '@ai-news/schemas';

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
    const sx = width / 800;
    const sy = height / 450;
    const scalePath = (pathStr: string) => {
      return pathStr.replace(/([0-9.]+)\s+([0-9.]+)/g, (_, px, py) => {
        return `${(parseFloat(px) * sx).toFixed(1)} ${(parseFloat(py) * sy).toFixed(1)}`;
      });
    };

    const continents = [
      // North America (Alaska, Canada, US, Mexico, Central America)
      'M 80 40 L 125 35 L 180 38 L 225 58 L 240 85 L 210 115 L 245 130 L 218 152 L 195 145 L 185 185 L 202 198 L 215 192 L 230 220 L 220 235 L 198 215 L 175 190 L 155 170 L 135 155 L 105 142 L 78 100 L 72 65 Z',
      // Greenland
      'M 270 30 L 320 28 L 335 55 L 305 85 L 265 75 Z',
      // South America
      'M 220 235 L 248 232 L 285 260 L 302 288 L 278 350 L 242 382 L 225 365 L 232 310 L 210 260 Z',
      // Europe & Scandinavia
      'M 378 72 L 400 48 L 425 45 L 430 75 L 452 70 L 458 102 L 435 125 L 398 128 L 372 108 L 365 82 Z',
      // British Isles
      'M 358 85 L 372 80 L 368 100 L 354 102 Z',
      // Africa
      'M 368 138 L 442 135 L 478 175 L 492 225 L 448 322 L 420 338 L 392 282 L 358 210 L 354 165 Z',
      // Madagascar
      'M 495 285 L 505 285 L 498 330 L 485 325 Z',
      // Asia & Siberia
      'M 458 68 L 520 48 L 610 52 L 685 68 L 715 110 L 678 148 L 638 148 L 622 185 L 578 190 L 548 165 L 488 170 L 460 135 L 465 95 Z',
      // Japan
      'M 685 115 L 702 120 L 696 145 L 680 140 Z',
      // India & South Asia
      'M 525 185 L 565 185 L 575 220 L 548 255 L 528 220 Z',
      // Southeast Asia & Indonesia
      'M 590 195 L 628 200 L 612 240 L 585 225 Z M 605 255 L 645 255 L 635 275 L 610 270 Z M 650 258 L 680 260 L 675 280 L 648 278 Z',
      // Australia & New Zealand
      'M 632 272 L 712 268 L 730 315 L 685 342 L 638 318 Z M 740 330 L 755 335 L 748 365 L 735 355 Z',
      // Antarctica
      'M 60 422 L 740 422 L 720 445 L 80 445 Z',
    ];

    const continentSvgPaths = continents
      .map(
        (p) =>
          `<path d="${scalePath(p)}" fill="${landColor}" stroke="${landStroke}" stroke-width="1" stroke-linejoin="round" />`
      )
      .join('\n');

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
    const validMarkers: Array<{ coords: [number, number]; title: string; description?: string }> =
      [];

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
      const textWidth = Math.max(70, titleSafe.length * 7 + 16);
      const textOffsetLeft = x > width - 180;
      const labelX = textOffsetLeft ? x - textWidth - 12 : x + 14;
      const labelRectX = textOffsetLeft ? x - textWidth - 16 : x + 10;

      markerSvgs += `
        <g transform="translate(${x}, ${y})">
          <!-- Ping Waves -->
          <circle cx="0" cy="0" r="18" fill="${pinGlow}" />
          <circle cx="0" cy="0" r="9" fill="${pinColor}" fill-opacity="0.4" />
          <circle cx="0" cy="0" r="5" fill="${pinColor}" stroke="#ffffff" stroke-width="1.5" />
          <!-- Pill Backdrop -->
          <rect x="${labelRectX - x}" y="-13" width="${textWidth}" height="24" rx="6" fill="${pillBg}" stroke="${pillBorder}" stroke-width="1" />
          <text x="${labelX - x}" y="3" font-size="11" font-weight="700" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${titleSafe}</text>
        </g>
      `;
    });

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

    // Header card with auto-sizing to eliminate text overflow
    const mapTitle = mapData.title || 'Geographic Overview';
    const titleLength = mapTitle.length;
    const headerWidth = Math.min(width - 40, Math.max(300, titleLength * 8.4 + 48));
    const headerHeight = 52;

    const centerCoords = parseCoordinates(mapData.center) || (validMarkers[0]?.coords ?? [0, 20]);
    const [cx, cy] = project(centerCoords[0], centerCoords[1]);
    const zoomLevel = mapData.zoom ?? 2;
    const coordLabel = `Coordinates: ${centerCoords[1].toFixed(2)}°N, ${centerCoords[0].toFixed(2)}°E | Zoom: ${zoomLevel}x`;

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
        
        <!-- Center Target Reticle -->
        <g transform="translate(${cx}, ${cy})">
          <circle cx="0" cy="0" r="7" fill="none" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="2,2" />
          <circle cx="0" cy="0" r="2.5" fill="#3b82f6" />
        </g>
        
        <!-- Interactive Marker Points -->
        ${markerSvgs}
        
        <!-- Layer Badges -->
        ${layerBadges}
        
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

function escapeXml(unsafe?: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
