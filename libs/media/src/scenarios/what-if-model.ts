import type { WhatIfBlock } from '@ai-news/schemas';
import { evaluateExpression } from '@ai-news/shared';

export interface WhatIfComponent {
  label: string;
  /** The component's value at the current input values. */
  value: number;
  color?: string;
}

export interface WhatIfScenario {
  /** The headline outcome, or null when the model cannot be evaluated. */
  outcome: number | null;
  /** The outcome at the inputs' default values. */
  baseline: number | null;
  /** How far the reader has moved the outcome from the baseline. */
  delta: number | null;
  /** The breakdown components, in order. */
  components: WhatIfComponent[];
  /** Whether the model could be evaluated at all. */
  isValid: boolean;
}

/**
 * Scenario explorer for the `what_if` block.
 *
 * The reader moves sliders; the outcome and its breakdown are recomputed from
 * the same expressions every time. The baseline is evaluated from the inputs'
 * default values, so the reader can always see how far they have moved away
 * from the published case.
 */
export class WhatIfModel {
  /** The input values a scenario starts from. */
  static defaultValues(blockData: WhatIfBlock['data']): Record<string, number> {
    return Object.fromEntries(blockData.inputs.map((input) => [input.id, input.defaultValue]));
  }

  /** Clamp a value into an input's range. */
  static clamp(input: WhatIfBlock['data']['inputs'][number], value: number): number {
    if (!Number.isFinite(value)) return input.defaultValue;
    const step = input.step ?? 1;
    // Snap to the step so a slider never reports a value it cannot produce.
    const snapped = Math.round((value - input.min) / step) * step + input.min;
    const clamped = Math.min(input.max, Math.max(input.min, snapped));
    // Kill floating point dust from the step arithmetic.
    return Number(clamped.toFixed(10));
  }

  /**
   * Evaluate the outcome and its breakdown at the given input values.
   *
   * A component that cannot be evaluated is dropped rather than shown as
   * zero — a broken component would otherwise look like a component worth
   * nothing.
   */
  static evaluate(blockData: WhatIfBlock['data'], values: Record<string, number>): WhatIfScenario {
    const baselineValues = WhatIfModel.defaultValues(blockData);

    const outcome = evaluateExpression(blockData.expression, values);
    const baseline =
      evaluateExpression(blockData.expression, baselineValues) ?? blockData.baselineOutcome ?? null;

    const components: WhatIfComponent[] = [];
    for (const component of blockData.breakdown ?? []) {
      const value = evaluateExpression(component.expression, values);
      if (value === null) continue;
      components.push({ label: component.label, value, color: component.color });
    }

    return {
      outcome,
      baseline,
      delta: outcome !== null && baseline !== null ? outcome - baseline : null,
      components,
      isValid: outcome !== null,
    };
  }
}
