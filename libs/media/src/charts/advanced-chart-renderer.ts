import type { ChartBlock } from '@ai-news/schemas';
import { escapeXml } from '@ai-news/shared';
import {
  area,
  bin,
  chord,
  curveMonotoneX,
  Delaunay,
  line,
  max,
  min,
  quantile,
  ribbon,
  scaleLinear,
  scalePoint,
  stack,
  stackOffsetWiggle,
  type Chord,
  type ChordSubgroup,
} from 'd3';
import { DEFAULT_PALETTE, formatChartValue, getNiceTicks, safeColor } from './chart-helpers';

/**
 * The chart types that need a drawing routine of their own.
 *
 * They live here rather than in the main chart renderer so that neither file
 * has to know about the other: the main renderer hands these types over, and
 * this one draws them.
 */
export const ADVANCED_CHART_TYPES = [
  'streamgraph',
  'calendar_heatmap',
  'parallel_coordinates',
  'box_plot',
  'funnel',
  'waffle',
  'ridge',
  'chord',
  'voronoi',
] as const;

export type AdvancedChartType = (typeof ADVANCED_CHART_TYPES)[number];

export function isAdvancedChartType(value: string): value is AdvancedChartType {
  return (ADVANCED_CHART_TYPES as readonly string[]).includes(value);
}

interface Series {
  name: string;
  key: string;
  color: string;
}

interface Canvas {
  bgColor: string;
  textColor: string;
  subtextColor: string;
  gridColor: string;
  padding: { top: number; right: number; bottom: number; left: number };
  chartW: number;
  chartH: number;
  width: number;
  height: number;
}

/** Reads the series out of the payload, with the house palette applied. */
function readSeries(chartData: ChartBlock['data']): Series[] {
  return chartData.series.map((series, index) => ({
    name: series.name,
    key: series.key,
    color: safeColor(series.color, DEFAULT_PALETTE[index % DEFAULT_PALETTE.length]),
  }));
}

/** The values of one series, row by row. */
function valuesOf(chartData: ChartBlock['data'], key: string): number[] {
  return chartData.values.map((row) => Number(row[key] ?? 0));
}

function makeCanvas(
  width: number,
  height: number,
  isDark: boolean,
  padding: { top: number; right: number; bottom: number; left: number }
): Canvas {
  return {
    bgColor: isDark ? '#0f172a' : '#ffffff',
    textColor: isDark ? '#f8fafc' : '#0f172a',
    subtextColor: isDark ? '#94a3b8' : '#64748b',
    gridColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    padding,
    chartW: width - padding.left - padding.right,
    chartH: height - padding.top - padding.bottom,
    width,
    height,
  };
}

/** The heading every chart draws above its plot. */
function heading(chartData: ChartBlock['data'], canvas: Canvas): string {
  let elements = `<text x="${canvas.padding.left}" y="30" font-size="17" font-weight="700" fill="${canvas.textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(chartData.title)}</text>`;
  if (chartData.subtitle) {
    elements += `<text x="${canvas.padding.left}" y="50" font-size="12" fill="${canvas.subtextColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(chartData.subtitle)}</text>`;
  }
  return elements;
}

/** The attribution line every chart draws below its plot. */
function source(chartData: ChartBlock['data'], canvas: Canvas): string {
  if (!chartData.sourceAttribution) return '';
  return `<text x="${canvas.padding.left}" y="${canvas.height - 16}" font-size="11" fill="${canvas.subtextColor}" font-style="italic" font-family="system-ui, -apple-system, sans-serif">Source: ${escapeXml(chartData.sourceAttribution)}</text>`;
}

/** Wraps the drawing in an SVG element. */
function wrap(chartData: ChartBlock['data'], canvas: Canvas, elements: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas.width} ${canvas.height}" width="100%" height="100%" style="background-color: ${canvas.bgColor}; border-radius: 12px;" role="img" aria-label="${escapeXml(chartData.title)}">${elements}</svg>`;
}

/** A legend drawn along the bottom of a chart. */
function legend(series: Series[], x: number, y: number, textColor: string): string {
  let elements = '';
  let offset = x;
  for (const item of series) {
    elements += `<rect x="${offset}" y="${y - 9}" width="10" height="10" rx="2" fill="${item.color}"/>`;
    elements += `<text x="${offset + 15}" y="${y}" font-size="11" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(item.name)}</text>`;
    offset += 22 + item.name.length * 6.2;
  }
  return elements;
}

export class AdvancedChartRenderer {
  /**
   * Draws one of the chart types that need a drawing routine of their own.
   */
  static renderToSvg(
    chartData: ChartBlock['data'],
    options: { width?: number; height?: number; theme?: 'dark' | 'light' } = {}
  ): string {
    const width = options.width ?? 800;
    const height = options.height ?? 450;
    const isDark = options.theme !== 'light';

    switch (chartData.chartType) {
      case 'streamgraph':
        return this.renderStreamgraph(chartData, width, height, isDark);
      case 'calendar_heatmap':
        return this.renderCalendarHeatmap(chartData, width, height, isDark);
      case 'parallel_coordinates':
        return this.renderParallelCoordinates(chartData, width, height, isDark);
      case 'box_plot':
        return this.renderBoxPlot(chartData, width, height, isDark);
      case 'funnel':
        return this.renderFunnel(chartData, width, height, isDark);
      case 'waffle':
        return this.renderWaffle(chartData, width, height, isDark);
      case 'ridge':
        return this.renderRidge(chartData, width, height, isDark);
      case 'chord':
        return this.renderChord(chartData, width, height, isDark);
      case 'voronoi':
        return this.renderVoronoi(chartData, width, height, isDark);
      default:
        return '';
    }
  }

