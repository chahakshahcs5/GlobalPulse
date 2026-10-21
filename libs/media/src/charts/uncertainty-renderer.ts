import type { UncertaintyBlock } from '@ai-news/schemas';
import { escapeXml } from '@ai-news/shared';

export interface RenderUncertaintyOptions {
  width?: number;
  height?: number;
  theme?: 'dark' | 'light';
  /**
   * Whether to draw the title inside the SVG.
   *
   * A block that already shows the title as a real heading turns this off,
   * so the reader is not shown the same title twice.
   */
  showTitle?: boolean;
}

/**
 * Interval (forest) plot renderer.
 *
 * Every other chart in the platform asserts a point estimate with no error
 * bars, which is the single biggest credibility gap in newsroom data
 * graphics. This renderer draws each estimate as a point marker with a
 * whisker spanning its interval, so the reader can see both the headline
 * number and how sure it is.
 */
export class UncertaintyRenderer {
  static renderToSvg(
    blockData: UncertaintyBlock['data'],
    options: RenderUncertaintyOptions = {}
  ): string {
    const width = options.width || 800;
    const height = options.height || 450;
    const isDark = options.theme !== 'light';

    const bgColor = isDark ? '#0f172a' : '#ffffff';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subtextColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    const accent = isDark ? '#60a5fa' : '#2563eb';

    const points = blockData.points;

    // Bounds must include the full interval of every estimate plus the
    // reference line, otherwise a whisker would be clipped.
    let minVal = Infinity;
    let maxVal = -Infinity;
    for (const point of points) {
      minVal = Math.min(minVal, point.low, point.value);
      maxVal = Math.max(maxVal, point.high, point.value);
    }
    if (blockData.referenceValue !== undefined) {
      minVal = Math.min(minVal, blockData.referenceValue);
      maxVal = Math.max(maxVal, blockData.referenceValue);
    }
    if (!Number.isFinite(minVal) || !Number.isFinite(maxVal)) {
      minVal = 0;
      maxVal = 1;
    }
    if (maxVal === minVal) {
      maxVal = minVal + Math.abs(minVal || 1) * 0.1;
    }

    // The right padding has to hold the value and interval labels, which sit
    // past the end of the longest whisker.
    const padding = {
      top: options.showTitle === false ? 30 : 78,
      right: 132,
      bottom: 62,
      left: 190,
    };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const scaleX = (val: number) => padding.left + ((val - minVal) / (maxVal - minVal)) * chartW;
    const rowH = chartH / Math.max(1, points.length);

    // Axis ticks
    const tickCount = 5;
    const ticks: number[] = [];
    for (let i = 0; i <= tickCount; i++) {
      ticks.push(minVal + ((maxVal - minVal) * i) / tickCount);
    }

    let elements = '';
    if (options.showTitle !== false) {
      elements += `<text x="${padding.left}" y="30" font-size="17" font-weight="700" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(blockData.title)}</text>`;
      if (blockData.subtitle) {
        elements += `<text x="${padding.left}" y="50" font-size="12" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(blockData.subtitle)}</text>`;
      }
    }

    // Grid + value axis
    for (const tick of ticks) {
      const x = scaleX(tick);
      elements += `<line x1="${x}" y1="${padding.top}" x2="${x}" y2="${padding.top + chartH}" stroke="${gridColor}" stroke-dasharray="3,3" />`;
      const label = formatValue(tick);
      elements += `<text x="${x}" y="${padding.top + chartH + 20}" text-anchor="middle" font-size="11" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(label)}</text>`;
    }

    // Reference line (consensus / target). The label sits at the foot of the
    // line so it cannot collide with the legend above the plot.
    if (blockData.referenceValue !== undefined) {
      const rx = scaleX(blockData.referenceValue);
      elements += `<line x1="${rx}" y1="${padding.top - 8}" x2="${rx}" y2="${padding.top + chartH + 8}" stroke="#f59e0b" stroke-width="2" stroke-dasharray="6,4" />`;
      elements += `<text x="${rx}" y="${padding.top + chartH + 42}" text-anchor="middle" font-size="10" font-weight="700" fill="#f59e0b" font-family="system-ui, -apple-system, sans-serif">${escapeXml(blockData.referenceLabel ?? 'Reference')}</text>`;
    }

    // One row per estimate
    points.forEach((point, idx) => {
      const cy = padding.top + idx * rowH + rowH / 2;
      const lowX = scaleX(point.low);
      const highX = scaleX(point.high);
      const valueX = scaleX(point.value);

      elements += `<text x="${padding.left - 16}" y="${cy + 4}" text-anchor="end" font-size="12" font-weight="600" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(point.label)}</text>`;

      // Whisker spanning the interval
      elements += `<line x1="${lowX}" y1="${cy}" x2="${highX}" y2="${cy}" stroke="${accent}" stroke-opacity="0.55" stroke-width="4" stroke-linecap="round" />`;
      // End caps
      elements += `<line x1="${lowX}" y1="${cy - 7}" x2="${lowX}" y2="${cy + 7}" stroke="${accent}" stroke-width="2.5" stroke-linecap="round" />`;
      elements += `<line x1="${highX}" y1="${cy - 7}" x2="${highX}" y2="${cy + 7}" stroke="${accent}" stroke-width="2.5" stroke-linecap="round" />`;

      // Point estimate
      elements += `<circle cx="${valueX}" cy="${cy}" r="6" fill="${accent}" stroke="${bgColor}" stroke-width="2" data-val="${point.value}" />`;

      // Value + interval labels
      const range = maxVal - minVal;
      const valueLabel = formatValue(point.value);
      const intervalLabel = `${formatValue(point.low)} – ${formatValue(point.high)}`;
      elements += `<text x="${highX + 14}" y="${cy + 4}" font-size="11" font-weight="700" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(valueLabel)}</text>`;
      elements += `<text x="${highX + 14}" y="${cy + 18}" font-size="10" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(intervalLabel)}</text>`;

      // Sample size, when the producer recorded one.
      if (point.n !== undefined) {
        elements += `<text x="${padding.left - 16}" y="${cy + 18}" text-anchor="end" font-size="10" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">n=${point.n}</text>`;
      }

      void range;
    });

    // Interval legend
    const legendY = 64;
    elements += `<g transform="translate(${padding.left}, ${legendY})">
      <line x1="0" y1="0" x2="22" y2="0" stroke="${accent}" stroke-opacity="0.55" stroke-width="4" stroke-linecap="round" />
      <circle cx="11" cy="0" r="5" fill="${accent}" stroke="${bgColor}" stroke-width="2" />
      <text x="30" y="4" font-size="11" font-weight="600" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(blockData.intervalLabel ?? 'Estimate and range')}</text>
    </g>`;

    if (blockData.sourceAttribution) {
      elements += `<text x="${width - padding.right}" y="${height - 12}" text-anchor="end" font-size="10" fill="${subtextColor}" font-style="italic" font-family="system-ui, -apple-system, sans-serif">Source: ${escapeXml(blockData.sourceAttribution)}</text>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: ${bgColor}; border-radius: 12px; overflow: hidden;" role="img" aria-label="${escapeXml(blockData.title)}">${elements}</svg>`;
  }
}

/**
 * Formats an estimate for display.
 *
 * The precision follows the size of the number so a value of 43 does not
 * sprout four decimal places, while a share of 0.412 keeps three.
 */
function formatValue(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs === 0) return '0';
  if (abs >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (abs >= 1) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return value.toLocaleString(undefined, { maximumFractionDigits: 3 });
}
