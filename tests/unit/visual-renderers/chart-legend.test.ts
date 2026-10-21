import { describe, it, expect } from 'vitest';
import { D3ChartRenderer } from '@ai-news/media';
import type { ChartBlock } from '@ai-news/schemas';

/**
 * The legend is part of the block's payload, so it has to be honoured.
 *
 * `legend.show` and `legend.position` were declared in the schema and never
 * read: the renderer always showed a legend, and always put it at the top.
 * An editor changing either field in the Block Studio saw no effect.
 */

function twoSeriesChart(legend?: ChartBlock['data']['legend']): ChartBlock['data'] {
  return {
    chartType: 'bar',
    title: 'Overstatement by cause',
    xAxis: { key: 'quarter', label: 'Quarter' },
    yAxis: { label: 'Points', unit: 'pp' },
    legend,
    series: [
      { name: 'Measurement', key: 'measurement' },
      { name: 'Classification', key: 'classification' },
    ],
    values: [
      { quarter: 'Q1', measurement: 4, classification: 2 },
      { quarter: 'Q2', measurement: 6, classification: 3 },
    ],
  };
}

/** The y coordinate of the legend swatches, so the position can be compared. */
function legendSwatchY(svg: string): number | null {
  const match = /<g transform="translate\([\d.]+,\s*([\d.]+)\)">\s*<rect width="12"/.exec(svg);
  return match ? Number(match[1]) : null;
}

/** The x coordinate of the legend swatches. */
function legendSwatchX(svg: string): number | null {
  const match = /<g transform="translate\(([\d.]+),\s*[\d.]+\)">\s*<rect width="12"/.exec(svg);
  return match ? Number(match[1]) : null;
}

describe('Chart legend', () => {
  it('shows a legend by default', () => {
    const svg = D3ChartRenderer.renderToSvg(twoSeriesChart(), { theme: 'light' });

    expect(svg).toContain('Measurement');
    expect(svg).toContain('Classification');
    expect(legendSwatchY(svg)).not.toBeNull();
  });

  it('hides the legend when the block asks for no legend', () => {
    const svg = D3ChartRenderer.renderToSvg(twoSeriesChart({ show: false, position: 'top' }), {
      theme: 'light',
    });

    expect(svg).not.toContain('Measurement');
    expect(svg).not.toContain('Classification');
    expect(legendSwatchY(svg)).toBeNull();
  });

  it('places the legend at the bottom when the block asks for it', () => {
    const top = D3ChartRenderer.renderToSvg(twoSeriesChart({ show: true, position: 'top' }), {
      theme: 'light',
      width: 800,
      height: 440,
    });
    const bottom = D3ChartRenderer.renderToSvg(twoSeriesChart({ show: true, position: 'bottom' }), {
      theme: 'light',
      width: 800,
      height: 440,
    });

    const topY = legendSwatchY(top);
    const bottomY = legendSwatchY(bottom);

    expect(topY).not.toBeNull();
    expect(bottomY).not.toBeNull();
    // A bottom legend sits below the plot; a top legend sits above it.
    expect(bottomY!).toBeGreaterThan(topY!);
  });

  it('places the legend on the right when the block asks for it', () => {
    const top = D3ChartRenderer.renderToSvg(twoSeriesChart({ show: true, position: 'top' }), {
      theme: 'light',
      width: 800,
      height: 440,
    });
    const right = D3ChartRenderer.renderToSvg(twoSeriesChart({ show: true, position: 'right' }), {
      theme: 'light',
      width: 800,
      height: 440,
    });

    const topX = legendSwatchX(top);
    const rightX = legendSwatchX(right);

    expect(topX).not.toBeNull();
    expect(rightX).not.toBeNull();
    expect(rightX!).toBeGreaterThan(topX!);
  });

  it('still shows a single series with no legend entry when the block says so', () => {
    const svg = D3ChartRenderer.renderToSvg(
      {
        ...twoSeriesChart({ show: false, position: 'top' }),
        series: [{ name: 'Only one', key: 'measurement' }],
      },
      { theme: 'light' }
    );

    expect(svg).not.toContain('Only one');
  });
});
