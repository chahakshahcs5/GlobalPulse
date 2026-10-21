import { describe, it, expect } from 'vitest';
import {
  CorrelationBlockSchema,
  StoryBlockSchema,
  getBlockDefinition,
  listBlockTypes,
} from '@ai-news/schemas';
import { CorrelationModel, CorrelationRenderer } from '@ai-news/media';
import { extractTextContent } from '@ai-news/content';

const base = { id: 'blk_corr_test', sortOrder: 0 };

const validData = {
  title: 'What moves with what?',
  subtitle: 'Pairwise correlations across the indicators',
  variables: [
    { key: 'a', label: 'Variable A', unit: 'x' },
    { key: 'b', label: 'Variable B', unit: 'y' },
    { key: 'c', label: 'Variable C' },
  ],
  // A and B move together strongly; C is unrelated to either.
  observations: [
    { a: 1, b: 2, c: 5 },
    { a: 2, b: 4, c: 3 },
    { a: 3, b: 6, c: 8 },
    { a: 4, b: 8, c: 1 },
    { a: 5, b: 10, c: 6 },
  ],
  significanceThreshold: 0.05,
  methodology: "Pearson's r over the observations supplied.",
};

describe('Correlation block', () => {
  it('validates variables and observations', () => {
    const block = CorrelationBlockSchema.parse({
      ...base,
      blockType: 'correlation',
      data: validData,
    });
    expect(block.data.variables).toHaveLength(3);
    expect(block.data.observations).toHaveLength(5);
  });

  it('is part of the story block union', () => {
    const parsed = StoryBlockSchema.parse({
      ...base,
      blockType: 'correlation',
      data: validData,
    });
    expect(parsed.blockType).toBe('correlation');
  });

  it('rejects a block with fewer than two variables', () => {
    expect(() =>
      CorrelationBlockSchema.parse({
        ...base,
        blockType: 'correlation',
        data: { ...validData, variables: [{ key: 'a', label: 'A' }] },
      })
    ).toThrow();
  });

  it('rejects a block with fewer than two observations', () => {
    expect(() =>
      CorrelationBlockSchema.parse({
        ...base,
        blockType: 'correlation',
        data: { ...validData, observations: [{ a: 1, b: 2, c: 3 }] },
      })
    ).toThrow();
  });

  it('is registered with a category and example', () => {
    expect(listBlockTypes()).toContain('correlation');
    const definition = getBlockDefinition('correlation');
    expect(definition?.category).toBe('data');
    expect(definition?.recommendedFor).toContain('data journalism');
  });

  describe('model', () => {
    it('derives the coefficients from the raw observations', () => {
      const matrix = CorrelationModel.compute(validData as never);

      // A and B are perfectly correlated in this fixture.
      const ab = matrix.cells[0][1];
      expect(ab.coefficient).toBeCloseTo(1);
      expect(ab.n).toBe(5);
    });

    it('reports the sample size behind every coefficient', () => {
      const matrix = CorrelationModel.compute({
        ...validData,
        // The third observation has no value for C.
        observations: [
          { a: 1, b: 2, c: 5 },
          { a: 2, b: 4 },
          { a: 3, b: 6, c: 8 },
          { a: 4, b: 8, c: 1 },
        ],
      } as never);

      // A/B use all four observations; A/C only the three that have both.
      expect(matrix.cells[0][1].n).toBe(4);
      expect(matrix.cells[0][2].n).toBe(3);
    });

    it('marks a statistically significant relationship', () => {
      const matrix = CorrelationModel.compute(validData as never);
      expect(matrix.cells[0][1].isSignificant).toBe(true);
      // C is unrelated to A, so it should not clear the threshold.
      expect(matrix.cells[0][2].isSignificant).toBe(false);
    });

    it('reports no coefficient when a variable has no spread', () => {
      const matrix = CorrelationModel.compute({
        ...validData,
        observations: [
          { a: 1, b: 2, c: 5 },
          { a: 1, b: 4, c: 3 },
          { a: 1, b: 6, c: 8 },
        ],
      } as never);

      expect(matrix.cells[0][1].coefficient).toBeNull();
      expect(matrix.cells[0][1].n).toBe(3);
      expect(matrix.cells[0][1].isSignificant).toBe(false);
    });

    it('finds the strongest pairing', () => {
      const matrix = CorrelationModel.compute(validData as never);
      expect(matrix.strongest?.rowLabel).toBe('Variable A');
      expect(matrix.strongest?.columnLabel).toBe('Variable B');
      expect(matrix.strongest?.coefficient).toBeCloseTo(1);
    });

    it('summarises without claiming causation', () => {
      const summary = CorrelationModel.summarise(CorrelationModel.compute(validData as never));
      expect(summary).toContain('Variable A');
      expect(summary).toContain('Variable B');
      expect(summary).toMatch(/not evidence of causation/i);
    });

    it('says plainly when the strongest pairing is not significant', () => {
      const summary = CorrelationModel.summarise(
        CorrelationModel.compute({
          ...validData,
          observations: [
            { a: 1, b: 2, c: 5 },
            { a: 2, b: 5, c: 3 },
            { a: 3, b: 4, c: 8 },
            { a: 4, b: 9, c: 1 },
          ],
        } as never)
      );
      expect(summary).toMatch(/not statistically significant/i);
    });
  });

  describe('renderer', () => {
    it('draws a cell per pair, with the coefficient and the sample size', () => {
      const svg = CorrelationRenderer.renderToSvg(validData as never, {
        width: 800,
        height: 520,
        theme: 'light',
      });

      expect(svg).toContain('<svg');
      expect(svg).toContain('What moves with what?');
      // A 3x3 matrix.
      expect((svg.match(/<rect x="\d/g) ?? []).length).toBeGreaterThanOrEqual(9);
      expect(svg).toContain('n=5');
      expect(svg).toContain('1.00');
    });

    it('explains what the ring around a cell means', () => {
      const svg = CorrelationRenderer.renderToSvg(validData as never, { theme: 'light' });
      expect(svg).toContain('statistically significant');
    });

    it('shows the full correlation scale in the legend', () => {
      const svg = CorrelationRenderer.renderToSvg(validData as never, { theme: 'light' });
      expect(svg).toContain('>-1<');
      expect(svg).toContain('>+1<');
    });
  });

  it('contributes its text to the extracted article body', () => {
    const text = extractTextContent([
      { ...base, blockType: 'correlation', data: validData } as never,
    ]);

    expect(text).toContain('What moves with what?');
    expect(text).toContain('Variable A');
    expect(text).toContain('Variable C');
  });
});
