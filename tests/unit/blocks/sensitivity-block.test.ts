import { describe, it, expect } from 'vitest';
import {
  SensitivityBlockSchema,
  StoryBlockSchema,
  getBlockDefinition,
  listBlockTypes,
} from '@ai-news/schemas';
import { SensitivityRenderer, expressionReferencesInput } from '@ai-news/media';
import { evaluateExpression } from '@ai-news/shared';
import { extractTextContent } from '@ai-news/content';

const base = { id: 'blk_sens_test', sortOrder: 0 };

const validData = {
  title: 'What drives the cost of a 50 MW solar farm?',
  subtitle: 'Swing in total capital cost when one assumption moves at a time',
  outputLabel: 'Total capital cost',
  outputUnit: '$m',
  baseOutput: 40,
  expression: 'capacity * panel_cost + labour + grid_connection',
  inputs: [
    { id: 'capacity', label: 'Installed capacity', base: 50, low: 45, high: 55, unit: 'MW' },
    { id: 'panel_cost', label: 'Panel cost', base: 0.6, low: 0.5, high: 0.72, unit: '$m/MW' },
    { id: 'labour', label: 'Installation labour', base: 6, low: 4, high: 9, unit: '$m' },
    { id: 'grid_connection', label: 'Grid connection', base: 4, low: 2, high: 7, unit: '$m' },
  ],
  methodology: 'Each input is varied across its range with the others held at base.',
  sourceAttribution: 'GlobalPulse Energy Desk',
};

