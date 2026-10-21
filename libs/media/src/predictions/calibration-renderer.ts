import type { PredictionLeaderboardBlock } from '@ai-news/schemas';
import { PredictionScorer, type CalibrationBucket } from '../predictions/prediction-scorer';

export interface RenderCalibrationOptions {
  width?: number;
  height?: number;
  theme?: 'dark' | 'light';
}

/**
 * Calibration chart.
 *
 * Plots the probability a forecaster assigned against how often the claim
 * actually came true. A perfectly calibrated forecaster lies on the
 * diagonal; the gap between the point and the diagonal is the miscalibration.
 */
export class CalibrationRenderer {
  static renderToSvg(
    blockData: PredictionLeaderboardBlock['data'],
    options: RenderCalibrationOptions = {}
  ): string {
    const width = options.width || 520;
    const height = options.height || 360;
    const isDark = options.theme !== 'light';

    const bgColor = isDark ? '#0f172a' : '#ffffff';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subtextColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

    const buckets = PredictionScorer.computeCalibration(blockData);
    const padding = { top: 52, right: 28, bottom: 54, left: 62 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const scaleX = (p: number) => padding.left + p * chartW;
    const scaleY = (p: number) => padding.top + chartH - p * chartH;

    let elements = '';
    elements += `<text x="${padding.left}" y="24" font-size="13" font-weight="700" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">Calibration</text>`;

    // Grid + axes
    for (const tick of [0, 0.25, 0.5, 0.75, 1]) {
      const y = scaleY(tick);
      elements += `<line x1="${padding.left}" y1="${y}" x2="${padding.left + chartW}" y2="${y}" stroke="${gridColor}" stroke-dasharray="3,3" />`;
      elements += `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="10" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${Math.round(tick * 100)}%</text>`;

      const x = scaleX(tick);
      elements += `<text x="${x}" y="${padding.top + chartH + 18}" text-anchor="middle" font-size="10" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${Math.round(tick * 100)}%</text>`;
    }

    // The diagonal: perfect calibration.
    elements += `<line x1="${scaleX(0)}" y1="${scaleY(0)}" x2="${scaleX(1)}" y2="${scaleY(1)}" stroke="${subtextColor}" stroke-opacity="0.45" stroke-width="1.5" stroke-dasharray="6,4" />`;
    elements += `<text x="${scaleX(1) - 4}" y="${scaleY(1) + 16}" text-anchor="end" font-size="9" fill="${subtextColor}" font-style="italic" font-family="system-ui, -apple-system, sans-serif">perfect calibration</text>`;

    // One point per bucket.
    for (const bucket of buckets) {
      if (bucket.count === 0 || bucket.actualFrequency === null) continue;
      const x = scaleX(bucket.averagePrediction ?? bucket.from);
      const y = scaleY(bucket.actualFrequency);
      const radius = Math.min(16, 6 + bucket.count * 1.5);

      elements += `<circle cx="${x}" cy="${y}" r="${radius}" fill="#3b82f6" fill-opacity="0.35" stroke="#3b82f6" stroke-width="2" />`;
      elements += `<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="10" font-weight="700" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${bucket.count}</text>`;
    }

    // Axis titles
    elements += `<text x="${padding.left + chartW / 2}" y="${height - 12}" text-anchor="middle" font-size="10" font-weight="600" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">Probability assigned</text>`;
    elements += `<text transform="rotate(-90)" x="${-(padding.top + chartH / 2)}" y="18" text-anchor="middle" font-size="10" font-weight="600" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">Actually happened</text>`;

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: ${bgColor}; border-radius: 12px;" role="img" aria-label="Calibration of tracked predictions">${elements}</svg>`;
  }
}

export type { CalibrationBucket };
