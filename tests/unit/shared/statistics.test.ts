import { describe, it, expect } from 'vitest';
import {
  pearsonCorrelation,
  correlationPValue,
  describeCorrelation,
  incompleteBeta,
} from '@ai-news/shared';

describe('Statistics helpers', () => {
  describe('pearsonCorrelation', () => {
    it('returns 1 for a perfect positive relationship', () => {
      const { coefficient, n } = pearsonCorrelation([1, 2, 3, 4], [10, 20, 30, 40]);
      expect(coefficient).toBeCloseTo(1);
      expect(n).toBe(4);
    });

    it('returns -1 for a perfect negative relationship', () => {
      const { coefficient } = pearsonCorrelation([1, 2, 3, 4], [40, 30, 20, 10]);
      expect(coefficient).toBeCloseTo(-1);
    });

    it('matches the worked example from the NIST handbook', () => {
      // x = 1..5, y = 2,4,5,4,5 -> r = 0.7746
      const { coefficient, n } = pearsonCorrelation([1, 2, 3, 4, 5], [2, 4, 5, 4, 5]);
      expect(coefficient).toBeCloseTo(0.7746, 3);
      expect(n).toBe(5);
    });

    it('returns no coefficient for a variable with no spread', () => {
      const { coefficient, n } = pearsonCorrelation([1, 1, 1, 1], [1, 2, 3, 4]);
      expect(coefficient).toBeNull();
      expect(n).toBe(4);
    });

    it('uses only the observations where both values are present', () => {
      const { coefficient, n } = pearsonCorrelation([1, 2, null, 4], [2, 4, 6, null]);
      // Two complete pairs, perfectly correlated.
      expect(n).toBe(2);
      expect(coefficient).toBeCloseTo(1);
    });

    it('returns no coefficient for fewer than two pairs', () => {
      expect(pearsonCorrelation([1], [2]).coefficient).toBeNull();
      expect(pearsonCorrelation([], []).coefficient).toBeNull();
    });
  });

  describe('correlationPValue', () => {
    it('is 1 for no correlation', () => {
      expect(correlationPValue(0, 20)).toBeCloseTo(1);
    });

    it('matches known two-tailed p-values for a Pearson correlation', () => {
      // r = 0.5 with 10 observations: t = 1.633, df = 8, two-tailed p = 0.1411
      expect(correlationPValue(0.5, 10)).toBeCloseTo(0.1411, 4);
      // r = 0.9 with 10 observations: t = 5.839, df = 8, two-tailed p = 0.00039
      expect(correlationPValue(0.9, 10)).toBeCloseTo(0.000387, 6);
      // r = 0.7746 with 5 observations (the NIST worked example): p = 0.1240
      expect(correlationPValue(0.7746, 5)).toBeCloseTo(0.124, 4);
    });

    it('is 0 for a perfect correlation', () => {
      expect(correlationPValue(1, 10)).toBe(0);
      expect(correlationPValue(-1, 10)).toBe(0);
    });

    it('cannot say anything with too few observations', () => {
      expect(correlationPValue(0.9, 2)).toBe(1);
    });

    it('shrinks as the sample grows, for the same coefficient', () => {
      const small = correlationPValue(0.6, 8);
      const large = correlationPValue(0.6, 80);
      expect(large).toBeLessThan(small);
    });
  });

  describe('incompleteBeta', () => {
    /**
     * A numerically integrated reference.
     *
     * The substitution `t = x*u` keeps the integrand smooth at the origin, so
     * Simpson's rule converges cleanly even for a < 1.
     */
    function referenceIncompleteBeta(a: number, b: number, x: number): number {
      const logGamma = (z: number): number => {
        const coefficients = [
          0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
          -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
          1.5056327351493116e-7,
        ];
        if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
        const shifted = z - 1;
        let acc = coefficients[0];
        for (let i = 1; i < 9; i++) acc += coefficients[i] / (shifted + i);
        const t = shifted + 7.5;
        return 0.5 * Math.log(2 * Math.PI) + (shifted + 0.5) * Math.log(t) - t + Math.log(acc);
      };

      const beta = Math.exp(logGamma(a) + logGamma(b) - logGamma(a + b));

      // ∫₀ˣ t^(a-1)(1-t)^(b-1) dt, with the substitution t = x*u² so that
      // the integrand is smooth at the origin even when a < 1:
      //   t^(a-1) dt = 2 x^a u^(2a-1) du
      const n = 4000;
      const h = 1 / n;
      const f = (u: number) =>
        u <= 0 ? 0 : 2 * Math.pow(u, 2 * a - 1) * Math.pow(1 - x * u * u, b - 1);

      let sum = f(0) + f(1);
      for (let i = 1; i < n; i++) sum += (i % 2 === 0 ? 2 : 4) * f(i * h);
      const integral = (h / 3) * sum;

      return (Math.pow(x, a) * integral) / beta;
    }

    it('is 0 at 0 and 1 at 1', () => {
      expect(incompleteBeta(2, 3, 0)).toBe(0);
      expect(incompleteBeta(2, 3, 1)).toBe(1);
    });

    it('matches the known value for I_0.5(1, 1)', () => {
      // The beta distribution with a = b = 1 is uniform.
      expect(incompleteBeta(1, 1, 0.5)).toBeCloseTo(0.5);
    });

    it('matches a numerically integrated reference', () => {
      const cases: Array<[number, number, number]> = [
        [1, 1, 0.5],
        [1.5, 0.5, 0.4],
        [4, 0.5, 0.75],
        [4, 0.5, 0.19],
        [1.5, 0.5, 0.75],
        [2, 3, 0.3],
        [0.5, 1.5, 0.6],
        [3, 2, 0.8],
        [2.5, 1.5, 0.35],
      ];

      for (const [a, b, x] of cases) {
        // The reference is a numerical integration. It converges slowly when
        // a < 1 (the integrand has a branch point), so it is only trusted to
        // three decimal places. The exact symmetry identity below pins the
        // implementation itself.
        expect(incompleteBeta(a, b, x)).toBeCloseTo(referenceIncompleteBeta(a, b, x), 3);
      }
    });

    it('satisfies the symmetry identity I_x(a,b) + I_(1-x)(b,a) = 1', () => {
      // This identity is exact, so it holds the implementation to a much
      // tighter tolerance than a numerical reference can.
      expect(incompleteBeta(1.5, 0.5, 0.4) + incompleteBeta(0.5, 1.5, 0.6)).toBeCloseTo(1, 10);
      expect(incompleteBeta(4, 0.5, 0.75) + incompleteBeta(0.5, 4, 0.25)).toBeCloseTo(1, 10);
    });
  });

  describe('describeCorrelation', () => {
    it('describes the strength in plain language', () => {
      expect(describeCorrelation(0)).toMatch(/no meaningful/i);
      expect(describeCorrelation(0.2)).toMatch(/weak/i);
      expect(describeCorrelation(0.4)).toMatch(/modest/i);
      expect(describeCorrelation(0.6)).toMatch(/moderate/i);
      expect(describeCorrelation(0.8)).toMatch(/strong/i);
      expect(describeCorrelation(0.95)).toMatch(/very strong/i);
    });

    it('says so when there is nothing to describe', () => {
      expect(describeCorrelation(null)).toMatch(/not enough/i);
    });
  });
});
