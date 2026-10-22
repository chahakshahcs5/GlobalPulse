import type { AnomalyBlock } from '@ai-news/schemas';
import { escapeXml } from '@ai-news/shared';
import { AnomalyDetector, type AnomalyResult } from '../analysis/anomaly-detector';

/**
 * Anomaly renderer.
 *
 * The series is drawn as a line so the shape of the data is visible, the
 * value the method expected is drawn over it, and the readings that were
 * flagged are marked. The rule that flagged them is named in the corner —
 * an unexplained red dot is a claim, not a finding.
 */

export interface RenderAnomalyOptions {
  width?: number;
  height?: number;
  theme?: 'dark' | 'light';
  showTitle?: boolean;
}

export class AnomalyRenderer {
  /**
   * Draws the series, the expectation and the flagged readings.
   */
  static renderToSvg(blockData: AnomalyBlock['data'], options: RenderAnomalyOptions = {}): string {
    const width = options.width ?? 800;
    const height = options.height ?? 440;
    const isDark = options.theme !== 'light';

    const subtextColor = isDark ? '#94a3b8' : '#64748b';
    const titleColor = isDark ? '#ffffff' : '#0f172a';
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

    const result = AnomalyDetector.detect(blockData);
    if (result.readings.length === 0) {
      return `<svg viewBox="0 0 ${width} ${height}" role="img" xmlns="http://www.w3.org/2000/svg"></svg>`;
    }

    const showTitle = options.showTitle ?? false;
    const titleHeight = showTitle && blockData.title ? 42 : 0;
    const captionHeight = blockData.caption ? 24 : 0;
    const noteHeight = 34;
    const plotHeight = height - titleHeight - captionHeight - noteHeight - 12;

    const values = result.readings.map((reading) => reading.y);
    const minY = Math.min(...values);
    const maxY = Math.max(...values);
    const padY = (maxY - minY) * 0.1 || Math.abs(maxY) * 0.1 || 1;
    const lowerY = minY - padY;
    const upperY = maxY + padY;

    const margin = { left: 56, right: 20, top: titleHeight + 16, bottom: 38 };
    const plotWidth = width - margin.left - margin.right;

    const scaleX = (index: number): number =>
      margin.left + (index / Math.max(1, result.readings.length - 1)) * plotWidth;
    const scaleY = (value: number): number =>
      upperY === lowerY
        ? margin.top + plotHeight / 2
        : margin.top + plotHeight - ((value - lowerY) / (upperY - lowerY)) * plotHeight;

    const parts: string[] = [];
    parts.push(
      `<svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" xmlns="http://www.w3.org/2000/svg" aria-label="${escapeXml(blockData.title ?? 'Anomalies')}">`
    );

    for (let index = 0; index <= 4; index++) {
      const value = lowerY + ((upperY - lowerY) * index) / 4;
      const y = scaleY(value);
      parts.push(
        `<line x1="${margin.left}" y1="${y.toFixed(2)}" x2="${(width - margin.right).toFixed(2)}" y2="${y.toFixed(2)}" stroke="${gridColor}" stroke-width="1"/>`
      );
      parts.push(
        `<text x="${margin.left - 8}" y="${(y + 4).toFixed(2)}" font-size="11" text-anchor="end" fill="${subtextColor}">${escapeXml(formatTick(value))}</text>`
      );
    }

    // The bounds the method used, where it has any.
    for (const bound of [result.lowerBound, result.upperBound]) {
      if (bound === null || !Number.isFinite(bound)) continue;
      const y = scaleY(bound);
      parts.push(
        `<line x1="${margin.left}" y1="${y.toFixed(2)}" x2="${(width - margin.right).toFixed(2)}" y2="${y.toFixed(2)}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="5 4" stroke-opacity="0.8"/>`
      );
    }

    // What the method expected.
    const expectedPath: string[] = [];
    result.readings.forEach((reading, index) => {
      if (reading.expected === null || !Number.isFinite(reading.expected)) return;
      expectedPath.push(
        `${expectedPath.length === 0 ? 'M' : 'L'}${scaleX(index).toFixed(2)},${scaleY(reading.expected).toFixed(2)}`
      );
    });
    if (expectedPath.length > 1) {
      parts.push(
        `<path d="${expectedPath.join(' ')}" fill="none" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4 4"/>`
      );
    }

    // The series itself.
    const seriesPath: string[] = [];
    result.readings.forEach((reading, index) => {
      seriesPath.push(
        `${index === 0 ? 'M' : 'L'}${scaleX(index).toFixed(2)},${scaleY(reading.y).toFixed(2)}`
      );
    });
    parts.push(
      `<path d="${seriesPath.join(' ')}" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`
    );

    // The flagged readings.
    result.readings.forEach((reading, index) => {
      const cx = scaleX(index);
      const cy = scaleY(reading.y);
      if (reading.isAnomaly) {
        parts.push(
          `<g data-anomaly="${escapeXml(reading.x)}">` +
            `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="7" fill="#ef4444" fill-opacity="0.25"/>` +
            `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="4" fill="#ef4444"/>` +
            `<title>${escapeXml(`${reading.x}: ${formatTick(reading.y)} — flagged as an anomaly`)}</title>` +
            `</g>`
        );
      } else {
        parts.push(
          `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="2.5" fill="#3b82f6" fill-opacity="0.9"/>`
        );
      }
    });

    // The rule, named.
    const noteTop = height - captionHeight - noteHeight + 4;
    parts.push(
      `<text x="0" y="${noteTop.toFixed(2)}" font-size="11" fill="${subtextColor}">${escapeXml(describeMethod(result))}</text>`
    );

    if (showTitle && blockData.title) {
      parts.push(
        `<text x="0" y="26" font-size="16" font-weight="700" fill="${titleColor}">${escapeXml(blockData.title)}</text>`
      );
    }
    if (blockData.caption) {
      parts.push(
        `<text x="0" y="${(height - 4).toFixed(2)}" font-size="11" fill="${subtextColor}">${escapeXml(blockData.caption)}</text>`
      );
    }

    parts.push('</svg>');
    return parts.join('');
  }
}

/** A sentence describing the rule that flagged the readings. */
function describeMethod(result: AnomalyResult): string {
  const count = result.anomalies.length;
  const plural = count === 1 ? 'reading was' : 'readings were';
  const threshold =
    result.method === 'percentile'
      ? `outside the ${result.threshold}–${100 - result.threshold} percentile`
      : `more than ${result.threshold} from normal`;
  const window = result.window ? ` over the last ${result.window} readings` : '';
  return `${count} ${plural} flagged · ${result.methodLabel}${window} · ${threshold}.`;
}

function formatTick(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const magnitude = Math.abs(value);
  if (magnitude !== 0 && (magnitude < 0.01 || magnitude >= 1e6)) return value.toExponential(2);
  if (magnitude >= 1000) return value.toLocaleString('en-GB', { maximumFractionDigits: 0 });
  return String(Math.round(value * 1000) / 1000);
}
