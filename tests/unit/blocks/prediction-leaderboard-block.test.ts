import { describe, it, expect } from 'vitest';
import {
  PredictionLeaderboardBlockSchema,
  StoryBlockSchema,
  getBlockDefinition,
  listBlockTypes,
} from '@ai-news/schemas';
import { PredictionScorer, CalibrationRenderer } from '@ai-news/media';
import { extractTextContent } from '@ai-news/content';

const base = { id: 'blk_pred_test', sortOrder: 0 };

const validData = {
  title: 'Who called it? Forecasters on AGI capability',
  subtitle: 'Resolved predictions ranked by Brier score',
  scoringMethod: 'Brier score: mean squared error between the stated probability and the outcome.',
  predictions: [
    {
      id: 'p1',
      claim: 'An AGI-capable system is announced before 2027',
      forecaster: 'Desk A',
      probability: 0.8,
      resolved: true,
      outcome: 1,
    },
    {
      id: 'p2',
      claim: 'An AGI-capable system is announced before 2027',
      forecaster: 'Desk A',
      probability: 0.2,
      resolved: true,
      outcome: 0,
    },
    {
      id: 'p3',
      claim: 'An AGI-capable system is announced before 2027',
      forecaster: 'Desk B',
      probability: 0.7,
      resolved: true,
      outcome: 0,
    },
    {
      id: 'p4',
      claim: 'An AGI-capable system is announced before 2027',
      forecaster: 'Desk C',
      probability: 0.5,
      resolved: false,
    },
  ],
  methodology: 'Only resolved predictions count towards a score.',
};

