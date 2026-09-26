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
  static buildMapLibreOptions(mapData: MapBlock['data'], containerId = 'map-container'): MapLibreConfig {
    const styleUrls: Record<string, string> = {
      dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      satellite: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      streets: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    };

    return {
      container: containerId,
      style: styleUrls[mapData.style] || styleUrls.dark,
      center: mapData.center,
      zoom: mapData.zoom,
      interactive: true,
      markers: mapData.markers?.map((m) => ({
        coordinates: m.coordinates,
        title: m.title,
        description: m.description,
      })),
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
    const bgColor = isDark ? '#0b1329' : '#e2e8f0';
    const landColor = isDark ? '#1e293b' : '#cbd5e1';
    const pinColor = '#ef4444';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subtextColor = isDark ? '#94a3b8' : '#64748b';

    // Projection calculation: Equirectangular projection
    const project = (lng: number, lat: number): [number, number] => {
      const x = ((lng + 180) / 360) * width;
      const y = ((90 - lat) / 180) * height;
      return [x, y];
    };

    let markerSvgs = '';
    if (mapData.markers) {
      mapData.markers.forEach((m) => {
        const [x, y] = project(m.coordinates[0], m.coordinates[1]);
        markerSvgs += `
          <g transform="translate(${x}, ${y})">
            <circle cx="0" cy="0" r="16" fill="${pinColor}" fill-opacity="0.25" />
            <circle cx="0" cy="0" r="7" fill="${pinColor}" stroke="#ffffff" stroke-width="2" />
            <text x="12" y="4" font-size="12" font-weight="600" fill="${textColor}" font-family="system-ui, sans-serif">${escapeXml(m.title)}</text>
          </g>
        `;
      });
    }

    const [cx, cy] = project(mapData.center[0], mapData.center[1]);

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: ${bgColor}; border-radius: 12px; overflow: hidden;" role="img" aria-label="${escapeXml(mapData.title || 'Interactive Map')}">
        <rect width="${width}" height="${height}" fill="${bgColor}" />
        <!-- Stylized Globe Grid Lines -->
        <circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) * 0.45}" fill="${landColor}" fill-opacity="0.4" stroke="${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}" stroke-width="1.5" />
        <ellipse cx="${width / 2}" cy="${height / 2}" rx="${Math.min(width, height) * 0.45}" ry="${Math.min(width, height) * 0.22}" fill="none" stroke="${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}" stroke-dasharray="4,4" />
        
        <!-- Center Reticle -->
        <circle cx="${cx}" cy="${cy}" r="4" fill="#3b82f6" stroke="#ffffff" stroke-width="1.5" />
        
        ${markerSvgs}
        
        <!-- Map Title Header -->
        <rect x="20" y="20" width="260" height="48" rx="8" fill="${isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.9)'}" backdrop-filter="blur(8px)" />
        <text x="36" y="44" font-size="14" font-weight="700" fill="${textColor}" font-family="system-ui, sans-serif">${escapeXml(mapData.title || 'Geographic Overview')}</text>
        <text x="36" y="58" font-size="11" fill="${subtextColor}" font-family="system-ui, sans-serif">Coordinates: ${mapData.center[1].toFixed(2)}°N, ${mapData.center[0].toFixed(2)}°E</text>
      </svg>
    `;
  }
}

function escapeXml(unsafe?: string): string {
  if (!unsafe) return '';
  return unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
