/**
 * Statistics helpers for story blocks.
 *
 * These are deliberately small and dependency-free: a newsroom chart that
 * claims a correlation is significant has to be able to show why, and the
 * reader has to be able to check it.
 */

/** Lanczos approximation of the natural logarithm of the gamma function. */
function logGamma(z: number): number {
  const g = 7;
  const coefficients = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];

  if (z < 0.5) {
    // Reflection formula.
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }

  const shifted = z - 1;
  let x = coefficients[0];
  for (let i = 1; i < g + 2; i++) {
    x += coefficients[i] / (shifted + i);
  }
  const t = shifted + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (shifted + 0.5) * Math.log(t) - t + Math.log(x);
}

/** Continued-fraction expansion of the incomplete beta function. */
function betaContinuedFraction(a: number, b: number, x: number): number {
  const maxIterations = 200;
  const epsilon = 3e-14;
  const tiny = 1e-30;

  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < tiny) d = tiny;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= maxIterations; m++) {
    const m2 = 2 * m;

    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    h *= d * c;

    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const delta = d * c;
    h *= delta;

    if (Math.abs(delta - 1) < epsilon) break;
  }

  return h;
}

/** The regularised incomplete beta function `I_x(a, b)`. */
export function incompleteBeta(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  // bt = x^a (1-x)^b / B(a, b)
  const bt = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x)
  );

  // The continued fraction converges fastest on the smaller of x and 1-x.
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betaContinuedFraction(a, b, x)) / a;
  }
  return 1 - (bt * betaContinuedFraction(b, a, 1 - x)) / b;
}

/**
 * The two-tailed p-value for a Pearson correlation.
 *
 * With `n` observations and a coefficient `r`, the test statistic is
 * `t = r * sqrt((n - 2) / (1 - r^2))` with `n - 2` degrees of freedom, and
 * the two-tailed p-value is the regularised incomplete beta
 * `I_{df/(df+t^2)}(df/2, 1/2)`.
 *
 * Returns 1 when there are too few observations to say anything.
 */
export function correlationPValue(r: number, n: number): number {
  if (!Number.isFinite(r) || n < 3) return 1;
  if (Math.abs(r) >= 1) return 0;

  const df = n - 2;
  const tSquared = (r * r * df) / (1 - r * r);
  const x = df / (df + tSquared);
  return Math.min(1, Math.max(0, incompleteBeta(df / 2, 0.5, x)));
}

/**
 * Pearson's correlation coefficient for two paired samples.
 *
 * Only observations where both values are present are used, and the count of
 * those is returned so a reader can see how thin the evidence is.
 */
export function pearsonCorrelation(
  xs: Array<number | null | undefined>,
  ys: Array<number | null | undefined>
): { coefficient: number | null; n: number } {
  const pairs: Array<[number, number]> = [];

  const length = Math.min(xs.length, ys.length);
  for (let i = 0; i < length; i++) {
    const x = xs[i];
    const y = ys[i];
    if (x === null || x === undefined || y === null || y === undefined) continue;
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    pairs.push([x, y]);
  }

  const n = pairs.length;
  if (n < 2) return { coefficient: null, n };

  let sumX = 0;
  let sumY = 0;
  for (const [x, y] of pairs) {
    sumX += x;
    sumY += y;
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let covariance = 0;
  let varianceX = 0;
  let varianceY = 0;
  for (const [x, y] of pairs) {
    const dx = x - meanX;
    const dy = y - meanY;
    covariance += dx * dy;
    varianceX += dx * dx;
    varianceY += dy * dy;
  }

  const denominator = Math.sqrt(varianceX * varianceY);
  // A variable with no spread cannot correlate with anything.
  if (denominator === 0) return { coefficient: null, n };

  return { coefficient: covariance / denominator, n };
}

/**
 * A plain-language reading of a correlation coefficient.
 *
 * The thresholds follow the conventional reading of a correlation, and the
 * wording is deliberately hedged: a correlation is not evidence of causation.
 */
export function describeCorrelation(r: number | null): string {
  if (r === null) return 'Not enough paired observations';
  const magnitude = Math.abs(r);
  if (magnitude < 0.1) return 'No meaningful relationship';
  if (magnitude < 0.3) return 'A weak relationship';
  if (magnitude < 0.5) return 'A modest relationship';
  if (magnitude < 0.7) return 'A moderate relationship';
  if (magnitude < 0.9) return 'A strong relationship';
  return 'A very strong relationship';
}

/**
 * The two-tailed critical value of Student's t distribution.
 *
 * The value `t` for which the probability of a t statistic exceeding it is
 * `1 - confidence`. A confidence band drawn at this value contains the fitted
 * curve for that proportion of the observations it was fitted to.
 *
 * The distribution is inverted by bisection on the cumulative function, which
 * is `1 - I_{df/(df+t^2)}(df/2, 1/2)`. The incomplete beta function is the
 * one already used for the correlation p-value, so no new maths is needed.
 */
export function studentTCritical(df: number, confidence: number): number {
  if (!Number.isFinite(df) || df <= 0) return 0;
  const level = Math.min(1, Math.max(0, confidence));
  if (level <= 0 || level >= 1) return 0;

  const target = 1 - (1 - level) / 2;
  const cdf = (t: number): number => {
    const squared = t * t;
    const x = df / (df + squared);
    return 1 - 0.5 * incompleteBeta(df / 2, 0.5, x);
  };

  let low = 0;
  let high = 200;
  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2;
    if (cdf(mid) < target) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

/**
 * A quantile of a sample, by linear interpolation between the two closest
 * order statistics.
 *
 * `p` is the fraction of the sample below the result: `0.5` is the median,
 * `0.25` the lower quartile.
 */
export function quantile(values: Array<number | null | undefined>, p: number): number {
  const sorted = values
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
    .slice()
    .sort((a, b) => a - b);

  if (sorted.length === 0) return Number.NaN;
  if (sorted.length === 1) return sorted[0];

  const fraction = Math.min(1, Math.max(0, p));
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

/** The median of a sample. */
export function median(values: Array<number | null | undefined>): number {
  return quantile(values, 0.5);
}
