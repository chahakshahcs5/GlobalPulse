import { NUMBER_LOCALE } from '../format';
import type { RegressionBlock } from '@ai-news/schemas';
import { escapeXml } from '@ai-news/shared';
import { RegressionModel } from '../analysis/regression-model';

/**
 * Regression renderer.
 *
 * The scatter is the point: a fitted curve on its own says nothing about
 * how tight the measurements are. The curve is drawn over the measurements,
 * the band around it shows how much of the spread the fit actually accounts
 * for, and the fit statistics are written out underneath rather than left
 * for the reader to infer.
 */

export interface RenderRegressionOptions {
  width?: number;
  height?: number;
  theme?: 'dark' | 'light';
  showTitle?: boolean;
}

export class RegressionRenderer {
  /**
   * Draws the scatter, the fit and — when asked for — the residuals.
   */
  static renderToSvg(
    blockData: RegressionBlock['data'],
    options: RenderRegressionOptions = {}
  ): string {
    const width = options.width ?? 800;
    const height = options.height ?? 460;
    const isDark = options.theme !== 'light';

    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subtextColor = isDark ? '#94a3b8' : '#64748b';
    const titleColor = isDark ? '#ffffff' : '#0f172a';
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

    const fit = RegressionModel.fit(blockData);
    if (!fit) {
      return `<svg viewBox="0 0 ${width} ${height}" role="img" xmlns="http://www.w3.org/2000/svg"><text x="16" y="32" font-size="13" fill="${subtextColor}">There are not enough measurements to fit a curve to these points.</text></svg>`;
    }

    const showTitle = options.showTitle ?? false;
    const showResiduals = blockData.showResiduals ?? false;
    const titleHeight = showTitle && blockData.title ? 42 : 0;
    const statsHeight = 62;
    const residualHeight = showResiduals ? 90 : 0;
    const plotHeight = height - titleHeight - statsHeight - residualHeight - 12;

    const xs = blockData.points.map((point) => point.x);
    const ys = blockData.points.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const padY = (maxY - minY) * 0.1 || Math.abs(maxY) * 0.1 || 1;
    const lowerY = minY - padY;
    const upperY = maxY + padY;

    const margin = { left: 56, right: 20, top: titleHeight + 16, bottom: 40 };
    const plotWidth = width - margin.left - margin.right;

    const scaleX = (value: number): number =>
      maxX === minX
        ? margin.left + plotWidth / 2
        : margin.left + ((value - minX) / (maxX - minX)) * plotWidth;
    const scaleY = (value: number): number =>
      upperY === lowerY
        ? margin.top + plotHeight / 2
        : margin.top + plotHeight - ((value - lowerY) / (upperY - lowerY)) * plotHeight;

    const parts: string[] = [];
    parts.push(
      `<svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" xmlns="http://www.w3.org/2000/svg" aria-label="${escapeXml(blockData.title ?? 'Regression')}">`
    );

    // Grid and axes.
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
    parts.push(
      `<line x1="${margin.left}" y1="${(margin.top + plotHeight).toFixed(2)}" x2="${(width - margin.right).toFixed(2)}" y2="${(margin.top + plotHeight).toFixed(2)}" stroke="${isDark ? '#475569' : '#cbd5e1'}" stroke-width="1"/>`
    );

    // The band around the fit.
    if (blockData.showConfidenceBand ?? true) {
      const confidence = blockData.confidenceLevel ?? 0.95;
      const samples = 60;
      const upper: string[] = [];
      const lower: string[] = [];
      for (let index = 0; index <= samples; index++) {
        const x = minX + ((maxX - minX) * index) / samples;
        const band = fit.band(x, confidence);
        if (!Number.isFinite(band.lower) || !Number.isFinite(band.upper)) continue;
        upper.push(`${scaleX(x).toFixed(2)},${scaleY(band.upper).toFixed(2)}`);
        lower.unshift(`${scaleX(x).toFixed(2)},${scaleY(band.lower).toFixed(2)}`);
      }
      if (upper.length > 1) {
        parts.push(
          `<polygon points="${upper.join(' ')} ${lower.join(' ')}" fill="#3b82f6" fill-opacity="${isDark ? 0.16 : 0.12}" stroke="none"/>`
        );
      }
    }

    // The fitted curve.
    const curve: string[] = [];
    const samples = 80;
    for (let index = 0; index <= samples; index++) {
      const x = minX + ((maxX - minX) * index) / samples;
      const y = fit.predict(x);
      if (!Number.isFinite(y)) continue;
      curve.push(`${index === 0 ? 'M' : 'L'}${scaleX(x).toFixed(2)},${scaleY(y).toFixed(2)}`);
    }
    if (curve.length > 1) {
      parts.push(
        `<path d="${curve.join(' ')}" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/>`
      );
    }

    // The measurements.
    for (const point of blockData.points) {
      const cx = scaleX(point.x);
      const cy = scaleY(point.y);
      parts.push(
        `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="4.5" fill="#3b82f6" fill-opacity="0.75" stroke="${isDark ? '#0f172a' : '#ffffff'}" stroke-width="1"><title>${escapeXml(
          `${point.label ? `${point.label}: ` : ''}${formatTick(point.x)}, ${formatTick(point.y)}`
        )}</title></circle>`
      );
    }

    // Axis labels.
    if (blockData.xLabel) {
      parts.push(
        `<text x="${(margin.left + plotWidth / 2).toFixed(2)}" y="${(margin.top + plotHeight + 28).toFixed(2)}" font-size="12" text-anchor="middle" fill="${subtextColor}">${escapeXml(blockData.xLabel)}</text>`
      );
    }
    if (blockData.yLabel) {
      parts.push(
        `<text x="14" y="${(margin.top + plotHeight / 2).toFixed(2)}" font-size="12" text-anchor="middle" fill="${subtextColor}" transform="rotate(-90 14 ${(margin.top + plotHeight / 2).toFixed(2)})">${escapeXml(blockData.yLabel)}</text>`
      );
    }

    // The residuals, beneath the plot.
    if (showResiduals) {
      const residualTop = margin.top + plotHeight + 44;
      const maxResidual = Math.max(...fit.residuals.map((entry) => Math.abs(entry.residual)), 1);
      parts.push(
        `<line x1="${margin.left}" y1="${(residualTop + 34).toFixed(2)}" x2="${(width - margin.right).toFixed(2)}" y2="${(residualTop + 34).toFixed(2)}" stroke="${isDark ? '#475569' : '#cbd5e1'}" stroke-width="1"/>`
      );
      for (const entry of fit.residuals) {
        const cx = scaleX(entry.x);
        const cy = residualTop + 34 - (entry.residual / maxResidual) * 30;
        parts.push(
          `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="3" fill="#f59e0b" fill-opacity="0.8"><title>${escapeXml(
            `Residual ${formatTick(entry.residual)}`
          )}</title></circle>`
        );
      }
      parts.push(
        `<text x="${margin.left}" y="${(residualTop + 12).toFixed(2)}" font-size="11" fill="${subtextColor}">Residuals</text>`
      );
    }

    // The statistics, written out.
    const statsTop = height - statsHeight - 4;
    parts.push(
      `<text x="0" y="${(statsTop + 14).toFixed(2)}" font-size="12" font-weight="600" fill="${textColor}">${escapeXml(fit.equation)}</text>`
    );
    const stats = [
      `R² = ${fit.rSquared.toFixed(3)}`,
      `Adjusted R² = ${fit.adjustedRSquared.toFixed(3)}`,
      `Residual standard error = ${formatTick(fit.residualStandardError)}`,
      `n = ${fit.observations}`,
    ];
    parts.push(
      `<text x="0" y="${(statsTop + 34).toFixed(2)}" font-size="11" fill="${subtextColor}">${escapeXml(stats.join('   ·   '))}</text>`
    );

    if (blockData.showEquation ?? true) {
      parts.push(
        `<text x="${width}" y="${(statsTop + 34).toFixed(2)}" font-size="11" text-anchor="end" fill="${subtextColor}">${escapeXml(
          `${fit.model} model · ${Math.round((blockData.confidenceLevel ?? 0.95) * 100)}% confidence`
        )}</text>`
      );
    }

    if (showTitle && blockData.title) {
      parts.push(
        `<text x="0" y="26" font-size="16" font-weight="700" fill="${titleColor}">${escapeXml(blockData.title)}</text>`
      );
    }
    if (blockData.caption) {
      parts.push(
        `<text x="0" y="${height - 4}" font-size="11" fill="${subtextColor}">${escapeXml(blockData.caption)}</text>`
      );
    }

    parts.push('</svg>');
    return parts.join('');
  }
}

function formatTick(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const magnitude = Math.abs(value);
  if (magnitude !== 0 && (magnitude < 0.01 || magnitude >= 1e6)) return value.toExponential(2);
  if (magnitude >= 1000) return value.toLocaleString(NUMBER_LOCALE, { maximumFractionDigits: 0 });
  return String(Math.round(value * 1000) / 1000);
}
