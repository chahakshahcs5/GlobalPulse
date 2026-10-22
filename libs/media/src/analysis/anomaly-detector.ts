import type { AnomalyBlock } from '@ai-news/schemas';
import { median, quantile } from '@ai-news/shared';

/**
 * Anomaly detection for the `anomaly` block.
 *
 * The block carries the series; the platform decides which readings are
 * unusual and says which rule it used. A spike marked out by hand tells the
 * reader nothing they could not have done themselves, and a spike marked out
 * by a rule they cannot see is worse — so the rule is named, its threshold is
 * shown, and the expected value is drawn alongside the reading.
 */

export type AnomalyMethod = 'zscore' | 'mad' | 'iqr' | 'percentile';

export interface AnomalyReading {
  /** The label or date of the reading. */
  x: string;
  /** The measurement itself. */
  y: number;
  /** What the method expected at this point, when it has an expectation. */
  expected: number | null;
  /** How far from normal the reading is, in the method's own units. */
  score: number;
  isAnomaly: boolean;
  /** Which way the reading is off, when it is off at all. */
  direction: 'up' | 'down' | null;
}

export interface AnomalyResult {
  method: AnomalyMethod;
  /** The threshold the method was run at. */
  threshold: number;
  /** How many neighbouring readings the rolling methods looked at. */
  window: number | null;
  readings: AnomalyReading[];
  /** Only the readings that were flagged. */
  anomalies: AnomalyReading[];
  /** The lower bound the method used, when it has one. */
  lowerBound: number | null;
  /** The upper bound the method used, when it has one. */
  upperBound: number | null;
  /** A plain-language name for the method, for the reader. */
  methodLabel: string;
}

const DEFAULT_THRESHOLDS: Record<AnomalyMethod, number> = {
  zscore: 2.5,
  mad: 3,
  iqr: 1.5,
  percentile: 2,
};

const METHOD_LABELS: Record<AnomalyMethod, string> = {
  zscore: 'Standard deviations from the rolling mean',
  mad: 'Median absolute deviations from the rolling median',
  iqr: 'Interquartile range',
  percentile: 'Percentile',
};

export class AnomalyDetector {
  /**
   * Runs the method the block asks for over the series it carries.
   */
  static detect(blockData: AnomalyBlock['data']): AnomalyResult {
    const method = (blockData.method ?? 'zscore') as AnomalyMethod;
    const threshold =
      blockData.threshold ?? DEFAULT_THRESHOLDS[method] ?? DEFAULT_THRESHOLDS.zscore;
    const direction = blockData.direction ?? 'both';
    const window = blockData.window ?? null;

    const points = blockData.points.filter((point) => Number.isFinite(point.y));

    const readings: AnomalyReading[] = [];
    let lowerBound: number | null = null;
    let upperBound: number | null = null;

    if (method === 'iqr' || method === 'percentile') {
      // These two judge every reading against the whole series, because the
      // question they answer is "is this reading unusual for this series".
      const values = points.map((point) => point.y);

      if (method === 'iqr') {
        const q1 = quantile(values, 0.25);
        const q3 = quantile(values, 0.75);
        const spread = q3 - q1;
        lowerBound = q1 - threshold * spread;
        upperBound = q3 + threshold * spread;
      } else {
        const tail = Math.min(50, Math.max(0, threshold));
        lowerBound = quantile(values, tail / 100);
        upperBound = quantile(values, 1 - tail / 100);
      }

      for (const point of points) {
        const low = lowerBound ?? Number.NEGATIVE_INFINITY;
        const high = upperBound ?? Number.POSITIVE_INFINITY;
        const off = point.y < low ? 'down' : point.y > high ? 'up' : null;
        readings.push({
          x: point.x,
          y: point.y,
          expected: null,
          score: 0,
          isAnomaly: off !== null && direction !== (off === 'up' ? 'down' : 'up'),
          direction: off,
        });
      }
    } else {
      // The rolling methods judge each reading against the ones before it.
      const windowSize = window ?? Math.max(5, Math.min(20, Math.floor(points.length / 2)));
      for (let index = 0; index < points.length; index++) {
        const point = points[index];
        const history = points
          .slice(Math.max(0, index - windowSize), index)
          .map((entry) => entry.y);

        if (history.length < 2) {
          readings.push({
            x: point.x,
            y: point.y,
            expected: null,
            score: 0,
            isAnomaly: false,
            direction: null,
          });
          continue;
        }

        let expected: number;
        let score: number;

        if (method === 'mad') {
          expected = median(history);
          const deviations = history.map((value) => Math.abs(value - expected));
          const mad = median(deviations);
          // The 0.6745 factor puts the median absolute deviation on the same
          // scale as a standard deviation for normally distributed data.
          const spread = mad === 0 ? 0 : mad / 0.6745;
          score = spread === 0 ? 0 : (point.y - expected) / spread;
        } else {
          const mean = history.reduce((sum, value) => sum + value, 0) / history.length;
          expected = mean;
          const variance =
            history.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (history.length - 1);
          const standardDeviation = Math.sqrt(variance);
          score = standardDeviation === 0 ? 0 : (point.y - expected) / standardDeviation;
        }

        const off = score > threshold ? 'up' : score < -threshold ? 'down' : null;
        readings.push({
          x: point.x,
          y: point.y,
          expected,
          score,
          isAnomaly: off !== null && (direction === 'both' || direction === off),
          direction: off,
        });
      }
    }

    return {
      method,
      threshold,
      window:
        method === 'zscore' || method === 'mad' ? windowSizeOrDefault(window, points.length) : null,
      readings,
      anomalies: readings.filter((reading) => reading.isAnomaly),
      lowerBound,
      upperBound,
      methodLabel: METHOD_LABELS[method] ?? method,
    };
  }
}

/** The rolling window actually used, for the reader. */
function windowSizeOrDefault(window: number | null, count: number): number {
  if (window) return window;
  return Math.max(5, Math.min(20, Math.floor(count / 2)));
}
