import { describe, it, expect } from 'vitest';
import {
  UncertaintyBlockSchema,
  StoryBlockSchema,
  getBlockDefinition,
  listBlockTypes,
  zodToJsonSchema,
} from '@ai-news/schemas';
import { UncertaintyRenderer } from '@ai-news/media';
import { extractTextContent } from '@ai-news/content';

const base = { id: 'blk_unc_test', sortOrder: 0 };

const validData = {
  title: 'Projected electricity demand, 2030',
  unit: 'TWh',
  intervalLabel: '95% credible interval',
  confidenceLevel: 0.95,
  points: [
    { label: 'IEA', value: 9400, low: 8800, high: 10100, n: 12000, sourceId: 'src_iea' },
    { label: 'Analyst consensus', value: 9100, low: 8400, high: 9900 },
  ],
  referenceValue: 9000,
  referenceLabel: '2025 level',
  methodology: '5th-95th percentile across 12,000 scenario draws.',
  sourceAttribution: 'GlobalPulse Energy Desk',
};

describe('Uncertainty block', () => {
  it('validates estimates with confidence intervals', () => {
    const block = UncertaintyBlockSchema.parse({
      ...base,
      blockType: 'uncertainty',
      data: validData,
    });

    expect(block.data.points).toHaveLength(2);
    expect(block.data.points[0].n).toBe(12000);
    expect(block.data.referenceValue).toBe(9000);
    expect(block.data.confidenceLevel).toBeCloseTo(0.95);
  });

  it('is part of the story block union', () => {
    const parsed = StoryBlockSchema.parse({
      ...base,
      blockType: 'uncertainty',
      data: validData,
    });
    expect(parsed.blockType).toBe('uncertainty');
  });

  it('rejects a block with no points', () => {
    expect(() =>
      UncertaintyBlockSchema.parse({
        ...base,
        blockType: 'uncertainty',
        data: { ...validData, points: [] },
      })
    ).toThrow();
  });

  it('rejects a point with a non-numeric estimate', () => {
    expect(() =>
      UncertaintyBlockSchema.parse({
        ...base,
        blockType: 'uncertainty',
        data: {
          ...validData,
          points: [{ label: 'Bad', value: 'lots', low: 1, high: 2 }],
        },
      })
    ).toThrow();
  });

  it('rejects a confidence level outside 0-1', () => {
    expect(() =>
      UncertaintyBlockSchema.parse({
        ...base,
        blockType: 'uncertainty',
        data: { ...validData, confidenceLevel: 95 },
      })
    ).toThrow();
  });

  it('is registered with a category, example and JSON schema', () => {
    expect(listBlockTypes()).toContain('uncertainty');

    const definition = getBlockDefinition('uncertainty');
    expect(definition?.category).toBe('data');
    expect(definition?.example).toBeDefined();
    expect(definition?.recommendedFor).toContain('forecasts');

    const jsonSchema = zodToJsonSchema(definition!.schema) as {
      properties: Record<string, { type?: string; properties?: Record<string, { type?: string }> }>;
      required: string[];
    };
    // The registry schema is the whole block, so the payload sits under `data`.
    expect(jsonSchema.properties.data?.properties?.points).toBeDefined();
    expect(jsonSchema.properties.data?.properties?.title).toBeDefined();
    expect(jsonSchema.required).toContain('data');
  });

  describe('renderer', () => {
    it('draws a whisker and a point estimate for every estimate', () => {
      const svg = UncertaintyRenderer.renderToSvg(validData as never, {
        width: 800,
        height: 460,
        theme: 'light',
      });

      expect(svg).toContain('<svg');
      expect(svg).toContain('Projected electricity demand, 2030');

      // One point marker per estimate (the legend marker carries no data-val).
      expect((svg.match(/<circle[^>]*data-val=/g) ?? []).length).toBe(2);
      // Four whisker caps (two per estimate).
      expect((svg.match(/stroke-width="2.5"/g) ?? []).length).toBe(4);

      // The interval is shown, not just the headline number.
      expect(svg).toContain('8,800');
      expect(svg).toContain('10,100');
      expect(svg).toContain('95% credible interval');
    });

    it('draws the reference line with its label', () => {
      const svg = UncertaintyRenderer.renderToSvg(validData as never, { theme: 'light' });
      expect(svg).toContain('2025 level');
      expect(svg).toContain('#f59e0b');
    });

    it('shows the sample size when the producer recorded one', () => {
      const svg = UncertaintyRenderer.renderToSvg(validData as never, { theme: 'light' });
      expect(svg).toContain('n=12000');
    });

    it('keeps the whole interval inside the canvas', () => {
      // A single estimate whose interval reaches the far right of the scale.
      const svg = UncertaintyRenderer.renderToSvg(
        {
          ...validData,
          points: [{ label: 'Wide', value: 100, low: 10, high: 100 }],
          referenceValue: undefined,
        } as never,
        { width: 800, height: 460, theme: 'light' }
      );

      // The high bound is drawn at the right edge of the plot area, which
      // leaves room for the value label beside it.
      const caps = svg.match(/x1="([\d.]+)" y1="[\d.-]+" x2="([\d.]+)"/g) ?? [];
      expect(caps.length).toBeGreaterThan(0);
      const maxX = Math.max(...Array.from(svg.matchAll(/x2="([\d.]+)"/g)).map((m) => Number(m[1])));
      expect(maxX).toBeLessThan(800);
    });

    it('escapes label text', () => {
      const svg = UncertaintyRenderer.renderToSvg(
        {
          ...validData,
          points: [{ label: '<script>alert(1)</script>', value: 1, low: 0, high: 2 }],
        } as never,
        { theme: 'light' }
      );
      expect(svg).not.toContain('<script>');
      expect(svg).toContain('&lt;script&gt;');
    });
  });

  it('contributes its text to the extracted article body', () => {
    const text = extractTextContent([
      {
        id: 'blk_unc_test',
        blockType: 'uncertainty',
        sortOrder: 0,
        data: validData,
      } as never,
    ]);

    expect(text).toContain('Projected electricity demand, 2030');
    expect(text).toContain('IEA');
    expect(text).toContain('Analyst consensus');
  });
});
