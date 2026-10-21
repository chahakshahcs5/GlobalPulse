/**
 * Safe evaluation of structured expressions.
 *
 * Formulas in story blocks are authored by editors and AI agents, so they are
 * evaluated in a restricted arithmetic sandbox rather than a general
 * JavaScript evaluator: only numbers, the four operations, parentheses and
 * the known input identifiers are accepted. Anything else returns `null`
 * instead of executing.
 */

/**
 * Evaluates an expression against the supplied values.
 *
 * Unknown identifiers become `NaN`, which makes the whole expression `NaN`
 * and therefore rejected — an expression that references an input that does
 * not exist fails closed rather than silently evaluating to zero.
 */
export function evaluateExpression(
  expression: string,
  values: Record<string, number>
): number | null {
  if (typeof expression !== 'string' || expression.trim() === '') return null;

  const substituted = expression.replace(/[A-Za-z_][A-Za-z0-9_]*/g, (identifier) => {
    const value = values[identifier];
    return value === undefined ? 'NaN' : String(value);
  });

  if (!/^[0-9+\-*/(). NaN]*$/.test(substituted)) return null;

  try {
    const result = Function(`"use strict"; return (${substituted});`)() as unknown;
    if (typeof result !== 'number' || !Number.isFinite(result)) return null;
    return result;
  } catch {
    return null;
  }
}
