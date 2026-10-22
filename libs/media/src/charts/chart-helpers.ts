/**
 * The small helpers every chart renderer shares.
 *
 * They live on their own so that the chart renderers can use each other
 * without importing each other: the chart renderer hands the newer chart
 * types to the advanced renderer, and the advanced renderer needs the same
 * colour checks and number formatting.
 */

/** The house palette, used when a series does not name its own colour. */
export const DEFAULT_PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

/**
 * Validates a caller-provided color before interpolating it into SVG markup.
 * Free-form strings would break out of fill="..."/stroke="..." attributes and
 * inject arbitrary SVG/HTML (executed because these SVGs are mounted via
 * dangerouslySetInnerHTML). Accepts hex colors, rgb()/rgba()/hsl() forms and
 * plain CSS color keywords; everything else falls back.
 */
export function safeColor(color: unknown, fallback: string): string {
  if (typeof color !== 'string') return fallback;
  const value = color.trim();
  if (!value || value.length > 128) return fallback;
  const hex = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
  const fnFormat = /^(?:rgba?|hsla?)\(\s*[\d.%\s,/]+\)$/i;
  const keyword = /^[a-z]+$/i;
  if (hex.test(value) || fnFormat.test(value) || keyword.test(value)) {
    return value;
  }
  return fallback;
}

/**
 * Round tick values out to numbers a reader recognises.
 *
 * A tick at 0.30000000000000004 is not a tick, it is an artefact.
 */
export function getNiceTicks(
  min: number,
  max: number,
  count = 5
): { ticks: number[]; step: number; min: number; max: number } {
  const range = max - min;
  if (range <= 0) return { ticks: [min], step: 1, min, max: min + 1 };
  const roughStep = range / count;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalizedStep = roughStep / magnitude;

  let niceStep = 1;
  if (normalizedStep < 1.5) niceStep = 1;
  else if (normalizedStep < 3) niceStep = 2;
  else if (normalizedStep < 7) niceStep = 5;
  else niceStep = 10;

  const step = Number((niceStep * magnitude).toFixed(8));
  const start = Number((Math.floor(min / step) * step).toFixed(8));
  const end = Number((Math.ceil(max / step) * step).toFixed(8));

  const ticks: number[] = [];
  for (let val = start; val <= end + step * 0.001; val += step) {
    ticks.push(Number(val.toFixed(8)));
  }
  return { ticks, step, min: start, max: end };
}

/**
 * Formats a value for an axis or a label, with the precision the range of the
 * data calls for.
 */
export function formatChartValue(val: number, range: number): string {
  if (Math.abs(val) < 1e-9) return '0';
  if (range <= 0.05) return val.toFixed(3);
  if (range <= 0.5) return val.toFixed(2);
  if (range <= 5) {
    const formatted = val.toFixed(2).replace(/\.?0+$/, '');
    return formatted === '' ? '0' : formatted;
  }
  if (range >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (range >= 10000) return `${(val / 1000).toFixed(0)}k`;
  return val % 1 === 0 ? val.toFixed(0) : val.toFixed(1);
}