  /* --------------------------------------------------------------------- *
   * Streamgraph
   * --------------------------------------------------------------------- */

  /**
   * A theme river: the shape of each series is read from the thickness of
   * the band it makes, not from a line, so the reader sees the whole story
   * as one silhouette.
   */
  private static renderStreamgraph(
    chartData: ChartBlock['data'],
    width: number,
    height: number,
    isDark: boolean
  ): string {
    const canvas = makeCanvas(width, height, isDark, {
      top: 76,
      right: 40,
      bottom: 64,
      left: 56,
    });
    const series = readSeries(chartData);
    const xKey = chartData.xAxis.key;
    const categories = chartData.values.map((row) => String(row[xKey] ?? ''));

    const keyed = chartData.values.map((row) => {
      const entry: Record<string, number> = {};
      for (const item of series) entry[item.key] = Number(row[item.key] ?? 0);
      return entry;
    });

    const layers = stack<Record<string, number>>()
      .keys(series.map((item) => item.key))
      .offset(stackOffsetWiggle)(keyed);

    const flat = layers.flatMap((layer) => layer.flatMap((point) => [point[0], point[1]]));
    const low = min(flat) ?? 0;
    const high = max(flat) ?? 1;

    const scaleX = scaleLinear()
      .domain([0, Math.max(1, categories.length - 1)])
      .range([canvas.padding.left, canvas.padding.left + canvas.chartW]);
    const scaleY = scaleLinear()
      .domain([low, high === low ? low + 1 : high])
      .range([canvas.padding.top + canvas.chartH, canvas.padding.top]);

    let elements = heading(chartData, canvas);

    for (const tick of getNiceTicks(low, high, 4).ticks) {
      const y = scaleY(tick);
      elements += `<line x1="${canvas.padding.left}" y1="${y}" x2="${canvas.padding.left + canvas.chartW}" y2="${y}" stroke="${canvas.gridColor}" stroke-dasharray="3,3"/>`;
      elements += `<text x="${canvas.padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="${canvas.subtextColor}" font-family="system-ui, sans-serif">${escapeXml(formatChartValue(tick, high - low))}</text>`;
    }

    const areaBuilder = area<[number, number]>()
      .x((_point, index) => scaleX(index))
      .y0((point) => scaleY(point[0]))
      .y1((point) => scaleY(point[1]))
      .curve(curveMonotoneX);

    layers.forEach((layer, index) => {
      const color = series[index]?.color ?? DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];
      elements += `<path d="${areaBuilder(layer as unknown as Array<[number, number]>)}" fill="${color}" fill-opacity="0.8" stroke="${color}" stroke-width="1"/>`;
    });

    // Only some of the labels are drawn, or they overlap.
    const labelStep = Math.max(1, Math.ceil(categories.length / 8));
    categories.forEach((category, index) => {
      if (index % labelStep !== 0) return;
      elements += `<text x="${scaleX(index)}" y="${canvas.padding.top + canvas.chartH + 22}" text-anchor="middle" font-size="11" fill="${canvas.subtextColor}" font-family="system-ui, sans-serif">${escapeXml(category)}</text>`;
    });

