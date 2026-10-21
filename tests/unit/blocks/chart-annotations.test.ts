import { describe, it, expect } from 'vitest';
import { ChartBlockSchema, StoryBlockSchema } from '@ai-news/schemas';
import { D3ChartRenderer } from '@ai-news/media';
import { extractTextContent } from '@ai-news/content';

const base = { id: 'blk_chart_ann', sortOrder: 0 };

const chartData = {
  chartType: 'line' as const,
  title: 'Model error rates by temperature',
  xAxis: { key: 'temp', label: 'Temperature (K)' },
  yAxis: { label: 'Error rate' },
  series: [{ name: 'Error rate', key: 'errorRate' }],
  values: [
    { temp: '2000', errorRate: 0.31 },
    { temp: '4000', errorRate: 0.24 },
    { temp: '6000', errorRate: 0.11 },
  ],
  annotations: [
    {
      id: 'ann_superconduct',
      xValue: '4000',
      label: 'Superconducting regime',
      body: 'Error rates fall sharply once the model enters the superconducting phase.',
      sourceId: 'src_paper_1',
    },
    {
      id: 'ann_limit',
      xValue: '6000',
      label: 'Classical limit',
      body: 'The curve flattens as the model approaches its classical error floor.',
    },
  ],
};

describe('Chart annotations', () => {
  it('accepts annotations anchored to a data point', () => {
    const block = ChartBlockSchema.parse({ ...base, blockType: 'chart', data: chartData });
    expect(block.data.annotations).toHaveLength(2);
    expect(block.data.annotations?.[0].xValue).toBe('4000');
  });

  it('is part of the story block union', () => {
    const parsed = StoryBlockSchema.parse({ ...base, blockType: 'chart', data: chartData });
    expect(parsed.blockType).toBe('chart');
  });

  it('rejects an annotation without a body', () => {
    expect(() =>
      ChartBlockSchema.parse({
        ...base,
        blockType: 'chart',
        data: {
          ...chartData,
          annotations: [{ id: 'a', xValue: '4000', label: 'Label' }],
        },
      })
    ).toThrow();
  });

  it('rejects an annotation with an empty label', () => {
    expect(() =>
      ChartBlockSchema.parse({
        ...base,
        blockType: 'chart',
        data: {
          ...chartData,
          annotations: [{ id: 'a', xValue: '4000', label: '', body: 'Body' }],
        },
      })
    ).toThrow();
  });

  it('leaves annotations optional so existing charts stay valid', () => {
    const parsed = ChartBlockSchema.parse({
      ...base,
      blockType: 'chart',
      data: {
        chartType: 'bar',
        title: 'Plain chart',
        xAxis: { key: 'k', label: 'K' },
        yAxis: { label: 'V' },
        series: [{ name: 'S', key: 'v' }],
        values: [{ k: 'a', v: 1 }],
      },
    });
    expect(parsed.data.annotations).toBeUndefined();
  });

  describe('renderer', () => {
    it('draws a numbered marker for each annotation', () => {
      const svg = D3ChartRenderer.renderToSvg(chartData as never, {
        width: 800,
        height: 440,
        theme: 'light',
      });

      expect(svg).toContain('chart-annotation');
      expect(svg).toContain('data-annotation-id="ann_superconduct"');
      expect(svg).toContain('data-annotation-id="ann_limit"');
      // Markers are numbered in order.
      expect(svg).toContain('>1</text>');
      expect(svg).toContain('>2</text>');
    });

    it('anchors the marker to the annotated data point', () => {
      const svg = D3ChartRenderer.renderToSvg(chartData as never, { theme: 'light' });

      // The second annotation is on the 6000 K row, so its marker must sit to
      // the right of the first annotation's marker.
      const markers = Array.from(svg.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)" r="9"/g)).map(
        (m) => ({ x: Number(m[1]), y: Number(m[2]) })
      );

      expect(markers).toHaveLength(2);
      expect(markers[1].x).toBeGreaterThan(markers[0].x);
      // The error rate falls as temperature rises, so the second marker sits
      // lower down the plot (larger y, since the y axis grows upward).
      expect(markers[1].y).toBeGreaterThan(markers[0].y);
    });

    it('skips an annotation that does not match any data point', () => {
      const svg = D3ChartRenderer.renderToSvg(
        {
          ...chartData,
          annotations: [{ id: 'ghost', xValue: '9999', label: 'Nowhere', body: 'No such point.' }],
        } as never,
        { theme: 'light' }
      );

      // A mis-anchored marker would be worse than no marker at all.
      expect(svg).not.toContain('data-annotation-id="ghost"');
    });

    it('escapes annotation labels and bodies', () => {
      const svg = D3ChartRenderer.renderToSvg(
        {
          ...chartData,
          annotations: [
            {
              id: 'x',
              xValue: '4000',
              label: '<script>alert(1)</script>',
              body: '<img src=x onerror=alert(1)>',
            },
          ],
        } as never,
        { theme: 'light' }
      );

      expect(svg).not.toContain('<script>');
      expect(svg).not.toContain('onerror=');
      expect(svg).toContain('&lt;script&gt;');
    });

    it('renders a chart with no annotations unchanged', () => {
      const svg = D3ChartRenderer.renderToSvg({ ...chartData, annotations: undefined } as never, {
        theme: 'light',
      });
      expect(svg).not.toContain('chart-annotation');
    });
  });

  it('contributes annotation text to the extracted article body', () => {
    const text = extractTextContent([{ ...base, blockType: 'chart', data: chartData } as never]);

    expect(text).toContain('Superconducting regime');
    expect(text).toContain(
      'Error rates fall sharply once the model enters the superconducting phase.'
    );
  });
});
