import type { CorrelationBlock } from '@ai-news/schemas';
import { correlationPValue, describeCorrelation, pearsonCorrelation } from '@ai-news/shared';

export interface CorrelationCell {
  /** The coefficient of the row variable against the column variable. */
  coefficient: number | null;
  /** How many paired observations the coefficient is based on. */
  n: number;
  /** The two-tailed p-value for the coefficient. */
  pValue: number;
  /** Whether the p-value clears the block's significance threshold. */
  isSignificant: boolean;
  /** A plain-language reading of the strength. */
  description: string;
}

export interface CorrelationVariable {
  key: string;
  label: string;
  unit?: string;
}

export interface CorrelationMatrix {
  variables: CorrelationVariable[];
  /** `cells[row][column]`. The diagonal is always 1 with n observations. */
  cells: CorrelationCell[][];
  /**
   * The strongest off-diagonal relationship, which is usually the one the
   * reader is looking for.
   */
  strongest?: {
    rowLabel: string;
    columnLabel: string;
    coefficient: number;
    isSignificant: boolean;
  };
}

/**
 * Correlation analysis for the `correlation` block.
 *
 * The block carries the raw observations; the platform derives the
 * coefficients, the sample sizes and the significance. That matters: a heatmap
 * of hand-written correlation values tells the reader nothing about how thin
 * the evidence is, and a coefficient computed from three observations looks
 * exactly like one computed from three hundred.
 */
export class CorrelationModel {
  static compute(blockData: CorrelationBlock['data']): CorrelationMatrix {
    const variables = blockData.variables;
    const threshold = blockData.significanceThreshold ?? 0.05;

    const cells: CorrelationCell[][] = variables.map((rowVariable) =>
      variables.map((columnVariable) => {
        const xs = blockData.observations.map((observation) => observation[rowVariable.key]);
        const ys = blockData.observations.map((observation) => observation[columnVariable.key]);

        const { coefficient, n } = pearsonCorrelation(xs, ys);

        if (coefficient === null) {
          return {
            coefficient: null,
            n,
            pValue: 1,
            isSignificant: false,
            description: describeCorrelation(null),
          };
        }

        const pValue = correlationPValue(coefficient, n);

        return {
          coefficient,
          n,
          pValue,
          isSignificant: pValue <= threshold,
          description: describeCorrelation(coefficient),
        };
      })
    );

    // The diagonal of a correlation matrix is always 1.
    variables.forEach((_, index) => {
      const cell = cells[index][index];
      if (cell.coefficient === null) return;
      cell.isSignificant = true;
    });

    const matrix: CorrelationMatrix = { variables, cells };

    // The strongest off-diagonal relationship.
    let strongest: CorrelationMatrix['strongest'];
    for (let row = 0; row < variables.length; row++) {
      for (let column = row + 1; column < variables.length; column++) {
        const cell = cells[row][column];
        if (cell.coefficient === null) continue;
        if (!strongest || Math.abs(cell.coefficient) > Math.abs(strongest.coefficient)) {
          strongest = {
            rowLabel: variables[row].label,
            columnLabel: variables[column].label,
            coefficient: cell.coefficient,
            isSignificant: cell.isSignificant,
          };
        }
      }
    }
    if (strongest) matrix.strongest = strongest;

    return matrix;
  }

  /**
   * A one-line summary of the matrix.
   *
   * The wording is careful: a correlation is a relationship, not a cause.
   */
  static summarise(matrix: CorrelationMatrix): string {
    if (!matrix.strongest) {
      return 'Not enough paired observations to compare these variables.';
    }

    const { rowLabel, columnLabel, coefficient, isSignificant } = matrix.strongest;
    const direction = coefficient >= 0 ? 'positively' : 'negatively';
    const strength = describeCorrelation(coefficient);

    const significance = isSignificant
      ? 'The relationship is statistically significant.'
      : 'The relationship is not statistically significant, so it may be noise.';

    return `${rowLabel} and ${columnLabel} are ${direction} related (${strength}, r = ${coefficient.toFixed(2)}). ${significance} A correlation is not evidence of causation.`;
  }
}
