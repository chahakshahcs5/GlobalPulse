import type { SensitivityBlock } from '@ai-news/schemas';
import { escapeXml, evaluateExpression } from '@ai-news/shared';

export interface RenderSensitivityOptions {
  width?: number;
  height?: number;
  theme?: 'dark' | 'light';
}

/**
 * One input's effect on the outcome, holding every other input at base.
 */
export interface SensitivitySwing {
  id: string;
  label: string;
  unit?: string;
  note?: string;
  low: number;
  high: number;
  base: number;
  /** Output when this input is at its low end. */
  outputLow: number;
  /** Output when this input is at its high end. */
  outputHigh: number;
  /** Absolute size of the swing the input causes. */
  swing: number;
}

/**
 * Whether an expression refers to a given input.
 *
 * An input the model never mentions cannot affect the outcome. Showing it
 * with a zero swing would tell the reader the assumption does not matter,
 * when the truth is that the model ignores it.
 */
export function expressionReferencesInput(expression: string, id: string): boolean {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^A-Za-z0-9_])${escaped}([^A-Za-z0-9_]|$)`).test(expression);
}

/**
 * Tornado (swing) renderer for sensitivity analysis.
 *
 * The block stores a base case and a range for each input, plus the
 * expression that produces the output. The renderer moves one input at a time
 * to the ends of its range and measures how far the outcome travels — the
 * standard way to show which assumption actually drives a result.
 */
export class SensitivityRenderer {
  /**
   * Compute the swing each input causes.
   *
   * Every input is evaluated against the base case, so the swings are
   * directly comparable. An input whose expression cannot be evaluated is
   * skipped rather than shown as a zero swing, which would read as "this
   * input does not matter".
   */
  static computeSwings(blockData: SensitivityBlock['data']): SensitivitySwing[] {
    const baseValues: Record<string, number> = {};
    for (const input of blockData.inputs) {
      baseValues[input.id] = input.base;
    }

    const swings: SensitivitySwing[] = [];

    for (const input of blockData.inputs) {
      // The model has to mention the input for it to have any effect.
      if (!expressionReferencesInput(blockData.expression, input.id)) continue;

      const lowValues = { ...baseValues, [input.id]: input.low };
      const highValues = { ...baseValues, [input.id]: input.high };

      const outputLow = evaluateExpression(blockData.expression, lowValues);
      const outputHigh = evaluateExpression(blockData.expression, highValues);
      if (outputLow === null || outputHigh === null) continue;

      swings.push({
        id: input.id,
        label: input.label,
        unit: input.unit,
        note: input.note,
        low: input.low,
        high: input.high,
        base: input.base,
        outputLow,
        outputHigh,
        swing: Math.abs(outputHigh - outputLow),
      });
    }

    // Largest swing first — the reader wants the dominant assumption first.
    return swings.sort((a, b) => b.swing - a.swing);
  }

  /** Inputs the model never mentions, and therefore cannot move. */
  static getUnreferencedInputs(blockData: SensitivityBlock['data']) {
    return blockData.inputs.filter(
      (input) => !expressionReferencesInput(blockData.expression, input.id)
    );
  }

  /**
   * Notices the reader should see alongside the chart.
   *
   * Two things can quietly mislead here: an input the model never mentions
   * (which would otherwise show a zero swing and read as "this assumption
   * does not matter"), and a stated base case that disagrees with the model.
   */
  static getNotices(blockData: SensitivityBlock['data']): string[] {
    const notices: string[] = [];

    const unreferenced = SensitivityRenderer.getUnreferencedInputs(blockData);
    if (unreferenced.length > 0) {
      const plural = unreferenced.length === 1;
      notices.push(
        `${unreferenced.length} input${plural ? '' : 's'} (${unreferenced
          .map((i) => i.label)
          .join(', ')}) ${plural ? 'is' : 'are'} not referenced by the model and ${
          plural ? 'was' : 'were'
        } excluded.`
      );
    }

    const baseValues: Record<string, number> = {};
    for (const input of blockData.inputs) {
      baseValues[input.id] = input.base;
    }
    const computedBase = evaluateExpression(blockData.expression, baseValues);
    if (
      computedBase !== null &&
      Math.abs(computedBase - blockData.baseOutput) >
        Math.max(0.01, Math.abs(blockData.baseOutput) * 0.005)
    ) {
      notices.push(
        `The stated base case (${formatValue(blockData.baseOutput)}) differs from the model's base case (${formatValue(computedBase)}).`
      );
    }

    return notices;
  }

  static renderToSvg(
    blockData: SensitivityBlock['data'],
    options: RenderSensitivityOptions = {}
  ): string {
    const width = options.width || 800;
    const height = options.height || 460;
    const isDark = options.theme !== 'light';

    const bgColor = isDark ? '#0f172a' : '#ffffff';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subtextColor = isDark ? '#94a3b8' : '#64748b';

    const swings = SensitivityRenderer.computeSwings(blockData);

    // The reference line marks the base case of the *same model* that produces
    // the swings, so the chart is internally consistent.
    const baseValues: Record<string, number> = {};
    for (const input of blockData.inputs) {
      baseValues[input.id] = input.base;
    }
    const computedBase = evaluateExpression(blockData.expression, baseValues);
    const baseOutput = computedBase ?? blockData.baseOutput;

    const padding = { top: 78, right: 92, bottom: 60, left: 210 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    let elements = '';
    elements += `<text x="${padding.left}" y="30" font-size="17" font-weight="700" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(blockData.title)}</text>`;
    if (blockData.subtitle) {
      elements += `<text x="${padding.left}" y="50" font-size="12" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(blockData.subtitle)}</text>`;
    }

    if (swings.length === 0) {
      elements += `<text x="${width / 2}" y="${height / 2}" text-anchor="middle" font-size="13" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">The model could not be evaluated for these inputs.</text>`;
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: ${bgColor}; border-radius: 12px;" role="img" aria-label="${escapeXml(blockData.title)}">${elements}</svg>`;
    }

    // Scale covers every output the inputs can produce, plus the base case.
    let minOut = baseOutput;
    let maxOut = baseOutput;
    for (const swing of swings) {
      minOut = Math.min(minOut, swing.outputLow, swing.outputHigh);
      maxOut = Math.max(maxOut, swing.outputLow, swing.outputHigh);
    }
    if (maxOut === minOut) {
      maxOut = minOut + Math.abs(minOut || 1) * 0.1;
    }

    const scaleX = (val: number) => padding.left + ((val - minOut) / (maxOut - minOut)) * chartW;
    const rowH = chartH / swings.length;

    // Base case reference line
    const baseX = scaleX(baseOutput);
    elements += `<line x1="${baseX}" y1="${padding.top - 10}" x2="${baseX}" y2="${padding.top + chartH + 6}" stroke="${subtextColor}" stroke-opacity="0.6" stroke-width="1.5" stroke-dasharray="5,4" />`;
    elements += `<text x="${baseX}" y="${padding.top - 16}" text-anchor="middle" font-size="10" font-weight="700" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">base ${escapeXml(formatValue(baseOutput))}</text>`;

    swings.forEach((swing, idx) => {
      const cy = padding.top + idx * rowH + rowH / 2;
      const barH = Math.min(26, rowH * 0.55);
      const left = scaleX(Math.min(swing.outputLow, swing.outputHigh));
      const right = scaleX(Math.max(swing.outputLow, swing.outputHigh));

      // The input's explored range, so the reader sees what was varied.
      const rangeText = `${formatValue(swing.low)} – ${formatValue(swing.high)}${swing.unit ? ` ${swing.unit}` : ''}`;
      elements += `<text x="${padding.left - 16}" y="${cy + 4}" text-anchor="end" font-size="12" font-weight="600" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(swing.label)}</text>`;
      elements += `<text x="${padding.left - 16}" y="${cy + 18}" text-anchor="end" font-size="10" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(rangeText)}</text>`;

      // The swing itself.
      const isDown = swing.outputHigh < swing.outputLow;
      elements += `<rect x="${left}" y="${cy - barH / 2}" width="${Math.max(2, right - left)}" height="${barH}" rx="3" fill="${isDown ? '#f43f5e' : '#10b981'}" fill-opacity="0.75" />`;

      // Swing magnitude, on the outside of the bar.
      const label = `${formatValue(Math.abs(swing.swing))}`;
      const labelX = right + 10;
      elements += `<text x="${labelX}" y="${cy + 4}" font-size="11" font-weight="700" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(label)}</text>`;
    });

    // Output axis label
    elements += `<text x="${padding.left + chartW / 2}" y="${height - 16}" text-anchor="middle" font-size="11" font-weight="600" fill="${subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(`${blockData.outputLabel}${blockData.outputUnit ? ` (${blockData.outputUnit})` : ''}`)}</text>`;

    if (blockData.sourceAttribution) {
      elements += `<text x="${width - 24}" y="${height - 12}" text-anchor="end" font-size="10" fill="${subtextColor}" font-style="italic" font-family="system-ui, -apple-system, sans-serif">Source: ${escapeXml(blockData.sourceAttribution)}</text>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: ${bgColor}; border-radius: 12px; overflow: hidden;" role="img" aria-label="${escapeXml(blockData.title)}">${elements}</svg>`;
  }
}

function formatValue(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs === 0) return '0';
  if (abs >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (abs >= 1) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return value.toLocaleString(undefined, { maximumFractionDigits: 3 });
}
