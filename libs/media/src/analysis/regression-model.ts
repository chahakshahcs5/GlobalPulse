import type { RegressionBlock } from '@ai-news/schemas';
import { studentTCritical } from '@ai-news/shared';

/**
 * Regression analysis for the `regression` block.
 *
 * The block carries the raw measurements; the platform fits the curve, works
 * out how much of the variation the curve explains and draws the band around
 * it. A reader who is shown "R² = 0.82" without the scatter underneath is
 * being asked to take the number on trust, and a curve drawn through three
 * points looks exactly as convincing as one drawn through three hundred.
 */

export type RegressionModelKind = 'linear' | 'quadratic' | 'logarithmic' | 'exponential';

export interface RegressionCoefficient {
  /** What the coefficient is, e.g. `Slope` or `Intercept`. */
  label: string;
  value: number;
  /** The standard error of the coefficient. */
  standardError: number;
}

export interface RegressionResidual {
  x: number;
  y: number;
  /** What the curve predicts at this x. */
  fitted: number;
  /** How far the measurement sits from the curve. */
  residual: number;
}

export interface RegressionFit {
  model: RegressionModelKind;
  coefficients: RegressionCoefficient[];
  /** The fitted equation, written out for the reader. */
  equation: string;
  /** The share of the variation in the measurements the curve explains. */
  rSquared: number;
  /** The same, penalised for the number of terms in the model. */
  adjustedRSquared: number;
  /** How far the measurements typically sit from the curve. */
  residualStandardError: number;
  /** How many measurements the curve was fitted to. */
  observations: number;
  /** The degrees of freedom left over. */
  degreesOfFreedom: number;
  /** What the curve predicts at `x`. */
  predict: (x: number) => number;
  /**
   * The band around the fitted value at `x`.
   *
   * `confidence` is the proportion of the fitted measurements the band
   * contains: 0.95 is the usual choice.
   */
  band: (x: number, confidence: number) => { lower: number; upper: number };
  /** Every measurement, with what the curve predicted for it. */
  residuals: RegressionResidual[];
}

/**
 * How each model is fitted.
 *
 * The two non-linear models are fitted in a transformed space — the logarithm
 * of x, or the logarithm of y — and the result is mapped back afterwards.
 * The band is drawn in the space the curve was fitted in and mapped back the
 * same way, which is why an exponential band is asymmetric on the reported
 * scale: it is symmetric in logarithms.
 */
interface ModelSpec {
  label: string;
  /** The basis functions, in the order they appear in the equation. */
  basis: (x: number) => number[];
  /** Maps a measurement into the space being fitted. */
  toFit: (y: number) => number;
  /** Maps a fitted value back onto the reported scale. */
  fromFit: (value: number) => number;
  /** The coefficients, in the order the basis functions produce them. */
  coefficientLabels: string[];
  /** Whether the fitted space is logarithmic in y. */
  logSpace: boolean;
}

const MODELS: Record<RegressionModelKind, ModelSpec> = {
  linear: {
    label: 'Linear',
    basis: (x) => [1, x],
    toFit: (y) => y,
    fromFit: (value) => value,
    coefficientLabels: ['Intercept', 'Slope'],
    logSpace: false,
  },
  quadratic: {
    label: 'Quadratic',
    basis: (x) => [1, x, x * x],
    toFit: (y) => y,
    fromFit: (value) => value,
    coefficientLabels: ['Intercept', 'Linear term', 'Squared term'],
    logSpace: false,
  },
  logarithmic: {
    label: 'Logarithmic',
    basis: (x) => [1, Math.log(x)],
    toFit: (y) => y,
    fromFit: (value) => value,
    coefficientLabels: ['Intercept', 'Log term'],
    logSpace: false,
  },
  exponential: {
    label: 'Exponential',
    basis: (x) => [1, x],
    toFit: (y) => Math.log(y),
    fromFit: (value) => Math.exp(value),
    coefficientLabels: ['Intercept', 'Rate'],
    logSpace: true,
  },
};

