import { describe, it, expect } from 'vitest';
import {
  WhatIfBlockSchema,
  StoryBlockSchema,
  getBlockDefinition,
  listBlockTypes,
} from '@ai-news/schemas';
import { WhatIfModel } from '@ai-news/media';
import { extractTextContent } from '@ai-news/content';

const base = { id: 'blk_whatif_test', sortOrder: 0 };

const validData = {
  title: 'What would it take to cut household energy bills by a fifth?',
  description: 'Move the sliders to see how a retrofit programme changes the bill.',
  outcomeLabel: 'Average household bill',
  outcomeUnit: '$/year',
  expression: 'base_bill * (1 - insulation_saving) * (1 - solar_saving)',
  inputs: [
    {
      id: 'base_bill',
      label: 'Current average bill',
      min: 800,
      max: 4000,
      step: 50,
      defaultValue: 1800,
      unit: '$',
    },
    {
      id: 'insulation_saving',
      label: 'Insulation saving',
      min: 0,
      max: 0.35,
      step: 0.01,
      defaultValue: 0.15,
    },
    {
      id: 'solar_saving',
      label: 'Solar saving',
      min: 0,
      max: 0.4,
      step: 0.01,
      defaultValue: 0.1,
    },
  ],
  breakdown: [
    { label: 'Bill after insulation', expression: 'base_bill * (1 - insulation_saving)' },
    { label: 'Solar contribution', expression: 'base_bill * solar_saving' },
  ],
  methodology: 'Savings are compounded against the current average bill.',
};

describe('What-if block', () => {
  it('validates inputs with ranges and an expression', () => {
    const block = WhatIfBlockSchema.parse({
      ...base,
      blockType: 'what_if',
      data: validData,
    });

    expect(block.data.inputs).toHaveLength(3);
    expect(block.data.inputs[0].min).toBe(800);
    expect(block.data.breakdown).toHaveLength(2);
  });

  it('is part of the story block union', () => {
    const parsed = StoryBlockSchema.parse({
      ...base,
      blockType: 'what_if',
      data: validData,
    });
    expect(parsed.blockType).toBe('what_if');
  });

  it('rejects a block with no inputs', () => {
    expect(() =>
      WhatIfBlockSchema.parse({
        ...base,
        blockType: 'what_if',
        data: { ...validData, inputs: [] },
      })
    ).toThrow();
  });

  it('rejects an input whose default is outside its own range', () => {
    expect(() =>
      WhatIfBlockSchema.parse({
        ...base,
        blockType: 'what_if',
        data: {
          ...validData,
          inputs: [
            {
              id: 'x',
              label: 'X',
              min: 0,
              max: 10,
              defaultValue: 99,
            },
          ],
        },
      })
    ).toThrow();
  });

  it('is registered as an interactive block', () => {
    expect(listBlockTypes()).toContain('what_if');
    const definition = getBlockDefinition('what_if');
    expect(definition?.category).toBe('interactive');
    expect(definition?.example).toBeDefined();
  });

  describe('scenario evaluation', () => {
    it('computes the outcome from the default values', () => {
      const scenario = WhatIfModel.evaluate(
        validData as never,
        WhatIfModel.defaultValues(validData as never)
      );

      // 1800 * 0.85 * 0.9 = 1377
      expect(scenario.outcome).toBeCloseTo(1377);
      expect(scenario.isValid).toBe(true);
    });

    it('recomputes the outcome when a value changes', () => {
      const values = { ...WhatIfModel.defaultValues(validData as never), insulation_saving: 0.3 };
      const scenario = WhatIfModel.evaluate(validData as never, values);

      // 1800 * 0.7 * 0.9 = 1134
      expect(scenario.outcome).toBeCloseTo(1134);
    });

    it('reports how far the reader has moved from the baseline', () => {
      const values = { ...WhatIfModel.defaultValues(validData as never), insulation_saving: 0.3 };
      const scenario = WhatIfModel.evaluate(validData as never, values);

      expect(scenario.baseline).toBeCloseTo(1377);
      expect(scenario.delta).toBeCloseTo(1134 - 1377);
    });

    it('computes the breakdown components', () => {
      const scenario = WhatIfModel.evaluate(
        validData as never,
        WhatIfModel.defaultValues(validData as never)
      );

      expect(scenario.components).toHaveLength(2);
      expect(scenario.components[0].value).toBeCloseTo(1800 * 0.85);
      expect(scenario.components[1].value).toBeCloseTo(1800 * 0.1);
    });

    it('drops a component it cannot evaluate rather than showing it as zero', () => {
      const scenario = WhatIfModel.evaluate(
        {
          ...validData,
          breakdown: [
            { label: 'Good', expression: 'base_bill' },
            { label: 'Broken', expression: 'base_bill * missing_thing' },
          ],
        } as never,
        WhatIfModel.defaultValues(validData as never)
      );

      // A broken component shown as zero would read as "worthless".
      expect(scenario.components.map((c) => c.label)).toEqual(['Good']);
    });

    it('reports an invalid scenario rather than a fake zero', () => {
      const scenario = WhatIfModel.evaluate(
        { ...validData, expression: 'base_bill * missing_thing' } as never,
        WhatIfModel.defaultValues(validData as never)
      );

      expect(scenario.outcome).toBeNull();
      expect(scenario.isValid).toBe(false);
    });
  });

  describe('clamping', () => {
    it('keeps a value inside its range', () => {
      const input = validData.inputs[0];
      expect(WhatIfModel.clamp(input as never, 5000)).toBe(4000);
      expect(WhatIfModel.clamp(input as never, 10)).toBe(800);
    });

    it('snaps a value to the step', () => {
      const input = validData.inputs[0];
      // The step is 50 from a minimum of 800.
      expect(WhatIfModel.clamp(input as never, 1234)).toBe(1250);
    });

    it('falls back to the default for a value that is not a number', () => {
      const input = validData.inputs[0];
      expect(WhatIfModel.clamp(input as never, Number.NaN)).toBe(1800);
    });
  });

  it('contributes its text to the extracted article body', () => {
    const text = extractTextContent([{ ...base, blockType: 'what_if', data: validData } as never]);

    expect(text).toContain('What would it take to cut household energy bills by a fifth?');
    expect(text).toContain('Current average bill');
    expect(text).toContain('Average household bill');
  });
});
