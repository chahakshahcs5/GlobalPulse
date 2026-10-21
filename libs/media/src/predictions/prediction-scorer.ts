import type { PredictionLeaderboardBlock } from '@ai-news/schemas';

export interface ForecasterScore {
  forecaster: string;
  /** Number of predictions that have resolved. */
  resolved: number;
  /** Number of predictions still open. */
  open: number;
  /**
   * Mean Brier score across the resolved predictions. Lower is better: a
   * perfect forecaster scores 0, a coin flip scores 0.25, and a forecaster
   * who is always wrong scores 1.
   */
  brierScore: number | null;
  /** Share of resolved predictions whose direction was right, 0-1. */
  accuracy: number | null;
  /** Mean probability the forecaster assigned, 0-1. */
  averageConfidence: number | null;
}

export interface CalibrationBucket {
  /** Lower bound of the bucket, 0-1. */
  from: number;
  /** Upper bound of the bucket, 0-1. */
  to: number;
  /** Label for the bucket (e.g. "60-70%"). */
  label: string;
  /** How many resolved predictions fell in the bucket. */
  count: number;
  /** The mean probability the forecasters assigned. */
  averagePrediction: number | null;
  /** How often the claim actually came true. */
  actualFrequency: number | null;
}

/**
 * Scoring for tracked predictions.
 *
 * A newsroom that publishes forecasts has to say who was right. The Brier
 * score is the standard measure: it rewards being right and, just as
 * importantly, rewards being well-calibrated rather than confidently wrong.
 *
 * Calibration is reported alongside it because a forecaster can have a good
 * average score and still be badly calibrated, and only the calibration
 * curve shows that.
 */
export class PredictionScorer {
  /**
   * Score every forecaster.
   *
   * Only resolved predictions count towards the score — an open prediction
   * says nothing about a forecaster's track record yet.
   */
  static scoreForecasters(blockData: PredictionLeaderboardBlock['data']): ForecasterScore[] {
    const byForecaster = new Map<
      string,
      { resolved: PredictionLeaderboardBlock['data']['predictions']; open: number }
    >();

    for (const prediction of blockData.predictions) {
      const entry = byForecaster.get(prediction.forecaster) ?? { resolved: [], open: 0 };
      if (prediction.resolved && prediction.outcome !== undefined) {
        entry.resolved.push(prediction);
      } else {
        entry.open += 1;
      }
      byForecaster.set(prediction.forecaster, entry);
    }

    const scores: ForecasterScore[] = [];

    for (const [forecaster, entry] of byForecaster.entries()) {
      const resolved = entry.resolved;

      if (resolved.length === 0) {
        scores.push({
          forecaster,
          resolved: 0,
          open: entry.open,
          brierScore: null,
          accuracy: null,
          averageConfidence: null,
        });
        continue;
      }

      let brierSum = 0;
      let correct = 0;
      let confidenceSum = 0;

      for (const prediction of resolved) {
        const outcome = prediction.outcome as number;
        brierSum += Math.pow(prediction.probability - outcome, 2);
        confidenceSum += prediction.probability;

        // "Right" means the forecast pointed the same way as the outcome.
        const calledTrue = prediction.probability >= 0.5;
        if (calledTrue === outcome >= 0.5) correct += 1;
      }

      scores.push({
        forecaster,
        resolved: resolved.length,
        open: entry.open,
        brierScore: brierSum / resolved.length,
        accuracy: correct / resolved.length,
        averageConfidence: confidenceSum / resolved.length,
      });
    }

    // Best score first. Forecasters with no resolved prediction have no
    // score and sort last.
    return scores.sort((a, b) => {
      if (a.brierScore === null && b.brierScore === null)
        return a.forecaster.localeCompare(b.forecaster);
      if (a.brierScore === null) return 1;
      if (b.brierScore === null) return -1;
      return a.brierScore - b.brierScore;
    });
  }

  /**
   * Bucket the resolved predictions by the probability that was assigned,
   * and compare it with how often the claims actually came true.
   */
  static computeCalibration(
    blockData: PredictionLeaderboardBlock['data'],
    bucketCount = 5
  ): CalibrationBucket[] {
    const size = 1 / bucketCount;
    const buckets: CalibrationBucket[] = [];

    for (let i = 0; i < bucketCount; i++) {
      const from = i * size;
      const to = i === bucketCount - 1 ? 1 : (i + 1) * size;
      buckets.push({
        from,
        to,
        label: `${Math.round(from * 100)}-${Math.round(to * 100)}%`,
        count: 0,
        averagePrediction: null,
        actualFrequency: null,
      });
    }

    const sums = buckets.map(() => 0);
    const outcomes = buckets.map(() => 0);

    for (const prediction of blockData.predictions) {
      if (!prediction.resolved || prediction.outcome === undefined) continue;

      // The top bucket is closed at 1.
      const index = Math.min(bucketCount - 1, Math.floor(prediction.probability / size));
      if (index < 0) continue;

      buckets[index].count += 1;
      sums[index] += prediction.probability;
      outcomes[index] += prediction.outcome;
    }

    buckets.forEach((bucket, index) => {
      if (bucket.count === 0) return;
      bucket.averagePrediction = sums[index] / bucket.count;
      bucket.actualFrequency = outcomes[index] / bucket.count;
    });

    return buckets;
  }
}