/** Gauss-Jordan inversion. Returns null when the matrix is singular. */
function invert(matrix: number[][]): number[][] | null {
  const size = matrix.length;
  const augmented = matrix.map((row, index) => [
    ...row,
    ...Array.from({ length: size }, (_, column) => (column === index ? 1 : 0)),
  ]);

  for (let pivot = 0; pivot < size; pivot++) {
    // Partial pivoting: the largest remaining entry makes the division stable.
    let best = pivot;
    for (let row = pivot + 1; row < size; row++) {
      if (Math.abs(augmented[row][pivot]) > Math.abs(augmented[best][pivot])) best = row;
    }
    if (!Number.isFinite(augmented[best][pivot]) || Math.abs(augmented[best][pivot]) < 1e-12) {
      return null;
    }
    [augmented[pivot], augmented[best]] = [augmented[best], augmented[pivot]];

    const divisor = augmented[pivot][pivot];
    for (let column = 0; column < 2 * size; column++) augmented[pivot][column] /= divisor;

    for (let row = 0; row < size; row++) {
      if (row === pivot) continue;
      const factor = augmented[row][pivot];
      if (factor === 0) continue;
      for (let column = 0; column < 2 * size; column++) {
        augmented[row][column] -= factor * augmented[pivot][column];
      }
    }
  }

  return augmented.map((row) => row.slice(size));
}

/** Multiplies a row vector by a matrix. */
function multiplyRowVector(row: number[], matrix: number[][]): number[] {
  return matrix[0].map((_, column) =>
    row.reduce((sum, value, index) => sum + value * matrix[index][column], 0)
  );
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const magnitude = Math.abs(value);
  if (magnitude !== 0 && (magnitude < 0.001 || magnitude >= 1e6)) return value.toExponential(3);
  return value.toFixed(Math.abs(value) < 10 ? 3 : 2).replace(/\.?0+$/, '');
}

/** Writes the fitted equation out for the reader. */
function formatEquation(spec: ModelSpec, beta: number[]): string {
  const intercept = beta[0];
  if (spec === MODELS.exponential) {
    const rate = beta[1];
    return `y = ${formatNumber(Math.exp(intercept))} × e^(${formatNumber(rate)}x)`;
  }
  if (spec === MODELS.logarithmic) {
    return `y = ${formatNumber(beta[1])} ln(x) ${intercept < 0 ? '−' : '+'} ${formatNumber(Math.abs(intercept))}`;
  }
  if (spec === MODELS.quadratic) {
    const squared = beta[2];
    const linear = beta[1];
    return `y = ${formatNumber(squared)}x² ${linear < 0 ? '−' : '+'} ${formatNumber(Math.abs(linear))}x ${intercept < 0 ? '−' : '+'} ${formatNumber(Math.abs(intercept))}`;
  }
  const slope = beta[1];
  return `y = ${formatNumber(slope)}x ${intercept < 0 ? '−' : '+'} ${formatNumber(Math.abs(intercept))}`;
}

export class RegressionModel {
  /**
   * Fits the curve the block asks for.
   *
   * Returns null when the measurements cannot support the model — too few of
   * them, a logarithm of a negative number, or a curve that does not
   * converge.
   */
  static fit(blockData: RegressionBlock['data']): RegressionFit | null {
    const kind = blockData.model ?? 'linear';
    const spec = MODELS[kind] ?? MODELS.linear;

    const points = blockData.points.filter(
      (point) => Number.isFinite(point.x) && Number.isFinite(point.y)
    );

    // A model with more terms needs more points than terms.
    const terms = spec.basis(0).length;
    if (points.length < terms) return null;

    // The logarithmic model is only defined for positive x, and the
    // exponential model only for positive y.
    if (kind === 'logarithmic' && points.some((point) => point.x <= 0)) return null;
    if (kind === 'exponential' && points.some((point) => point.y <= 0)) return null;

    const rows: number[][] = [];
    const targets: number[] = [];
    for (const point of points) {
      const basis = spec.basis(point.x);
      if (basis.some((value) => !Number.isFinite(value))) return null;
      rows.push(basis);
      targets.push(spec.toFit(point.y));
    }

    // The normal equations: (X'X) β = X'y.
    const gram: number[][] = Array.from({ length: terms }, () => new Array<number>(terms).fill(0));
    const moment: number[] = new Array<number>(terms).fill(0);
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      for (let i = 0; i < terms; i++) {
        moment[i] += row[i] * targets[index];
        for (let j = 0; j < terms; j++) gram[i][j] += row[i] * row[j];
      }
    }

