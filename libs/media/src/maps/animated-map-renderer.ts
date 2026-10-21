import type { AnimatedMapBlock } from '@ai-news/schemas';
import { escapeXml } from '@ai-news/shared';
import { CONTINENT_PATHS, scaleContinentPath } from './continent-paths';

export interface RenderAnimatedMapOptions {
  width?: number;
  height?: number;
  theme?: 'dark' | 'light';
}

/**
 * Animated map renderer.
 *
 * Draws one frame of a time-based map: the points that exist at that moment,
 * sized and coloured by their value. The reader scrubs through the frames, so
 * the block shows how a situation spread rather than only its end state.
 */
export class AnimatedMapRenderer {
  static renderFrame(
    blockData: AnimatedMapBlock['data'],
    frameIndex: number,
    options: RenderAnimatedMapOptions = {}
  ): string {
    const width = options.width || 800;
    const height = options.height || 450;
    const isDark = options.theme !== 'light';

    const bgColorStart = isDark ? '#090e17' : '#f1f5f9';
    const bgColorEnd = isDark ? '#0f172a' : '#e2e8f0';
    const landColor = isDark ? '#1e293b' : '#cbd5e1';
    const landStroke = isDark ? '#334155' : '#94a3b8';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subtextColor = isDark ? '#94a3b8' : '#64748b';

    const frames = blockData.frames;
    const index = Math.max(0, Math.min(frames.length - 1, frameIndex));
    const frame = frames[index];

    // Equirectangular projection.
    const project = (lng: number, lat: number): [number, number] => [
      ((lng + 180) / 360) * width,
      ((90 - lat) / 180) * height,
    ];

    // The largest value across every frame sets the scale, so the markers do
    // not jump in size as the reader scrubs.
    let maxValue = 0;
    for (const candidate of frames) {
      for (const point of candidate.points) {
        if (point.value !== undefined) maxValue = Math.max(maxValue, Math.abs(point.value));
      }
    }

    let elements = '';

    elements += `<rect width="${width}" height="${height}" fill="url(#animatedMapBg)" />`;
    elements += `<defs><linearGradient id="animatedMapBg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="${bgColorStart}" /><stop offset="100%" stop-color="${bgColorEnd}" /></linearGradient></defs>`;

    // Graticule
    for (let lng = -180; lng <= 180; lng += 30) {
      const x = ((lng + 180) / 360) * width;
      elements += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${gridColor}" stroke-width="1" />`;
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      const y = ((90 - lat) / 180) * height;
      elements += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${gridColor}" stroke-width="1" />`;
    }
    elements += `<line x1="0" y1="${height / 2}" x2="${width}" y2="${height / 2}" stroke="${gridColor}" stroke-width="1.5" />`;

    // Land
    for (const path of CONTINENT_PATHS) {
      elements += `<path d="${scaleContinentPath(path, width, height)}" fill="${landColor}" stroke="${landStroke}" stroke-width="1" stroke-linejoin="round" />`;
    }

    // Points in this frame.
    for (const point of frame.points) {
      const [x, y] = project(point.lng, point.lat);
      const magnitude = point.value === undefined ? 0 : Math.abs(point.value);
      const ratio = maxValue > 0 ? magnitude / maxValue : 0;
      const radius = point.highlight ? 9 + ratio * 10 : 5 + ratio * 7;

      const fill = point.highlight ? '#ef4444' : '#f59e0b';
      elements += `<circle cx="${x}" cy="${y}" r="${radius + 6}" fill="${fill}" fill-opacity="0.16" />`;
      elements += `<circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}" fill-opacity="0.9" stroke="${isDark ? '#0f172a' : '#ffffff'}" stroke-width="1.5" />`;

      // The label points away from the middle of the map, so two nearby
      // locations do not end up writing over each other.
      const toTheRight = x < width / 2;
      const labelOffset = radius + 5;
      const labelX = toTheRight ? x + labelOffset : x - labelOffset;
      const labelAnchor = toTheRight ? 'start' : 'end';

      elements += `<text x="${labelX}" y="${y + 4}" text-anchor="${labelAnchor}" font-size="10" font-weight="600" fill="${textColor}" stroke="${isDark ? '#0f172a' : '#ffffff'}" stroke-width="3" paint-order="stroke" font-family="system-ui, -apple-system, sans-serif">${escapeXml(point.label)}</text>`;
    }

    // The frame's timestamp, in the corner.
    const stamp = frame.label ?? frame.at.slice(0, 10);
    elements += `<rect x="12" y="12" width="${14 + stamp.length * 7.5}" height="26" rx="6" fill="${isDark ? 'rgba(15,23,42,0.88)' : 'rgba(255,255,255,0.92)'}" stroke="${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}" />`;
    elements += `<text x="${19 + stamp.length * 3.75}" y="30" text-anchor="middle" font-size="12" font-weight="700" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(stamp)}</text>`;

    // The frame counter, so the reader knows there is more to see.
    elements += `<text x="${width - 14}" y="30" text-anchor="end" font-size="11" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${index + 1} / ${frames.length}</text>`;

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: ${bgColorEnd}; border-radius: 12px; overflow: hidden;" role="img" aria-label="${escapeXml(blockData.title)}">${elements}</svg>`;
  }
}
