import { NUMBER_LOCALE } from '../format';
import type { SurveyResultsBlock } from '@ai-news/schemas';
import { escapeXml } from '@ai-news/shared';
import { arc, pie } from 'd3';

/**
 * Survey and poll results.
 *
 * The same answers drawn four ways, because a reader takes a different thing
 * from each of them:
 *
 * - `bars` — one bar per answer. The plainest read, and the one that shows
 *   the numbers most clearly.
 * - `stack` — one bar, split. The share of the whole in a single glance.
 * - `waffle` — a hundred squares. The reader counts them rather than
 *   comparing lengths.
 * - `donut` — a ring. The share of the whole, with a hole in the middle for
 *   the headline figure.
 */

export interface RenderSurveyOptions {
  width?: number;
  height?: number;
  theme?: 'dark' | 'light';
  showTitle?: boolean;
}

const PALETTE = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#06b6d4',
  '#ef4444',
  '#64748b',
];

interface Entry {
  label: string;
  value: number;
  color: string;
}

function entriesOf(responses: Array<{ option: string; count: number; color?: string }>): Entry[] {
  return responses.map((response, index) => ({
    label: response.option,
    value: response.count,
    color: response.color ?? PALETTE[index % PALETTE.length],
  }));
}

function formatValue(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return value.toLocaleString(NUMBER_LOCALE);
}