    const inverse = invert(gram);
    if (!inverse) return null;
    const beta = multiplyRowVector(moment, inverse);
    if (beta.some((value) => !Number.isFinite(value))) return null;

    // Residuals, in the space the model was fitted in.
    const fittedSpace = rows.map((row) => row.reduce((sum, value, i) => sum + value * beta[i], 0));
    const residualSumSquares = fittedSpace.reduce(
      (sum, fitted, index) => sum + (targets[index] - fitted) ** 2,
      0
    );

    const degreesOfFreedom = points.length - terms;
    const residualVariance =
      degreesOfFreedom > 0 ? residualSumSquares / degreesOfFreedom : residualSumSquares;
    const residualStandardError = Math.sqrt(Math.max(0, residualVariance));

    // R² is reported on the scale the reader sees: an exponential fit is
    // judged by how well it predicts the measurements, not their logarithms.
    const reportedFitted = fittedSpace.map((value) => spec.fromFit(value));
    const meanReported = points.reduce((sum, point) => sum + point.y, 0) / points.length;
    const reportedTotal = points.reduce((sum, point) => sum + (point.y - meanReported) ** 2, 0);
    const reportedResidual = points.reduce(
      (sum, point, index) => sum + (point.y - reportedFitted[index]) ** 2,
      0
    );
    const rSquared = reportedTotal === 0 ? 0 : 1 - reportedResidual / reportedTotal;
    const adjustedRSquared =
      points.length > terms + 1
        ? 1 - ((1 - rSquared) * (points.length - 1)) / (points.length - terms)
        : rSquared;

    // The standard error of each coefficient, and of the fitted mean.
    const coefficientErrors: number[] = [];
    for (let i = 0; i < terms; i++) {
      const variance = Math.max(0, residualVariance * inverse[i][i]);
      coefficientErrors.push(Math.sqrt(variance));
    }

    const predict = (x: number): number => {
      const basis = spec.basis(x);
      if (basis.some((value) => !Number.isFinite(value))) return Number.NaN;
      const fitted = basis.reduce((sum, value, i) => sum + value * beta[i], 0);
      return spec.fromFit(fitted);
    };

    const band = (x: number, confidence: number) => {
      const basis = spec.basis(x);
      if (basis.some((value) => !Number.isFinite(value))) {
        return { lower: Number.NaN, upper: Number.NaN };
      }
      // The variance of the fitted mean at this x: x0' (X'X)^-1 x0.
      const weights = multiplyRowVector(basis, inverse);
      const leverage = weights.reduce((sum, value, i) => sum + value * basis[i], 0);
      const standardError = Math.sqrt(Math.max(0, residualVariance * leverage));
      const critical = studentTCritical(degreesOfFreedom, confidence);
      const fitted = basis.reduce((sum, value, i) => sum + value * beta[i], 0);
      const lower = fitted - critical * standardError;
      const upper = fitted + critical * standardError;
      if (spec.logSpace) {
        return { lower: Math.exp(lower), upper: Math.exp(upper) };
      }
      return { lower: spec.fromFit(lower), upper: spec.fromFit(upper) };
    };

    return {
      model: kind,
      coefficients: beta.map((value, index) => ({
        label: spec.coefficientLabels[index] ?? `Term ${index + 1}`,
        value,
        standardError: coefficientErrors[index],
      })),
      equation: formatEquation(spec, beta),
      rSquared,
      adjustedRSquared,
      residualStandardError,
      observations: points.length,
      degreesOfFreedom,
      predict,
      band,
      residuals: points.map((point, index) => ({
        x: point.x,
        y: point.y,
        fitted: reportedFitted[index],
        residual: point.y - reportedFitted[index],
      })),
    };
  }
}