describe('Prediction leaderboard block', () => {
  it('validates tracked predictions', () => {
    const block = PredictionLeaderboardBlockSchema.parse({
      ...base,
      blockType: 'prediction_leaderboard',
      data: validData,
    });
    expect(block.data.predictions).toHaveLength(4);
    expect(block.data.predictions[0].probability).toBe(0.8);
  });

  it('is part of the story block union', () => {
    const parsed = StoryBlockSchema.parse({
      ...base,
      blockType: 'prediction_leaderboard',
      data: validData,
    });
    expect(parsed.blockType).toBe('prediction_leaderboard');
  });

  it('rejects a probability outside 0-1', () => {
    expect(() =>
      PredictionLeaderboardBlockSchema.parse({
        ...base,
        blockType: 'prediction_leaderboard',
        data: {
          ...validData,
          predictions: [
            {
              id: 'x',
              claim: 'c',
              forecaster: 'f',
              probability: 1.4,
              resolved: false,
            },
          ],
        },
      })
    ).toThrow();
  });

  it('rejects a block with no predictions', () => {
    expect(() =>
      PredictionLeaderboardBlockSchema.parse({
        ...base,
        blockType: 'prediction_leaderboard',
        data: { ...validData, predictions: [] },
      })
    ).toThrow();
  });

  it('is registered with a category and example', () => {
    expect(listBlockTypes()).toContain('prediction_leaderboard');
    const definition = getBlockDefinition('prediction_leaderboard');
    expect(definition?.category).toBe('data');
    expect(definition?.recommendedFor).toContain('accountability reporting');
  });

  describe('scoring', () => {
    it('scores a forecaster by the mean squared error of their resolved calls', () => {
      const scores = PredictionScorer.scoreForecasters(validData as never);
      const deskA = scores.find((s) => s.forecaster === 'Desk A');

      // (0.8-1)^2 = 0.04 and (0.2-0)^2 = 0.04, so the mean is 0.04.
      expect(deskA?.brierScore).toBeCloseTo(0.04);
      expect(deskA?.resolved).toBe(2);
      expect(deskA?.open).toBe(0);
      expect(deskA?.accuracy).toBe(1);
    });

    it('penalises a confident and wrong forecast', () => {
      const scores = PredictionScorer.scoreForecasters(validData as never);
      const deskB = scores.find((s) => s.forecaster === 'Desk B');

      // (0.7-0)^2 = 0.49 — much worse than Desk A's 0.04.
      expect(deskB?.brierScore).toBeCloseTo(0.49);
      expect(deskB?.accuracy).toBe(0);
    });

    it('ranks the forecasters with the best score first', () => {
      const scores = PredictionScorer.scoreForecasters(validData as never);
      expect(scores[0].forecaster).toBe('Desk A');
      expect(scores[1].forecaster).toBe('Desk B');
    });

    it('scores a coin flip at 0.25', () => {
      const scores = PredictionScorer.scoreForecasters({
        ...validData,
        predictions: [
          {
            id: 'a',
            claim: 'c',
            forecaster: 'Coin',
            probability: 0.5,
            resolved: true,
            outcome: 0,
          },
          {
            id: 'b',
            claim: 'c',
            forecaster: 'Coin',
            probability: 0.5,
            resolved: true,
            outcome: 1,
          },
        ],
      } as never);

      expect(scores[0].brierScore).toBeCloseTo(0.25);
    });

    it('gives an unresolving forecaster no score and sorts them last', () => {
      const scores = PredictionScorer.scoreForecasters(validData as never);
      const deskC = scores.find((s) => s.forecaster === 'Desk C');

      expect(deskC?.brierScore).toBeNull();
      expect(deskC?.resolved).toBe(0);
      expect(deskC?.open).toBe(1);
      expect(scores[scores.length - 1].forecaster).toBe('Desk C');
    });

    it('ignores an open prediction when scoring', () => {
      const withOpen = PredictionScorer.scoreForecasters(validData as never);
      const withoutOpen = PredictionScorer.scoreForecasters({
        ...validData,
        predictions: validData.predictions.filter((p) => p.resolved),
      } as never);

      const deskAWith = withOpen.find((s) => s.forecaster === 'Desk A');
      const deskAWithout = withoutOpen.find((s) => s.forecaster === 'Desk A');
      expect(deskAWith?.brierScore).toBe(deskAWithout?.brierScore);
    });
  });

  describe('calibration', () => {
    it('buckets the resolved predictions by stated probability', () => {
      const buckets = PredictionScorer.computeCalibration(validData as never, 5);

      // Five bands of 20 points each, boundary values in the upper band:
      // 0.8 lands in 80-100%, 0.7 in 60-80% and 0.2 in 20-40%.
      expect(buckets.find((b) => b.label === '80-100%')?.count).toBe(1);
      expect(buckets.find((b) => b.label === '60-80%')?.count).toBe(1);
      expect(buckets.find((b) => b.label === '20-40%')?.count).toBe(1);
      expect(buckets.find((b) => b.label === '40-60%')?.count).toBe(0);
    });

    it('reports how often the claims actually came true', () => {
      const buckets = PredictionScorer.computeCalibration(validData as never, 5);
      const high = buckets.find((b) => b.label === '80-100%');
      const mid = buckets.find((b) => b.label === '60-80%');

      // The 0.8 forecast came true; the 0.7 forecast did not.
      expect(high?.actualFrequency).toBe(1);
      expect(high?.averagePrediction).toBeCloseTo(0.8);
      expect(mid?.actualFrequency).toBe(0);
    });

    it('leaves empty buckets blank rather than showing a false zero', () => {
      const buckets = PredictionScorer.computeCalibration(validData as never, 5);
      const empty = buckets.find((b) => b.count === 0);
      expect(empty?.actualFrequency).toBeNull();
      expect(empty?.averagePrediction).toBeNull();
    });
  });

  describe('renderer', () => {
    it('draws the calibration chart with the perfect-calibration diagonal', () => {
      const svg = CalibrationRenderer.renderToSvg(validData as never, {
        width: 520,
        height: 360,
        theme: 'light',
      });

      expect(svg).toContain('<svg');
      expect(svg).toContain('perfect calibration');
      expect(svg).toContain('Probability assigned');
      expect(svg).toContain('Actually happened');
      // One circle per populated bucket.
      expect((svg.match(/<circle/g) ?? []).length).toBe(3);
    });
  });

  it('contributes its text to the extracted article body', () => {
    const text = extractTextContent([
      { ...base, blockType: 'prediction_leaderboard', data: validData } as never,
    ]);

    expect(text).toContain('Who called it? Forecasters on AGI capability');
    expect(text).toContain('Desk A');
    expect(text).toContain('An AGI-capable system is announced before 2027');
  });
});