    elements += legend(series, canvas.padding.left, canvas.height - 34, canvas.textColor);
    elements += source(chartData, canvas);
    return wrap(chartData, canvas, elements);
  }

  /* --------------------------------------------------------------------- *
   * Calendar heatmap
   * --------------------------------------------------------------------- */

  /**
   * A calendar: one square per day, arranged in weeks. The shape of the
   * year is the point — a single spike in a line chart says nothing about
   * where in the year it fell.
   */
  private static renderCalendarHeatmap(
    chartData: ChartBlock['data'],
    width: number,
    height: number,
    isDark: boolean
  ): string {
    const canvas = makeCanvas(width, height, isDark, {
      top: 78,
      right: 30,
      bottom: 78,
      left: 46,
    });
    const series = readSeries(chartData);
    const xKey = chartData.xAxis.key;
    const valueKey = series[0]?.key;

    const readings: Array<{ date: Date; value: number }> = [];
    for (const row of chartData.values) {
      const parsed = new Date(String(row[xKey] ?? ''));
      if (Number.isNaN(parsed.getTime())) continue;
      readings.push({ date: parsed, value: Number(row[valueKey ?? ''] ?? 0) });
    }

    if (readings.length === 0) {
      return wrap(
        chartData,
        canvas,
        `${heading(chartData, canvas)}<text x="${canvas.padding.left}" y="120" font-size="13" fill="${canvas.subtextColor}" font-family="system-ui, sans-serif">No dates could be read from the data.</text>`
      );
    }

    const values = readings.map((reading) => reading.value);
    const low = min(values) ?? 0;
    const high = max(values) ?? 1;

    // The grid starts on the Sunday on or before the first reading.
    const first = new Date(Math.min(...readings.map((reading) => reading.date.getTime())));
    const last = new Date(Math.max(...readings.map((reading) => reading.date.getTime())));
    const gridStart = new Date(first);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());
    const dayMs = 24 * 60 * 60 * 1000;
    const weeks = Math.ceil((last.getTime() - gridStart.getTime()) / dayMs / 7) + 1;

    const cell = Math.max(
      6,
      Math.min(
        Math.floor(canvas.chartW / Math.max(1, weeks)) - 2,
        Math.floor(canvas.chartH / 7) - 2
      )
    );
    const gridWidth = cell * weeks;

    const scaleX = scalePoint<number>()
      .domain(Array.from({ length: weeks }, (_value, index) => index))
      .range([canvas.padding.left, canvas.padding.left + gridWidth - cell]);

    let elements = heading(chartData, canvas);

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    let lastMonth = -1;
    for (let week = 0; week < weeks; week++) {
      const date = new Date(gridStart.getTime() + week * 7 * dayMs);
      if (date.getMonth() !== lastMonth && date.getDate() <= 7) {
        lastMonth = date.getMonth();
        elements += `<text x="${(scaleX(week) ?? canvas.padding.left).toFixed(2)}" y="${canvas.padding.top - 12}" font-size="11" fill="${canvas.subtextColor}" font-family="system-ui, sans-serif">${monthNames[date.getMonth()]}</text>`;
      }
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach((name, index) => {
      elements += `<text x="${canvas.padding.left - 8}" y="${(canvas.padding.top + index * cell + cell / 2 + 4).toFixed(2)}" text-anchor="end" font-size="10" fill="${canvas.subtextColor}" font-family="system-ui, sans-serif">${name}</text>`;
    });

    for (const reading of readings) {
      const week = Math.floor((reading.date.getTime() - gridStart.getTime()) / dayMs / 7);
      const day = reading.date.getDay();
      const x = scaleX(week);
      if (x === undefined) continue;
      const ratio = high === low ? 0 : (reading.value - low) / (high - low);
      const r = Math.round(isDark ? 15 + ratio * 44 : 241 - ratio * 204);
      const g = Math.round(isDark ? 23 + ratio * 107 : 245 - ratio * 146);
      const b = Math.round(isDark ? 42 + ratio * 204 : 249 - ratio * 14);
      elements += `<rect x="${(x + 1).toFixed(2)}" y="${(canvas.padding.top + day * cell + 1).toFixed(2)}" width="${cell - 2}" height="${cell - 2}" rx="2" fill="rgb(${r}, ${g}, ${b})" data-value="${reading.value}"><title>${escapeXml(
        `${reading.date.toISOString().slice(0, 10)}: ${reading.value}`
      )}</title></rect>`;
    }

    const legendWidth = 120;
    const legendX = canvas.padding.left + canvas.chartW - legendWidth;
    const legendY = canvas.height - 42;
    elements += `<defs><linearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${isDark ? '#0f172a' : '#f1f5f9'}"/><stop offset="100%" stop-color="#3b82f6"/></linearGradient></defs>`;
    elements += `<text x="${legendX - 8}" y="${legendY + 10}" text-anchor="end" font-size="10" fill="${canvas.subtextColor}" font-family="system-ui, sans-serif">${escapeXml(String(low))}</text>`;
    elements += `<rect x="${legendX}" y="${legendY}" width="${legendWidth}" height="10" rx="3" fill="url(#calGrad)"/>`;
    elements += `<text x="${legendX + legendWidth + 8}" y="${legendY + 10}" font-size="10" fill="${canvas.subtextColor}" font-family="system-ui, sans-serif">${escapeXml(String(high))}</text>`;

    elements += source(chartData, canvas);
    return wrap(chartData, canvas, elements);
  }

  /* --------------------------------------------------------------------- *
   * Parallel coordinates
   * --------------------------------------------------------------------- */

  /**
   * Every record is drawn as a line across every axis. Patterns — the
   * records that rise together — are what this is for.
   */
  private static renderParallelCoordinates(
    chartData: ChartBlock['data'],
    width: number,
    height: number,
    isDark: boolean
  ): string {
    const canvas = makeCanvas(width, height, isDark, {
      top: 76,
      right: 50,
      bottom: 66,
      left: 56,
    });
    const series = readSeries(chartData);
    const groupKey = chartData.groupKey;

    const groups = new Set<string>();
    for (const row of chartData.values) {
      const group = groupKey ? String(row[groupKey] ?? '') : '';
      if (group) groups.add(group);
    }
    const groupList = Array.from(groups).sort();
    const groupColor = (group: string): string =>
      groupList.length === 0
        ? DEFAULT_PALETTE[0]
        : DEFAULT_PALETTE[groupList.indexOf(group) % DEFAULT_PALETTE.length];

    const scaleX = scaleLinear()
      .domain([0, Math.max(1, series.length - 1)])
      .range([canvas.padding.left, canvas.padding.left + canvas.chartW]);

    const bounds = series.map((item) => {
      const values = valuesOf(chartData, item.key);
      const low = min(values) ?? 0;
      const high = max(values) ?? 0;
      return { low, high: high === low ? low + 1 : high };
    });

    let elements = heading(chartData, canvas);

    series.forEach((item, index) => {
      const x = scaleX(index);
      const bound = bounds[index];
      elements += `<line x1="${x}" y1="${canvas.padding.top}" x2="${x}" y2="${canvas.padding.top + canvas.chartH}" stroke="${canvas.subtextColor}" stroke-opacity="0.35" stroke-width="1.5"/>`;
      elements += `<text x="${x}" y="${canvas.padding.top + canvas.chartH + 20}" text-anchor="middle" font-size="12" font-weight="600" fill="${canvas.textColor}" font-family="system-ui, sans-serif">${escapeXml(item.name)}</text>`;
      elements += `<text x="${x}" y="${canvas.padding.top - 10}" text-anchor="middle" font-size="10" fill="${canvas.subtextColor}" font-family="system-ui, sans-serif">${escapeXml(formatChartValue(bound.high, bound.high - bound.low))}</text>`;
      elements += `<text x="${x}" y="${canvas.padding.top + canvas.chartH + 36}" text-anchor="middle" font-size="10" fill="${canvas.subtextColor}" font-family="system-ui, sans-serif">${escapeXml(formatChartValue(bound.low, bound.high - bound.low))}</text>`;
    });

    const pathBuilder = line<number>()
      .x((_value, index) => scaleX(index))
      .y((value, index) => {
        const bound = bounds[index];
        return (
          canvas.padding.top +
          canvas.chartH -
          ((value - bound.low) / (bound.high - bound.low)) * canvas.chartH
        );
      });

    chartData.values.forEach((row) => {
      const points = series.map((item) => Number(row[item.key] ?? 0));
      const group = groupKey ? String(row[groupKey] ?? '') : '';
      const color = group ? groupColor(group) : DEFAULT_PALETTE[0];
      elements += `<path d="${pathBuilder(points)}" fill="none" stroke="${color}" stroke-width="1.4" stroke-opacity="0.55"/>`;
    });

    if (groupList.length > 0) {
      const legendSeries: Series[] = groupList.map((group, index) => ({
        name: group,
        key: group,
        color: DEFAULT_PALETTE[index % DEFAULT_PALETTE.length],
      }));
      elements += legend(legendSeries, canvas.padding.left, canvas.height - 20, canvas.textColor);
    }

    elements += source(chartData, canvas);
    return wrap(chartData, canvas, elements);
  }

  /* --------------------------------------------------------------------- *
   * Box plot
   * --------------------------------------------------------------------- */

  /**
   * The distribution of a measurement within each group: the middle half of
   * the data as a box, the median as a line, and the outliers beyond.
   */
  private static renderBoxPlot(
    chartData: ChartBlock['data'],
    width: number,
    height: number,
    isDark: boolean
  ): string {
    const canvas = makeCanvas(width, height, isDark, {
      top: 76,
      right: 40,
      bottom: 64,
      left: 62,
    });
    const series = readSeries(chartData);
    const valueKey = series[0]?.key ?? '';
    const groupKey = chartData.groupKey;

    const grouped = new Map<string, number[]>();
    for (const row of chartData.values) {
      const group = groupKey ? String(row[groupKey] ?? '') : 'All';
      const bucket = grouped.get(group) ?? [];
      bucket.push(Number(row[valueKey] ?? 0));
      grouped.set(group, bucket);
    }

    const groups = Array.from(grouped.keys());
    const allValues = Array.from(grouped.values()).flat();
    if (groups.length === 0 || allValues.length === 0) {
      return wrap(chartData, canvas, heading(chartData, canvas));
    }

    const low = min(allValues) ?? 0;
    const high = max(allValues) ?? 1;
    const tickInfo = getNiceTicks(low, high, 5);
    const scaleY = scaleLinear()
      .domain([tickInfo.min, tickInfo.max === tickInfo.min ? tickInfo.min + 1 : tickInfo.max])
      .range([canvas.padding.top + canvas.chartH, canvas.padding.top]);

    const bandWidth = canvas.chartW / groups.length;
    const boxWidth = Math.min(64, bandWidth * 0.55);

    let elements = heading(chartData, canvas);

    for (const tick of tickInfo.ticks) {
      const y = scaleY(tick);
      elements += `<line x1="${canvas.padding.left}" y1="${y}" x2="${canvas.padding.left + canvas.chartW}" y2="${y}" stroke="${canvas.gridColor}" stroke-dasharray="3,3"/>`;
      elements += `<text x="${canvas.padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="${canvas.subtextColor}" font-family="system-ui, sans-serif">${escapeXml(
        chartData.yAxis.format
          ? `${chartData.yAxis.format}${formatChartValue(tick, high - low)}`
          : formatChartValue(tick, high - low)
      )}</text>`;
    }

    groups.forEach((group, index) => {
      const values = (grouped.get(group) ?? []).slice().sort((a, b) => a - b);
      const q1 = quantile(values, 0.25) ?? 0;
      const medianValue = quantile(values, 0.5) ?? 0;
      const q3 = quantile(values, 0.75) ?? 0;
      const spread = q3 - q1;
      const lowFence = q1 - 1.5 * spread;
      const highFence = q3 + 1.5 * spread;
      const inside = values.filter((value) => value >= lowFence && value <= highFence);
      const whiskerLow = inside.length > 0 ? (min(inside) ?? q1) : q1;
      const whiskerHigh = inside.length > 0 ? (max(inside) ?? q3) : q3;
      const outliers = values.filter((value) => value < lowFence || value > highFence);

      const centre = canvas.padding.left + bandWidth * index + bandWidth / 2;
      const color = series[0]?.color ?? DEFAULT_PALETTE[0];

      elements += `<g data-group="${escapeXml(group)}">`;
      elements += `<line x1="${centre}" y1="${scaleY(whiskerLow)}" x2="${centre}" y2="${scaleY(whiskerHigh)}" stroke="${canvas.subtextColor}" stroke-width="1.5"/>`;
      elements += `<line x1="${centre - boxWidth / 4}" y1="${scaleY(whiskerLow)}" x2="${centre + boxWidth / 4}" y2="${scaleY(whiskerLow)}" stroke="${canvas.subtextColor}" stroke-width="1.5"/>`;
      elements += `<line x1="${centre - boxWidth / 4}" y1="${scaleY(whiskerHigh)}" x2="${centre + boxWidth / 4}" y2="${scaleY(whiskerHigh)}" stroke="${canvas.subtextColor}" stroke-width="1.5"/>`;
      elements += `<rect x="${centre - boxWidth / 2}" y="${scaleY(q3)}" width="${boxWidth}" height="${Math.max(1, scaleY(q1) - scaleY(q3))}" fill="${color}" fill-opacity="0.35" stroke="${color}" stroke-width="2" rx="3"/>`;
      elements += `<line x1="${centre - boxWidth / 2}" y1="${scaleY(medianValue)}" x2="${centre + boxWidth / 2}" y2="${scaleY(medianValue)}" stroke="${color}" stroke-width="3"/>`;
      for (const outlier of outliers) {
        elements += `<circle cx="${centre}" cy="${scaleY(outlier)}" r="3" fill="${canvas.subtextColor}" fill-opacity="0.8"><title>${escapeXml(`Outlier: ${outlier}`)}</title></circle>`;
      }
      elements += `<text x="${centre}" y="${canvas.padding.top + canvas.chartH + 22}" text-anchor="middle" font-size="12" font-weight="600" fill="${canvas.textColor}" font-family="system-ui, sans-serif">${escapeXml(group)}</text>`;
      elements += `<text x="${centre}" y="${canvas.padding.top + canvas.chartH + 38}" text-anchor="middle" font-size="10" fill="${canvas.subtextColor}" font-family="system-ui, sans-serif">n=${values.length}</text>`;
      elements += `</g>`;
    });

    elements += source(chartData, canvas);
    return wrap(chartData, canvas, elements);
  }

  /* --------------------------------------------------------------------- *
   * Funnel
   * --------------------------------------------------------------------- */

  /**
   * A funnel: the stages of a process, each showing how much is left of what
   * came before it.
   */
  private static renderFunnel(
    chartData: ChartBlock['data'],
    width: number,
    height: number,
    isDark: boolean
  ): string {
    const canvas = makeCanvas(width, height, isDark, {
      top: 76,
      right: 40,
      bottom: 60,
      left: 150,
    });
    const series = readSeries(chartData);
    const valueKey = series[0]?.key ?? '';
    const xKey = chartData.xAxis.key;

    const stages = chartData.values.map((row) => ({
      label: String(row[xKey] ?? ''),
      value: Number(row[valueKey] ?? 0),
    }));

    if (stages.length === 0) {
      return wrap(chartData, canvas, heading(chartData, canvas));
    }

    const top = max(stages.map((stage) => stage.value)) ?? 1;
    const rowHeight = canvas.chartH / stages.length;
    const barHeight = Math.min(rowHeight * 0.66, 46);

    let elements = heading(chartData, canvas);

    stages.forEach((stage, index) => {
      const widthScale = top === 0 ? 0 : stage.value / top;
      const barWidth = Math.max(2, widthScale * canvas.chartW);
      const y = canvas.padding.top + index * rowHeight + (rowHeight - barHeight) / 2;
      const color = series[0]?.color ?? DEFAULT_PALETTE[0];
      const previous = index === 0 ? null : stages[index - 1].value;
      const drop =
        previous !== null && previous > 0 ? Math.round((1 - stage.value / previous) * 100) : null;

      elements += `<g data-stage="${escapeXml(stage.label)}">`;
      elements += `<rect x="${canvas.padding.left}" y="${y}" width="${barWidth.toFixed(2)}" height="${barHeight}" fill="${color}" fill-opacity="0.85" rx="4"/>`;
      elements += `<text x="${canvas.padding.left - 12}" y="${y + barHeight / 2 + 4}" text-anchor="end" font-size="12" font-weight="600" fill="${canvas.textColor}" font-family="system-ui, sans-serif">${escapeXml(stage.label)}</text>`;
      elements += `<text x="${(canvas.padding.left + barWidth + 10).toFixed(2)}" y="${y + barHeight / 2 + 4}" font-size="12" font-weight="700" fill="${canvas.textColor}" font-family="system-ui, sans-serif">${escapeXml(formatChartValue(stage.value, top))}</text>`;
      if (drop !== null && drop > 0) {
        elements += `<text x="${(canvas.padding.left + barWidth + 10).toFixed(2)}" y="${y + barHeight / 2 + 20}" font-size="10" fill="${canvas.subtextColor}" font-family="system-ui, sans-serif">−${drop}% from the previous stage</text>`;
      }
      elements += `</g>`;
    });

    elements += source(chartData, canvas);
    return wrap(chartData, canvas, elements);
  }

  /* --------------------------------------------------------------------- *
   * Waffle
   * --------------------------------------------------------------------- */

  /**
   * A hundred squares, filled in proportion. The reader does not have to
   * read a percentage off an axis to see that one group is twice the size
   * of another.
   */
  private static renderWaffle(
    chartData: ChartBlock['data'],
    width: number,
    height: number,
    isDark: boolean
  ): string {
    const canvas = makeCanvas(width, height, isDark, {
      top: 80,
      right: 200,
      bottom: 60,
      left: 40,
    });
    const series = readSeries(chartData);
    const valueKey = series[0]?.key ?? '';
    const xKey = chartData.xAxis.key;

    const entries = chartData.values.map((row) => ({
      label: String(row[xKey] ?? ''),
      value: Number(row[valueKey] ?? 0),
    }));

    const total = entries.reduce((sum, entry) => sum + entry.value, 0);
    if (total <= 0) {
      return wrap(chartData, canvas, heading(chartData, canvas));
    }

    const gridSize = 10;
    const cell = Math.min(
      Math.floor(canvas.chartW / gridSize) - 4,
      Math.floor((canvas.height - canvas.padding.top - canvas.padding.bottom) / gridSize) - 4
    );
    const gridPixels = cell * gridSize;
    const originX = canvas.padding.left;
    const originY = canvas.padding.top;

    let elements = heading(chartData, canvas);

    let filled = 0;
    const legendRows: Array<{ label: string; color: string; share: number }> = [];

    entries.forEach((entry, index) => {
      const color = series[index]?.color ?? DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];
      const share = entry.value / total;
      const count = Math.round(share * gridSize * gridSize);
      legendRows.push({ label: entry.label, color, share });

      for (let square = 0; square < count; square++) {
        const position = filled + square;
        const column = Math.floor(position / gridSize);
        const row = position % gridSize;
        elements += `<rect x="${originX + column * cell + 1}" y="${originY + row * cell + 1}" width="${cell - 2}" height="${cell - 2}" rx="2" fill="${color}"/>`;
      }
      filled += count;
    });

    // The remaining squares are left empty rather than filled with a colour
    // that means something.
    const totalSquares = gridSize * gridSize;
    for (let position = filled; position < totalSquares; position++) {
      const column = Math.floor(position / gridSize);
      const row = position % gridSize;
      elements += `<rect x="${originX + column * cell + 1}" y="${originY + row * cell + 1}" width="${cell - 2}" height="${cell - 2}" rx="2" fill="${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}"/>`;
    }

    const legendX = originX + gridPixels + 36;
    legendRows.forEach((row, index) => {
      const y = originY + 12 + index * 30;
      elements += `<rect x="${legendX}" y="${y - 10}" width="14" height="14" rx="3" fill="${row.color}"/>`;
      elements += `<text x="${legendX + 22}" y="${y + 1}" font-size="12" font-weight="600" fill="${canvas.textColor}" font-family="system-ui, sans-serif">${escapeXml(row.label)}</text>`;
      elements += `<text x="${legendX + 22}" y="${y + 16}" font-size="11" fill="${canvas.subtextColor}" font-family="system-ui, sans-serif">${escapeXml(`${Math.round(row.share * 100)}%`)}</text>`;
    });

    elements += source(chartData, canvas);
    return wrap(chartData, canvas, elements);
  }

  /* --------------------------------------------------------------------- *
   * Ridgeline
   * --------------------------------------------------------------------- */

  /**
   * One distribution per group, stacked so that they overlap like hills.
   * Comparing the shapes of many groups at once is what this is for.
   */
  private static renderRidge(
    chartData: ChartBlock['data'],
    width: number,
    height: number,
    isDark: boolean
  ): string {
    const canvas = makeCanvas(width, height, isDark, {
      top: 76,
      right: 40,
      bottom: 64,
      left: 110,
    });
    const series = readSeries(chartData);
    const valueKey = series[0]?.key ?? '';
    const groupKey = chartData.groupKey;

    const grouped = new Map<string, number[]>();
    for (const row of chartData.values) {
      const group = groupKey ? String(row[groupKey] ?? '') : 'All';
      const bucket = grouped.get(group) ?? [];
      bucket.push(Number(row[valueKey] ?? 0));
      grouped.set(group, bucket);
    }

    const groups = Array.from(grouped.keys());
    if (groups.length === 0) {
      return wrap(chartData, canvas, heading(chartData, canvas));
    }

    const allValues = Array.from(grouped.values()).flat();
    const low = min(allValues) ?? 0;
    const high = max(allValues) ?? 1;
    const binCount = 16;
    const histogram = bin()
      .domain([low, high === low ? low + 1 : high])
      .thresholds(binCount);

    const ridgeHeight = canvas.chartH / groups.length;
    const scaleX = scaleLinear()
      .domain([low, high === low ? low + 1 : high])
      .range([canvas.padding.left, canvas.padding.left + canvas.chartW]);

    let elements = heading(chartData, canvas);

    groups.forEach((group, index) => {
      const values = grouped.get(group) ?? [];
      const bins = histogram(values);
      const peak = max(bins, (b) => b.length) ?? 1;
      const baseline = canvas.padding.top + ridgeHeight * index + ridgeHeight * 0.82;
      const color = series[index]?.color ?? DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];

      const points = bins
        .map((entry) => {
          const midpoint = entry.x0 !== undefined ? (entry.x0 + (entry.x1 ?? entry.x0)) / 2 : low;
          return `${scaleX(midpoint).toFixed(2)},${(baseline - (entry.length / peak) * ridgeHeight * 0.72).toFixed(2)}`;
        })
        .join(' L');

      if (points) {
        const first = bins[0];
        const last = bins[bins.length - 1];
        const startX = scaleX(first?.x0 ?? low).toFixed(2);
        const endX = scaleX(last?.x1 ?? high).toFixed(2);
        elements += `<path d="M${startX},${baseline.toFixed(2)} L${points} L${endX},${baseline.toFixed(2)} Z" fill="${color}" fill-opacity="0.55" stroke="${color}" stroke-width="1.5"/>`;
      }

      elements += `<text x="${canvas.padding.left - 12}" y="${(baseline - 6).toFixed(2)}" text-anchor="end" font-size="12" font-weight="600" fill="${canvas.textColor}" font-family="system-ui, sans-serif">${escapeXml(group)}</text>`;
    });

    elements += `<text x="${canvas.padding.left}" y="${canvas.padding.top - 12}" font-size="11" fill="${canvas.subtextColor}" font-family="system-ui, sans-serif">${escapeXml(String(low))}</text>`;
    elements += `<text x="${canvas.padding.left + canvas.chartW}" y="${canvas.padding.top - 12}" text-anchor="end" font-size="11" fill="${canvas.subtextColor}" font-family="system-ui, sans-serif">${escapeXml(String(high))}</text>`;

    elements += source(chartData, canvas);
    return wrap(chartData, canvas, elements);
  }

  /* --------------------------------------------------------------------- *
   * Chord
   * --------------------------------------------------------------------- */

  /**
   * A chord diagram: who sends to whom, and how much. The ribbons are
   * drawn between two arcs, and their thickness is the quantity.
   */
  private static renderChord(
    chartData: ChartBlock['data'],
    width: number,
    height: number,
    isDark: boolean
  ): string {
    const canvas = makeCanvas(width, height, isDark, {
      top: 80,
      right: 40,
      bottom: 60,
      left: 40,
    });
    const series = readSeries(chartData);
    const valueKey = series[0]?.key ?? '';
    const groupKey = chartData.groupKey;
    const secondaryKey = chartData.secondaryKey;

    if (!groupKey || !secondaryKey) {
      return wrap(
        chartData,
        canvas,
        `${heading(chartData, canvas)}<text x="${canvas.padding.left}" y="120" font-size="13" fill="${canvas.subtextColor}" font-family="system-ui, sans-serif">A chord diagram needs both a group key and a second key to read its matrix from.</text>`
      );
    }

    const rowNames = Array.from(
      new Set(chartData.values.map((row) => String(row[groupKey] ?? '')))
    );
    const columnNames = Array.from(
      new Set(chartData.values.map((row) => String(row[secondaryKey] ?? '')))
    );
    if (rowNames.length === 0 || columnNames.length === 0) {
      return wrap(chartData, canvas, heading(chartData, canvas));
    }

    const matrix: number[][] = rowNames.map(() => new Array<number>(columnNames.length).fill(0));
    for (const row of chartData.values) {
      const r = rowNames.indexOf(String(row[groupKey] ?? ''));
      const c = columnNames.indexOf(String(row[secondaryKey] ?? ''));
      if (r < 0 || c < 0) continue;
      matrix[r][c] += Number(row[valueKey] ?? 0);
    }

    const radius = Math.min(canvas.chartW, canvas.chartH) / 2 - 20;
    const centreX = canvas.padding.left + canvas.chartW / 2;
    const centreY = canvas.padding.top + canvas.chartH / 2;

    const layout = chord()
      .padAngle(0.02)
      .sortSubgroups((a, b) => b - a)(matrix);

    const ribbonBuilder = ribbon<Chord, ChordSubgroup>().radius(radius);

    let elements = heading(chartData, canvas);

    layout.forEach((arc) => {
      const path = ribbonBuilder(arc);
      const color = DEFAULT_PALETTE[arc.source.index % DEFAULT_PALETTE.length];
      elements += `<path d="${path ?? ''}" fill="${color}" fill-opacity="0.55" stroke="${color}" stroke-width="0.5" data-source="${escapeXml(rowNames[arc.source.index] ?? '')}" data-target="${escapeXml(columnNames[arc.target.index] ?? '')}"/>`;
    });

    layout.groups.forEach((group, index) => {
      const midAngle = (group.startAngle + group.endAngle) / 2;
      const labelRadius = radius + 14;
      const x = centreX + labelRadius * Math.sin(midAngle);
      const y = centreY - labelRadius * Math.cos(midAngle);
      const color = DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];
      elements += `<path d="${arcPath(centreX, centreY, radius - 6, group.startAngle, group.endAngle)}" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="butt"/>`;
      elements += `<text x="${x.toFixed(2)}" y="${(y + 4).toFixed(2)}" font-size="11" font-weight="600" text-anchor="middle" fill="${canvas.textColor}" font-family="system-ui, sans-serif">${escapeXml(rowNames[index] ?? '')}</text>`;
    });

    elements += source(chartData, canvas);
    return wrap(chartData, canvas, elements);
  }

  /* --------------------------------------------------------------------- *
   * Voronoi
   * --------------------------------------------------------------------- */

  /**
   * Every measurement is a cell in a mosaic. The cells are coloured by how
   * large the measurement is, so the shape of the space is shown as well as
   * the numbers in it.
   */
  private static renderVoronoi(
    chartData: ChartBlock['data'],
    width: number,
    height: number,
    isDark: boolean
  ): string {
    const canvas = makeCanvas(width, height, isDark, {
      top: 80,
      right: 40,
      bottom: 60,
      left: 56,
    });
    const series = readSeries(chartData);
    const valueKey = series[0]?.key ?? '';
    const xKey = chartData.xAxis.key;
    const secondaryKey = chartData.secondaryKey;

    if (!secondaryKey) {
      return wrap(
        chartData,
        canvas,
        `${heading(chartData, canvas)}<text x="${canvas.padding.left}" y="120" font-size="13" fill="${canvas.subtextColor}" font-family="system-ui, sans-serif">A voronoi diagram needs a second key for the vertical measurement.</text>`
      );
    }

    const points = chartData.values
      .map((row) => ({
        x: Number(row[xKey] ?? 0),
        y: Number(row[secondaryKey] ?? 0),
        value: Number(row[valueKey] ?? 0),
        label: String(row[chartData.groupKey ?? xKey] ?? ''),
      }))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

    if (points.length < 2) {
      return wrap(chartData, canvas, heading(chartData, canvas));
    }

    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const scaleX = scaleLinear()
      .domain([min(xs) ?? 0, max(xs) ?? 1])
      .range([canvas.padding.left, canvas.padding.left + canvas.chartW]);
    const scaleY = scaleLinear()
      .domain([min(ys) ?? 0, max(ys) ?? 1])
      .range([canvas.padding.top + canvas.chartH, canvas.padding.top]);

    const positions = points.map((point) => [scaleX(point.x), scaleY(point.y)] as [number, number]);
    const cells = Delaunay.from(positions).voronoi([
      canvas.padding.left,
      canvas.padding.top,
      canvas.padding.left + canvas.chartW,
      canvas.padding.top + canvas.chartH,
    ]);
    const values = points.map((point) => point.value);
    const low = min(values) ?? 0;
    const high = max(values) ?? 1;

    let elements = heading(chartData, canvas);

    points.forEach((point, index) => {
      const cell = cells.cellPolygon(index);
      if (!cell) return;
      const ratio = high === low ? 0 : (point.value - low) / (high - low);
      const r = Math.round(isDark ? 30 + ratio * 25 : 226 - ratio * 190);
      const g = Math.round(isDark ? 41 + ratio * 89 : 232 - ratio * 133);
      const b = Math.round(isDark ? 59 + ratio * 187 : 240 - ratio * 5);
      /*
       * A polygon's `points` are a list of coordinates, not a path.
       *
       * They are written `x,y x,y x,y`, so the cells are joined with a
       * space. Joined with `L` they are read as path data, and the
       * browser rejects the whole shape.
       */
      const path = cell
        .map((position: [number, number]) => `${position[0].toFixed(2)},${position[1].toFixed(2)}`)
        .join(' ');
      elements += `<polygon points="${path}" fill="rgb(${r}, ${g}, ${b})" stroke="${canvas.bgColor}" stroke-width="1.5" data-label="${escapeXml(point.label)}"><title>${escapeXml(
        `${point.label}: ${point.value}`
      )}</title></polygon>`;
    });

    for (const point of points) {
      elements += `<circle cx="${scaleX(point.x).toFixed(2)}" cy="${scaleY(point.y).toFixed(2)}" r="2.5" fill="${canvas.bgColor}" fill-opacity="0.85"/>`;
    }

    elements += source(chartData, canvas);
    return wrap(chartData, canvas, elements);
  }
}

/**
 * The path of an arc, drawn as a ring segment.
 *
 * The angles are in radians, measured clockwise from the top of the circle,
 * which is the convention the chord layout uses.
 */
function arcPath(
  centreX: number,
  centreY: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const startX = centreX + radius * Math.sin(startAngle);
  const startY = centreY - radius * Math.cos(startAngle);
  const endX = centreX + radius * Math.sin(endAngle);
  const endY = centreY - radius * Math.cos(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M${startX.toFixed(2)},${startY.toFixed(2)} A${radius},${radius} 0 ${largeArc} 1 ${endX.toFixed(2)},${endY.toFixed(2)}`;
}
