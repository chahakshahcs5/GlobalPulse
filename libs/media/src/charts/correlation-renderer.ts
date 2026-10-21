import type { CorrelationBlock } from '@ai-news/schemas';
import { escapeXml } from '@ai-news/shared';
import { CorrelationModel, type CorrelationMatrix } from '../analysis/correlation-model';

export interface RenderCorrelationOptions {
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
 * Correlation matrix renderer.
 *
 * The cell colour shows the direction and strength, but the coefficient and
 * the sample size are always printed too — colour is never the only channel,
 * and a reader can see at a glance that a coefficient derived from three
 * observations is not worth much.
 */
export class CorrelationRenderer {
  /** Blue for negative, amber for positive, neutral in the middle. */
  private static cellColor(coefficient: number | null, isDark: boolean): string {
    if (coefficient === null) return isDark ? '#334155' : '#e2e8f0';

    const neutral = isDark ? '#1e293b' : '#f1f5f9';
    const negative = isDark ? '#1d4ed8' : '#3b82f6';
    const positive = isDark ? '#b45309' : '#f59e0b';

    // Scale so the colour saturation follows |r| but never quite saturates.
    const strength = Math.min(1, Math.abs(coefficient)) * 0.85;
    const target = coefficient >= 0 ? positive : negative;

    return CorrelationRenderer.mix(neutral, target, strength);
  }

  private static mix(from: string, to: string, amount: number): string {
    const parse = (hex: string) => [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
    const a = parse(from);
    const b = parse(to);
    const blended = a.map((channel, index) => Math.round(channel + (b[index] - channel) * amount));
    return `#${blended.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
  }

  static renderToSvg(
    blockData: CorrelationBlock['data'],
    options: RenderCorrelationOptions = {}
  ): string {
    const width = options.width || 800;
    const height = options.height || 520;
    const isDark = options.theme !== 'light';

    const bgColor = isDark ? '#0f172a' : '#ffffff';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subtextColor = isDark ? '#94a3b8' : '#64748b';

    const matrix = CorrelationModel.compute(blockData);
    const count = matrix.variables.length;

    const labelWidth = 132;
    const topPad = options.showTitle === false ? 42 : 96;
    const bottomPad = 96;
    const gridW = width - labelWidth - 32;
    const gridH = height - topPad - bottomPad;
    const cellSize = Math.min(gridW, gridH) / count;

    let elements = '';
    if (options.showTitle !== false) {
      elements += `<text x="24" y="30" font-size="17" font-weight="700" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(blockData.title)}</text>`;
      if (blockData.subtitle) {
        elements += `<text x="24" y="50" font-size="12" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(blockData.subtitle)}</text>`;
      }
    }

    // Column headers
    matrix.variables.forEach((variable, index) => {
      const x = labelWidth + index * cellSize + cellSize / 2;
      elements += `<text x="${x}" y="${topPad - 12}" text-anchor="middle" font-size="11" font-weight="600" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(truncate(variable.label, 14))}</text>`;
    });

    // Rows
    for (let row = 0; row < count; row++) {
      const variable = matrix.variables[row];
      const y = topPad + row * cellSize;

      elements += `<text x="${labelWidth - 12}" y="${y + cellSize / 2 + 4}" text-anchor="end" font-size="11" font-weight="600" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(truncate(variable.label, 18))}</text>`;

      for (let column = 0; column < count; column++) {
        const cell = matrix.cells[row][column];
        const x = labelWidth + column * cellSize;

        const fill = CorrelationRenderer.cellColor(cell.coefficient, isDark);
        elements += `<rect x="${x + 1}" y="${y + 1}" width="${cellSize - 2}" height="${cellSize - 2}" rx="3" fill="${fill}" />`;

        if (blockData.showCoefficients !== false) {
          const coefficientText = cell.coefficient === null ? '—' : cell.coefficient.toFixed(2);
          // Dark text on the light positive/negative cells, light on the
          // neutral ones.
          const isNeutral = cell.coefficient === null || Math.abs(cell.coefficient) < 0.15;
          const cellText = isNeutral ? textColor : '#ffffff';

          elements += `<text x="${x + cellSize / 2}" y="${y + cellSize / 2 - 2}" text-anchor="middle" font-size="12" font-weight="700" fill="${cellText}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(coefficientText)}</text>`;
          elements += `<text x="${x + cellSize / 2}" y="${y + cellSize / 2 + 12}" text-anchor="middle" font-size="9" fill="${cellText}" fill-opacity="0.75" font-family="system-ui, -apple-system, sans-serif">n=${cell.n}</text>`;
        }

        // A significant relationship is ringed, so it survives a monochrome
        // print and a colour-blind reader.
        if (row !== column && cell.isSignificant) {
          elements += `<rect x="${x + 2.5}" y="${y + 2.5}" width="${cellSize - 5}" height="${cellSize - 5}" rx="3" fill="none" stroke="${textColor}" stroke-opacity="0.55" stroke-width="1.5" />`;
        }
      }
    }

    // Legend
    const legendY = height - bottomPad + 34;
    const legendX = 24;
    const steps = 11;
    const swatchW = 22;

    elements += `<text x="${legendX}" y="${legendY - 10}" font-size="10" font-weight="600" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">Correlation coefficient</text>`;
    for (let i = 0; i < steps; i++) {
      const r = -1 + (2 * i) / (steps - 1);
      elements += `<rect x="${legendX + i * swatchW}" y="${legendY}" width="${swatchW}" height="12" fill="${CorrelationRenderer.cellColor(r, isDark)}" />`;
    }
    elements += `<text x="${legendX - 6}" y="${legendY + 10}" text-anchor="end" font-size="9" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">-1</text>`;
    elements += `<text x="${legendX + steps * swatchW + 6}" y="${legendY + 10}" font-size="9" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">+1</text>`;

    // What the ring means.
    elements += `<circle cx="${legendX + steps * swatchW + 46}" cy="${legendY + 6}" r="5" fill="none" stroke="${textColor}" stroke-opacity="0.55" stroke-width="1.5" />`;
    elements += `<text x="${legendX + steps * swatchW + 58}" y="${legendY + 10}" font-size="9" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">statistically significant (p ≤ ${blockData.significanceThreshold ?? 0.05})</text>`;

    if (blockData.sourceAttribution) {
      elements += `<text x="${width - 24}" y="${height - 12}" text-anchor="end" font-size="10" fill="${subtextColor}" font-style="italic" font-family="system-ui, -apple-system, sans-serif">Source: ${escapeXml(blockData.sourceAttribution)}</text>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: ${bgColor}; border-radius: 12px; overflow: hidden;" role="img" aria-label="${escapeXml(blockData.title)}">${elements}</svg>`;
  }
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export type { CorrelationMatrix };