describe('Sensitivity block', () => {
  it('validates a base case with ranges and an expression', () => {
    const block = SensitivityBlockSchema.parse({
      ...base,
      blockType: 'sensitivity',
      data: validData,
    });

    expect(block.data.inputs).toHaveLength(4);
    expect(block.data.expression).toContain('capacity');
  });

  it('is part of the story block union', () => {
    const parsed = StoryBlockSchema.parse({
      ...base,
      blockType: 'sensitivity',
      data: validData,
    });
    expect(parsed.blockType).toBe('sensitivity');
  });

  it('rejects a block with no inputs', () => {
    expect(() =>
      SensitivityBlockSchema.parse({
        ...base,
        blockType: 'sensitivity',
        data: { ...validData, inputs: [] },
      })
    ).toThrow();
  });

  it('rejects a block with no expression', () => {
    expect(() =>
      SensitivityBlockSchema.parse({
        ...base,
        blockType: 'sensitivity',
        data: { ...validData, expression: '' },
      })
    ).toThrow();
  });

  it('is registered with a category and example', () => {
    expect(listBlockTypes()).toContain('sensitivity');
    const definition = getBlockDefinition('sensitivity');
    expect(definition?.category).toBe('data');
    expect(definition?.recommendedFor).toContain('models');
  });

  describe('expression evaluation', () => {
    it('evaluates a simple arithmetic expression', () => {
      expect(evaluateExpression('a * 2 + 1', { a: 4 })).toBe(9);
    });

    it('rejects an expression that is not arithmetic', () => {
      expect(evaluateExpression('process.exit(1)', { a: 1 })).toBeNull();
      expect(evaluateExpression('globalThis', { a: 1 })).toBeNull();
    });

    it('fails closed on an unknown identifier', () => {
      expect(evaluateExpression('a + missing', { a: 1 })).toBeNull();
    });

    it('detects whether an expression references an input', () => {
      expect(expressionReferencesInput('capacity * cost', 'capacity')).toBe(true);
      expect(expressionReferencesInput('capacity * cost', 'cost')).toBe(true);
      // A partial match must not count.
      expect(expressionReferencesInput('capacity * cost', 'cap')).toBe(false);
      expect(expressionReferencesInput('capacity * cost', 'other')).toBe(false);
    });
  });

  describe('swing computation', () => {
    it('measures how far each input moves the outcome', () => {
      const swings = SensitivityRenderer.computeSwings(validData as never);

      // capacity: 45*0.6+6+4 = 37 .. 55*0.6+6+4 = 43, swing 6
      const capacity = swings.find((s) => s.id === 'capacity');
      expect(capacity?.outputLow).toBeCloseTo(37);
      expect(capacity?.outputHigh).toBeCloseTo(43);
      expect(capacity?.swing).toBeCloseTo(6);

      // panel_cost: 50*0.5+6+4 = 35 .. 50*0.72+6+4 = 46, swing 11
      const panel = swings.find((s) => s.id === 'panel_cost');
      expect(panel?.swing).toBeCloseTo(11);
    });

    it('orders the inputs by how much they move the outcome', () => {
      const swings = SensitivityRenderer.computeSwings(validData as never);
      expect(swings[0].id).toBe('panel_cost');
      // The swings are non-increasing.
      for (let i = 1; i < swings.length; i++) {
        expect(swings[i].swing).toBeLessThanOrEqual(swings[i - 1].swing);
      }
    });

    it('excludes an input the model never references', () => {
      const data = {
        ...validData,
        expression: 'capacity * panel_cost',
        inputs: [
          ...validData.inputs,
          { id: 'grid_connection', label: 'Grid connection', base: 4, low: 2, high: 7 },
        ],
      };

      const swings = SensitivityRenderer.computeSwings(data as never);
      // A zero swing would tell the reader the assumption does not matter,
      // when the truth is that the model ignores it.
      expect(swings.find((s) => s.id === 'grid_connection')).toBeUndefined();
      expect(swings).toHaveLength(2);
    });

    it('skips an input whose expression cannot be evaluated', () => {
      const swings = SensitivityRenderer.computeSwings({
        ...validData,
        expression: 'capacity * missing_variable',
      } as never);
      expect(swings).toHaveLength(0);
    });
  });

  describe('notices', () => {
    it('warns when the stated base case disagrees with the model', () => {
      const notices = SensitivityRenderer.getNotices({
        ...validData,
        baseOutput: 55,
      } as never);

      expect(notices.join(' ')).toMatch(/differs from the model/i);
    });

    it('stays quiet when the stated base case matches the model', () => {
      expect(SensitivityRenderer.getNotices(validData as never)).toEqual([]);
    });

    it('warns when an input is not referenced by the model', () => {
      const notices = SensitivityRenderer.getNotices({
        ...validData,
        expression: 'capacity * panel_cost',
      } as never);

      expect(notices.join(' ')).toMatch(/not referenced by the model/i);
      expect(notices.join(' ')).toContain('Grid connection');
    });
  });

  describe('renderer', () => {
    it('draws one bar per input and a base reference line', () => {
      const svg = SensitivityRenderer.renderToSvg(validData as never, {
        width: 800,
        height: 460,
        theme: 'light',
      });

      expect(svg).toContain('<svg');
      expect(svg).toContain('What drives the cost of a 50 MW solar farm?');
      expect((svg.match(/<rect/g) ?? []).length).toBe(4);
      expect(svg).toContain('base 40');
      expect(svg).toContain('Total capital cost ($m)');
    });

    it('labels each input with the range that was explored', () => {
      const svg = SensitivityRenderer.renderToSvg(validData as never, { theme: 'light' });
      expect(svg).toContain('45 – 55 MW');
      expect(svg).toContain('0.5 – 0.72 $m/MW');
    });

    it('escapes label text', () => {
      const svg = SensitivityRenderer.renderToSvg(
        {
          ...validData,
          // The expression has to reference only the surviving input, or the
          // model cannot be evaluated at all.
          expression: 'capacity',
          inputs: [
            { id: 'capacity', label: '<script>alert(1)</script>', base: 1, low: 0, high: 2 },
          ],
        } as never,
        { theme: 'light' }
      );
      expect(svg).not.toContain('<script>');
      expect(svg).toContain('&lt;script&gt;');
    });

    it('says so when the model cannot be evaluated', () => {
      const svg = SensitivityRenderer.renderToSvg(
        { ...validData, expression: 'capacity * missing' } as never,
        { theme: 'light' }
      );
      expect(svg).toMatch(/could not be evaluated/i);
    });
  });

  it('contributes its text to the extracted article body', () => {
    const text = extractTextContent([
      { ...base, blockType: 'sensitivity', data: validData } as never,
    ]);

    expect(text).toContain('What drives the cost of a 50 MW solar farm?');
    expect(text).toContain('Installed capacity');
    expect(text).toContain('Panel cost');
  });
});