export class SurveyResultsRenderer {
  /**
   * Draws the responses in the style the block asks for.
   */
  static renderToSvg(
    blockData: SurveyResultsBlock['data'],
    options: RenderSurveyOptions = {}
  ): string {
    const width = options.width ?? 800;
    const height = options.height ?? 400;
    const isDark = options.theme !== 'light';
    const style = blockData.style ?? 'bars';

    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subtextColor = isDark ? '#94a3b8' : '#64748b';
    const titleColor = isDark ? '#ffffff' : '#0f172a';

    const entries = entriesOf(blockData.responses);
    const total = entries.reduce((sum, entry) => sum + entry.value, 0);

    if (entries.length === 0 || total === 0) {
      return `<svg viewBox="0 0 ${width} ${height}" role="img" xmlns="http://www.w3.org/2000/svg"></svg>`;
    }

    const titleHeight = options.showTitle && blockData.title ? 44 : 0;
    const parts: string[] = [];
    parts.push(
      `<svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" xmlns="http://www.w3.org/2000/svg" aria-label="${escapeXml(blockData.title ?? blockData.question)}">`
    );

    if (options.showTitle && blockData.title) {
      parts.push(
        `<text x="0" y="26" font-size="16" font-weight="700" fill="${titleColor}">${escapeXml(blockData.title)}</text>`
      );
    }

    if (style === 'stack') {
      const barY = titleHeight + 40;
      const barHeight = 56;
      let offset = 0;
      for (const entry of entries) {
        const segment = (entry.value / total) * (width - 320);
        parts.push(
          `<rect x="${offset.toFixed(2)}" y="${barY}" width="${Math.max(1, segment - 2).toFixed(2)}" height="${barHeight}" fill="${entry.color}" rx="2"><title>${escapeXml(
            `${entry.label}: ${formatValue(entry.value)}`
          )}</title></rect>`
        );
        if (segment > 54) {
          parts.push(
            `<text x="${(offset + segment / 2).toFixed(2)}" y="${barY + barHeight / 2 + 4}" font-size="12" font-weight="700" text-anchor="middle" fill="#ffffff">${escapeXml(
              `${Math.round((entry.value / total) * 100)}%`
            )}</text>`
          );
        }
        offset += segment;
      }

      // The key sits to the right, one line per answer.
      entries.forEach((entry, index) => {
        const y = titleHeight + 20 + index * 26;
        parts.push(
          `<rect x="${width - 300}" y="${y - 10}" width="12" height="12" rx="3" fill="${entry.color}"/>`
        );
        parts.push(
          `<text x="${width - 280}" y="${y}" font-size="12" fill="${textColor}" font-family="system-ui, sans-serif">${escapeXml(entry.label)}</text>`
        );
        parts.push(
          `<text x="${width - 40}" y="${y}" font-size="12" font-weight="700" text-anchor="end" fill="${textColor}" font-family="system-ui, sans-serif">${escapeXml(
            `${Math.round((entry.value / total) * 100)}%`
          )}</text>`
        );
      });
    } else if (style === 'waffle') {
      const gridSize = 10;
      const available = Math.min(width - 320, height - titleHeight - 40);
      const cell = Math.max(10, Math.floor(available / gridSize) - 4);
      const originX = 0;
      const originY = titleHeight + 24;

      let filled = 0;
      const squares = gridSize * gridSize;
      for (const entry of entries) {
        const count = Math.round((entry.value / total) * squares);
        for (let index = 0; index < count; index++) {
          const position = filled + index;
          const column = Math.floor(position / gridSize);
          const row = position % gridSize;
          parts.push(
            `<rect x="${originX + column * cell + 2}" y="${originY + row * cell + 2}" width="${cell - 4}" height="${cell - 4}" rx="2" fill="${entry.color}"><title>${escapeXml(
              `${entry.label}: ${formatValue(entry.value)}`
            )}</title></rect>`
          );
        }
        filled += count;
      }
      for (let position = filled; position < squares; position++) {
        const column = Math.floor(position / gridSize);
        const row = position % gridSize;
        parts.push(
          `<rect x="${originX + column * cell + 2}" y="${originY + row * cell + 2}" width="${cell - 4}" height="${cell - 4}" rx="2" fill="${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}"/>`
        );
      }

      entries.forEach((entry, index) => {
        const y = titleHeight + 20 + index * 26;
        parts.push(
          `<rect x="${width - 300}" y="${y - 10}" width="12" height="12" rx="3" fill="${entry.color}"/>`
        );
        parts.push(
          `<text x="${width - 280}" y="${y}" font-size="12" fill="${textColor}" font-family="system-ui, sans-serif">${escapeXml(entry.label)}</text>`
        );
        parts.push(
          `<text x="${width - 40}" y="${y}" font-size="12" font-weight="700" text-anchor="end" fill="${textColor}" font-family="system-ui, sans-serif">${escapeXml(
            `${Math.round((entry.value / total) * 100)}%`
          )}</text>`
        );
      });
    } else if (style === 'donut') {
      const radius = Math.min(width, height - titleHeight) / 2 - 24;
      const centreX = radius + 20;
      const centreY = titleHeight + radius + 20;

      const arcs = pie<Entry>()
        .value((entry) => entry.value)
        .sort(null)(entries);

      const ring = arc<(typeof arcs)[number]>()
        .innerRadius(radius * 0.58)
        .outerRadius(radius)
        .cornerRadius(3);

      arcs.forEach((segment) => {
        const path = ring(segment);
        parts.push(
          `<path d="${path ?? ''}" fill="${segment.data.color}" stroke="${isDark ? '#0f172a' : '#ffffff'}" stroke-width="2"><title>${escapeXml(
            `${segment.data.label}: ${formatValue(segment.data.value)}`
          )}</title></path>`
        );
      });

      parts.push(
        `<text x="${centreX}" y="${centreY - 4}" font-size="30" font-weight="800" text-anchor="middle" fill="${textColor}" font-family="system-ui, sans-serif">${escapeXml(
          formatValue(total)
        )}</text>`
      );
      parts.push(
        `<text x="${centreX}" y="${centreY + 18}" font-size="11" text-anchor="middle" fill="${subtextColor}" font-family="system-ui, sans-serif">${escapeXml(
          blockData.totalRespondents ? 'respondents' : 'responses'
        )}</text>`
      );

      entries.forEach((entry, index) => {
        const y = centreY - radius + 12 + index * 26;
        const x = centreX + radius + 40;
        parts.push(
          `<rect x="${x}" y="${y - 10}" width="12" height="12" rx="3" fill="${entry.color}"/>`
        );
        parts.push(
          `<text x="${x + 20}" y="${y}" font-size="12" fill="${textColor}" font-family="system-ui, sans-serif">${escapeXml(entry.label)}</text>`
        );
        parts.push(
          `<text x="${width - 24}" y="${y}" font-size="12" font-weight="700" text-anchor="end" fill="${textColor}" font-family="system-ui, sans-serif">${escapeXml(
            `${Math.round((entry.value / total) * 100)}%`
          )}</text>`
        );
      });
    } else {
      // Bars: one bar per answer, with the count at the end of it.
      const labelWidth = 200;
      const plotLeft = labelWidth;
      const plotWidth = width - labelWidth - 120;
      const rowHeight = Math.min(48, (height - titleHeight - 40) / Math.max(1, entries.length));
      const barHeight = Math.min(28, rowHeight * 0.55);
      const peak = Math.max(...entries.map((entry) => entry.value));

      entries.forEach((entry, index) => {
        const y = titleHeight + 24 + index * rowHeight;
        const barWidth = (entry.value / peak) * plotWidth;
        parts.push(
          `<text x="${labelWidth - 14}" y="${y + barHeight / 2 + 4}" text-anchor="end" font-size="12" font-weight="600" fill="${textColor}" font-family="system-ui, sans-serif">${escapeXml(
            entry.label
          )}</text>`
        );
        parts.push(
          `<rect x="${plotLeft}" y="${y}" width="${Math.max(2, barWidth).toFixed(2)}" height="${barHeight}" fill="${entry.color}" rx="3"><title>${escapeXml(
            `${entry.label}: ${formatValue(entry.value)} (${Math.round((entry.value / total) * 100)}%)`
          )}</title></rect>`
        );
        parts.push(
          `<text x="${(plotLeft + barWidth + 10).toFixed(2)}" y="${y + barHeight / 2 + 4}" font-size="12" font-weight="700" fill="${textColor}" font-family="system-ui, sans-serif">${escapeXml(
            `${formatValue(entry.value)} · ${Math.round((entry.value / total) * 100)}%`
          )}</text>`
        );
      });
    }

    if (blockData.caption) {
      parts.push(
        `<text x="0" y="${height - 8}" font-size="11" fill="${subtextColor}" font-family="system-ui, sans-serif">${escapeXml(blockData.caption)}</text>`
      );
    }

    parts.push('</svg>');
    return parts.join('');
  }
}
