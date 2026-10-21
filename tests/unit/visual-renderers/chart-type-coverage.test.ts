import { describe, it, expect } from 'vitest';
import { D3ChartRenderer } from '@ai-news/media';
import { ChartBlockSchema, type ChartBlock } from '@ai-news/schemas';

/**
 * Every chart type the schema accepts must actually render.
 *
 * The schema used to allow seven chart types (`bump`, `dot_plot`,
 * `lollipop`, `diverging_bar`, `radar`, `small_multiples`, `sparkline`) that
 * the renderer never implemented. They validated, published, and then drew an
 * empty plot — a silent loss of the story's data. This test fails the build if
 * a type is added to the enum without a renderer to match.
 */
const CHART_TYPES = [
  'line',
  'area',
  'bar',
  'stacked_bar',
  'grouped_bar',
  'scatter',
  'heatmap',
  'histogram',
  'waterfall',
  'donut',
  'pie',
  'kpi',
  'comparison',
  'slope',
  'bump',
  'dot_plot',
  'lollipop',
  'diverging_bar',
  'radar',
  'small_multiples',
  'sparkline',
] as const;

function baseChart(chartType: (typeof CHART_TYPES)[number]): ChartBlock['data'] {
  return {
    chartType,
    title: 'Chart under test',
    subtitle: 'Rendered by the D3 engine',
    xAxis: { key: 'period', label: 'Period', type: 'category' },
    yAxis: { label: 'Value', unit: 'units' },
    series: [
      { name: 'Series A', key: 'a', color: '#3b82f6' },
      { name: 'Series B', key: 'b', color: '#10b981' },
    ],
    values: [
      { period: '2024', a: 10, b: 6, rank: 3, revenue: 120, cost: 90, north: 40 },
      { period: '2025', a: 18, b: 11, rank: 2, revenue: 160, cost: 118, north: 62 },
      { period: '2026', a: 26, b: 14, rank: 1, revenue: 210, cost: 150, north: 88 },
    ],
    facetField: 'north',
    sourceAttribution: 'GlobalPulse Analytics',
  };
}

describe('Chart type coverage', () => {
  it('exposes exactly the chart types the renderer supports', () => {
    // Guard against the enum and the renderer drifting apart again.
    const schemaEnum = (
      ChartBlockSchema.shape.data.shape.chartType as unknown as {
        options: string[];
      }
    ).options;

    expect([...schemaEnum].sort()).toEqual([...CHART_TYPES].sort());
  });

  /**
   * Minimum number of data marks each type must draw.
   *
   * A `kpi` chart is a single big number plus its delta badge, so it has
   * fewer marks than a full plot. Every other type must draw a visible
   * series; the phantom types drew none at all.
   */
  const MIN_MARKS: Record<string, number> = {
    kpi: 1,
    sparkline: 2,
    donut: 2,
    pie: 2,
  };

  it.each(CHART_TYPES)('renders a %s chart with visible data marks', (chartType) => {
    const svg = D3ChartRenderer.renderToSvg(baseChart(chartType), {
      width: 800,
      height: 450,
      theme: 'light',
    });

    expect(svg).toContain('<svg');
    expect(svg).toContain('Chart under test');

    // A chart with no data marks is the failure mode we are guarding against:
    // the axes and title render, but the plot area stays empty.
    const dataMarks = svg.match(/<(rect|circle|polygon|polyline|path)\b/g) ?? [];
    expect(dataMarks.length).toBeGreaterThanOrEqual(MIN_MARKS[chartType] ?? 3);
  });

  it('renders a bump chart with one track per series', () => {
    const svg = D3ChartRenderer.renderToSvg(baseChart('bump'));
    // Rank guides plus one polyline per series.
    expect(svg).toContain('#1');
    expect((svg.match(/<polyline/g) ?? []).length).toBe(2);
  });

  it('renders a radar chart with one polygon per series', () => {
    const svg = D3ChartRenderer.renderToSvg(baseChart('radar'));
    expect((svg.match(/<polygon/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it('renders a diverging bar chart around a zero baseline', () => {
    const chartData: ChartBlock['data'] = {
      ...baseChart('diverging_bar'),
      values: [
        { period: 'North', a: 20, b: -12 },
        { period: 'South', a: -8, b: 15 },
      ],
    };
    const svg = D3ChartRenderer.renderToSvg(chartData);
    expect((svg.match(/<rect/g) ?? []).length).toBeGreaterThanOrEqual(4);
  });

  it('renders a sparkline without axis furniture', () => {
    const svg = D3ChartRenderer.renderToSvg(baseChart('sparkline'));
    expect(svg).toContain('<polyline');
    // A sparkline has no axis ticks.
    expect(svg).not.toContain('stroke-dasharray="3,3"');
  });

  it('renders small multiples as one panel per facet', () => {
    const chartData: ChartBlock['data'] = {
      ...baseChart('small_multiples'),
      facetField: 'region',
      values: [
        { period: 'Q1', a: 10, b: 5, region: 'North' },
        { period: 'Q2', a: 18, b: 9, region: 'North' },
        { period: 'Q1', a: 7, b: 4, region: 'South' },
        { period: 'Q2', a: 12, b: 6, region: 'South' },
      ],
    };
    const svg = D3ChartRenderer.renderToSvg(chartData);
    expect(svg).toContain('North');
    expect(svg).toContain('South');
    // Two series drawn in each of the two facets.
    expect((svg.match(/<polyline/g) ?? []).length).toBe(4);
  });

  it('never emits unescaped series labels', () => {
    const chartData: ChartBlock['data'] = {
      ...baseChart('dot_plot'),
      series: [
        { name: '<script>alert(1)</script>', key: 'a' },
        { name: 'Safe', key: 'b' },
      ],
    };
    const svg = D3ChartRenderer.renderToSvg(chartData);
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
  });
});
