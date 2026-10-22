import { describe, it, expect } from 'vitest';
import { ChartBlockSchema } from '@ai-news/schemas';
import { D3ChartRenderer } from '@ai-news/media';

const base = { id: 'blk_chart_test', sortOrder: 0 };

/**
 * A chart payload that satisfies every chart type at once.
 *
 * The newer chart types read the same rows the older ones do, so one
 * payload exercises all of them. The keys it needs are declared below.
 */
function chartData(overrides: Record<string, unknown> = {}) {
  return {
    chartType: 'streamgraph',
    title: 'Every chart type, one payload',
    xAxis: { key: 'period', label: 'Period', type: 'time' },
    yAxis: { label: 'Value', unit: 'units' },
    groupKey: 'group',
    secondaryKey: 'secondary',
    series: [{ name: 'Northfield', key: 'value' }],
    values: [
      { period: '2024-01-01', group: 'One', secondary: 2, value: 10 },
      { period: '2024-02-01', group: 'One', secondary: 4, value: 20 },
      { period: '2024-03-01', group: 'Two', secondary: 6, value: 15 },
      { period: '2024-04-01', group: 'Two', secondary: 8, value: 25 },
    ],
    ...overrides,
  };
}

const NEW_CHART_TYPES = [
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

describe('The newer chart types', () => {
  it('are all registered on the chart block', () => {
    for (const type of NEW_CHART_TYPES) {
      const parsed = ChartBlockSchema.parse({
        ...base,
        blockType: 'chart',
        data: chartData({ chartType: type }),
      });
      expect(parsed.data.chartType, type).toBe(type);
    }
  });

  it('rejects a chart type it does not have', () => {
    expect(() =>
      ChartBlockSchema.parse({
        ...base,
        blockType: 'chart',
        data: chartData({ chartType: 'sunburst' }),
      })
    ).toThrow();
  });

  it('accepts the grouping keys the new types need', () => {
    const parsed = ChartBlockSchema.parse({
      ...base,
      blockType: 'chart',
      data: chartData(),
    });
    expect(parsed.data.groupKey).toBe('group');
    expect(parsed.data.secondaryKey).toBe('secondary');
  });

  it('leaves the grouping keys unset when they are not given', () => {
    const parsed = ChartBlockSchema.parse({
      ...base,
      blockType: 'chart',
      data: chartData({ groupKey: undefined, secondaryKey: undefined }),
    });
    expect(parsed.data.groupKey).toBeUndefined();
    expect(parsed.data.secondaryKey).toBeUndefined();
  });

  it('draws every one of them as an SVG', () => {
    for (const type of NEW_CHART_TYPES) {
      const svg = D3ChartRenderer.renderToSvg(chartData({ chartType: type }) as never, {
        width: 800,
        height: 450,
      });
      expect(svg, type).toContain('<svg');
      expect(svg, type).toContain('</svg>');
      expect(svg.length, type).toBeGreaterThan(100);
    }
  });

  it('says so when a chord diagram has no matrix to read', () => {
    const svg = D3ChartRenderer.renderToSvg(
      chartData({ chartType: 'chord', groupKey: undefined }) as never,
      { width: 800, height: 450 }
    );
    expect(svg).toContain('needs both a group key');
  });

  it('says so when a voronoi diagram has no second measurement', () => {
    const svg = D3ChartRenderer.renderToSvg(
      chartData({ chartType: 'voronoi', secondaryKey: undefined }) as never,
      { width: 800, height: 450 }
    );
    expect(svg).toContain('needs a second key');
  });

  it('marks the points of a calendar heatmap', () => {
    const svg = D3ChartRenderer.renderToSvg(
      chartData({
        chartType: 'calendar_heatmap',
        xAxis: { key: 'period', label: 'Date', type: 'time' },
      }) as never,
      { width: 800, height: 450 }
    );
    expect(svg).toContain('data-value=');
  });

  it('marks the boxes of a box plot', () => {
    const svg = D3ChartRenderer.renderToSvg(chartData({ chartType: 'box_plot' }) as never, {
      width: 800,
      height: 450,
    });
    expect(svg).toContain('data-group="One"');
  });
});
