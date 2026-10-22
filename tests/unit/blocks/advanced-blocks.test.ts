import { describe, it, expect } from 'vitest';
import {
  AnomalyBlockSchema,
  NetworkGraphBlockSchema,
  RegressionBlockSchema,
  SankeyBlockSchema,
  SurveyResultsBlockSchema,
  TreemapBlockSchema,
  StoryBlockSchema,
  getBlockDefinition,
} from '@ai-news/schemas';
import {
  AnomalyDetector,
  AnomalyRenderer,
  RegressionModel,
  RegressionRenderer,
  SankeyRenderer,
  SurveyResultsRenderer,
  TreemapRenderer,
  computeNetworkLayout,
  networkGroupColor,
  networkGroups,
} from '@ai-news/media';
import { extractTextContent } from '@ai-news/content';

const base = { id: 'blk_advanced_test', sortOrder: 0 };

const sankeyData = {
  title: 'From a complaint to a correction',
  nodes: [
    { id: 'received', label: 'Received' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'rejected', label: 'Rejected' },
  ],
  links: [
    { source: 'received', target: 'accepted', value: 120 },
    { source: 'received', target: 'rejected', value: 30 },
  ],
  unit: 'cases',
};

const treemapData = {
  title: 'The budget',
  nodes: [
    { id: 'core', label: 'Core' },
    { id: 'upgrades', label: 'Upgrades', parentId: 'core', value: 40 },
    { id: 'metering', label: 'Metering', parentId: 'core', value: 20 },
  ],
};

const regressionData = {
  title: 'Complaints rise with volume',
  xLabel: 'Filings',
  yLabel: 'Complaints',
  points: [
    { x: 1, y: 2 },
    { x: 2, y: 4 },
    { x: 3, y: 6 },
    { x: 4, y: 8 },
    { x: 5, y: 10 },
  ],
  model: 'linear' as const,
  confidenceLevel: 0.95,
};

const anomalyData = {
  title: 'Night-time consumption',
  points: [
    { x: '00:00', y: 40 },
    { x: '00:30', y: 41 },
    { x: '01:00', y: 39 },
    { x: '01:30', y: 40 },
    { x: '02:00', y: 42 },
    { x: '02:30', y: 40 },
    { x: '03:00', y: 39 },
    { x: '03:30', y: 41 },
    { x: '04:00', y: 40 },
    { x: '04:30', y: 120 },
  ],
  method: 'zscore' as const,
  threshold: 2.5,
  window: 6,
};

const networkData = {
  title: 'The network',
  nodes: [
    { id: 'a', label: 'Alpha', group: 'One' },
    { id: 'b', label: 'Bravo', group: 'Two' },
    { id: 'c', label: 'Charlie', group: 'One' },
  ],
  links: [
    { source: 'a', target: 'b' },
    { source: 'b', target: 'c' },
  ],
};

const surveyData = {
  question: 'Do you trust the figures?',
  responses: [
    { option: 'Yes', count: 40 },
    { option: 'No', count: 60 },
  ],
  totalRespondents: 100,
};

describe('Sankey block', () => {
  it('validates nodes and links', () => {
    const block = SankeyBlockSchema.parse({ ...base, blockType: 'sankey', data: sankeyData });
    expect(block.data.nodes).toHaveLength(3);
    expect(block.data.links).toHaveLength(2);
  });

  it('is part of the story block union', () => {
    const parsed = StoryBlockSchema.parse({ ...base, blockType: 'sankey', data: sankeyData });
    expect(parsed.blockType).toBe('sankey');
  });

  it('rejects a link that points at a node that is not there', () => {
    // The link itself is well formed; the renderer is what leaves it out.
    const parsed = SankeyBlockSchema.parse({
      ...base,
      blockType: 'sankey',
      data: {
        ...sankeyData,
        links: [{ source: 'received', target: 'nowhere', value: 10 }],
      },
    });
    expect(parsed.data.links[0].target).toBe('nowhere');
  });

  it('rejects a block with fewer than two nodes', () => {
    expect(() =>
      SankeyBlockSchema.parse({
        ...base,
        blockType: 'sankey',
        data: { ...sankeyData, nodes: [{ id: 'a', label: 'A' }] },
      })
    ).toThrow();
  });

  it('draws a ribbon for every link', () => {
    const svg = SankeyRenderer.renderToSvg(sankeyData, { width: 800, height: 400 });
    expect(svg).toContain('<svg');
    expect(svg).toContain('data-node-id="accepted"');
    expect(svg).toContain('data-link="received-accepted"');
  });

  it('leaves out a link to a node that is not there', () => {
    const svg = SankeyRenderer.renderToSvg(
      { ...sankeyData, links: [{ source: 'received', target: 'nowhere', value: 10 }] },
      { width: 800, height: 400 }
    );
    expect(svg).not.toContain('data-link=');
  });

  it('reaches the text extractor', () => {
    const text = extractTextContent([{ ...base, blockType: 'sankey', data: sankeyData } as never]);
    expect(text).toContain('From a complaint to a correction');
    expect(text).toContain('Accepted');
  });
});

describe('Treemap block', () => {
  it('validates the hierarchy', () => {
    const block = TreemapBlockSchema.parse({ ...base, blockType: 'treemap', data: treemapData });
    expect(block.data.nodes).toHaveLength(3);
  });

  it('rejects a negative value', () => {
    expect(() =>
      TreemapBlockSchema.parse({
        ...base,
        blockType: 'treemap',
        data: { ...treemapData, nodes: [{ id: 'a', label: 'A', value: -1 }] },
      })
    ).toThrow();
  });

  it('sizes the leaves in proportion', () => {
    const svg = TreemapRenderer.renderToSvg(treemapData, { width: 800, height: 400 });
    expect(svg).toContain('data-node-id="upgrades"');
    expect(svg).toContain('data-node-id="metering"');
  });
});

describe('Regression block', () => {
  it('validates the measurements', () => {
    const block = RegressionBlockSchema.parse({
      ...base,
      blockType: 'regression',
      data: regressionData,
    });
    expect(block.data.points).toHaveLength(5);
  });

  it('rejects fewer than two measurements', () => {
    expect(() =>
      RegressionBlockSchema.parse({
        ...base,
        blockType: 'regression',
        data: { ...regressionData, points: [{ x: 1, y: 2 }] },
      })
    ).toThrow();
  });

  it('fits a straight line through the points exactly', () => {
    const fit = RegressionModel.fit(regressionData);
    expect(fit).not.toBeNull();
    // y = 2x, so the slope is 2 and the intercept is 0.
    expect(fit!.coefficients[1].value).toBeCloseTo(2, 6);
    expect(fit!.coefficients[0].value).toBeCloseTo(0, 6);
    expect(fit!.rSquared).toBeCloseTo(1, 6);
    expect(fit!.observations).toBe(5);
  });

  it('reports a band around the fit', () => {
    const fit = RegressionModel.fit(regressionData);
    const band = fit!.band(3, 0.95);
    expect(band.lower).toBeLessThan(6);
    expect(band.upper).toBeGreaterThan(6);
  });

  it('refuses a model it cannot fit', () => {
    // A logarithm of a negative number is not a number, so the model cannot
    // be fitted at all.
    const fit = RegressionModel.fit({
      ...regressionData,
      model: 'logarithmic',
      points: [
        { x: -2, y: 2 },
        { x: -1, y: 4 },
        { x: 1, y: 6 },
        { x: 2, y: 8 },
        { x: 3, y: 10 },
      ],
    });
    expect(fit).toBeNull();
  });

  it('writes the equation out', () => {
    const svg = RegressionRenderer.renderToSvg(regressionData, { width: 800, height: 400 });
    expect(svg).toContain('R²');
    expect(svg).toContain('<svg');
  });
});

describe('Anomaly block', () => {
  it('validates the series', () => {
    const block = AnomalyBlockSchema.parse({ ...base, blockType: 'anomaly', data: anomalyData });
    expect(block.data.points).toHaveLength(10);
  });

  it('rejects fewer than three readings', () => {
    expect(() =>
      AnomalyBlockSchema.parse({
        ...base,
        blockType: 'anomaly',
        data: { ...anomalyData, points: [{ x: 'a', y: 1 }] },
      })
    ).toThrow();
  });

  it('flags the reading that is far out of line', () => {
    const result = AnomalyDetector.detect(anomalyData);
    expect(result.anomalies).toHaveLength(1);
    expect(result.anomalies[0].x).toBe('04:30');
    expect(result.anomalies[0].direction).toBe('up');
  });

  it('says which method it used', () => {
    const result = AnomalyDetector.detect(anomalyData);
    expect(result.method).toBe('zscore');
    expect(result.methodLabel).toContain('Standard deviations');
    expect(result.window).toBe(6);
  });

  it('honours a direction', () => {
    const result = AnomalyDetector.detect({ ...anomalyData, direction: 'down' });
    expect(result.anomalies).toHaveLength(0);
  });

  it('marks the flagged readings in the drawing', () => {
    const svg = AnomalyRenderer.renderToSvg(anomalyData, { width: 800, height: 400 });
    expect(svg).toContain('data-anomaly="04:30"');
  });
});

describe('Network graph block', () => {
  it('validates the nodes and connections', () => {
    const block = NetworkGraphBlockSchema.parse({
      ...base,
      blockType: 'network_graph',
      data: networkData,
    });
    expect(block.data.nodes).toHaveLength(3);
  });

  it('rejects fewer than two nodes', () => {
    expect(() =>
      NetworkGraphBlockSchema.parse({
        ...base,
        blockType: 'network_graph',
        data: { ...networkData, nodes: [{ id: 'a', label: 'A' }] },
      })
    ).toThrow();
  });

  it('lays the nodes out inside the frame', () => {
    const layout = computeNetworkLayout(networkData, { width: 800, height: 560 });
    expect(layout.nodes).toHaveLength(3);
    for (const node of layout.nodes) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x).toBeLessThanOrEqual(800);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeLessThanOrEqual(560);
    }
  });

  it('draws the same layout every time', () => {
    const first = computeNetworkLayout(networkData, { width: 800, height: 560 });
    const second = computeNetworkLayout(networkData, { width: 800, height: 560 });
    expect(first.nodes.map((node) => [node.x, node.y])).toEqual(
      second.nodes.map((node) => [node.x, node.y])
    );
  });

  it('counts the connections to each node', () => {
    const layout = computeNetworkLayout(networkData, { width: 800, height: 560 });
    expect(layout.degrees.b).toBe(2);
    expect(layout.degrees.a).toBe(1);
  });

  it('leaves out a connection to a node that is not there', () => {
    const layout = computeNetworkLayout(
      { ...networkData, links: [{ source: 'a', target: 'nowhere' }] },
      { width: 800, height: 560 }
    );
    expect(layout.links).toHaveLength(0);
  });

  it('gives every group its own colour', () => {
    const layout = computeNetworkLayout(networkData, { width: 800, height: 560 });
    const groups = networkGroups(layout.nodes);
    expect(groups).toEqual(['One', 'Two']);
    expect(networkGroupColor(groups, 'One')).not.toBe(networkGroupColor(groups, 'Two'));
  });
});

describe('Survey results block', () => {
  it('validates the responses', () => {
    const block = SurveyResultsBlockSchema.parse({
      ...base,
      blockType: 'survey_results',
      data: surveyData,
    });
    expect(block.data.responses).toHaveLength(2);
  });

  it('requires a question', () => {
    expect(() =>
      SurveyResultsBlockSchema.parse({
        ...base,
        blockType: 'survey_results',
        data: { ...surveyData, question: '' },
      })
    ).toThrow();
  });

  it('reaches the text extractor', () => {
    const text = extractTextContent([
      { ...base, blockType: 'survey_results', data: surveyData } as never,
    ]);
    expect(text).toContain('Do you trust the figures?');
    expect(text).toContain('Yes');
  });
});

describe('The new blocks are registered', () => {
  it('describes every one of them', () => {
    for (const type of [
      'sankey',
      'treemap',
      'network_graph',
      'regression',
      'anomaly',
      'survey_results',
    ]) {
      const definition = getBlockDefinition(type);
      expect(definition, type).toBeDefined();
      expect(definition!.description.length).toBeGreaterThan(10);
      expect(definition!.schemaVersion).toBeGreaterThanOrEqual(1);
    }
  });
});

/**
 * A variant is a different way of drawing the same thing, not just different
 * numbers. These tests check that each style really does draw a different
 * picture — a variant that only changed the data would be a lie about what
 * the studio is offering.
 */
describe('The style variants really are different pictures', () => {
  it('draws the sankey in four different ways', () => {
    const styles = ['classic', 'vertical', 'minimal', 'organic'] as const;
    const drawings = styles.map((style) =>
      SankeyRenderer.renderToSvg({ ...sankeyData, style }, { width: 800, height: 400 })
    );

    // Every style draws something.
    for (const drawing of drawings) {
      expect(drawing).toContain('<svg');
      expect(drawing.length).toBeGreaterThan(200);
    }

    // And no two of them draw the same thing.
    expect(new Set(drawings).size).toBe(styles.length);

    // A minimal flow is hairlines, not ribbons.
    expect(drawings[2]).toContain('stroke-width="1.5"');
    // An organic flow curves.
    expect(drawings[3]).toContain(' Q');
    // A classic flow is a band.
    expect(drawings[0]).toContain('linearGradient');
    // A vertical flow puts the name above the bar.
    expect(drawings[1]).toContain('text-anchor="middle"');
  });

  it('keeps every label of every sankey style on the page', () => {
    const styles = ['classic', 'vertical', 'minimal', 'organic'] as const;

    for (const style of styles) {
      const svg = SankeyRenderer.renderToSvg({ ...sankeyData, style }, { width: 800, height: 400 });

      for (const match of svg.matchAll(/<text x="(-?[\d.]+)" y="(-?[\d.]+)"/g)) {
        const x = Number(match[1]);
        const y = Number(match[2]);
        // A label that hangs off the edge of the picture is a label the
        // reader cannot read.
        expect(x, `${style} label x`).toBeGreaterThanOrEqual(0);
        expect(x, `${style} label x`).toBeLessThanOrEqual(800);
        expect(y, `${style} label y`).toBeGreaterThanOrEqual(0);
        expect(y, `${style} label y`).toBeLessThanOrEqual(400);
      }
    }
  });

  it('tiles the treemap four different ways', () => {
    /*
     * A tree with enough parts in it for the tilings to tell each other
     * apart. Two leaves laid side by side look the same however they are
     * cut, so the tree has to be deep enough to show the difference.
     */
    const tree = {
      title: 'The budget',
      nodes: [
        { id: 'core', label: 'Core' },
        { id: 'upgrades', label: 'Upgrades', parentId: 'core', value: 40 },
        { id: 'metering', label: 'Metering', parentId: 'core', value: 20 },
        { id: 'training', label: 'Training', parentId: 'core', value: 12 },
        { id: 'audit', label: 'Audit', parentId: 'core', value: 8 },
        { id: 'field', label: 'Field equipment', parentId: 'upgrades', value: 25 },
        { id: 'stations', label: 'Substations', parentId: 'upgrades', value: 15 },
        { id: 'smart', label: 'Smart meters', parentId: 'metering', value: 14 },
        { id: 'manual', label: 'Manual reads', parentId: 'metering', value: 6 },
      ],
    };
    const layouts = ['squarify', 'slice', 'dice', 'binary'] as const;
    const drawings = layouts.map((layout) =>
      TreemapRenderer.renderToSvg({ ...tree, layout }, { width: 800, height: 400 })
    );

    for (const drawing of drawings) {
      expect(drawing).toContain('<svg');
    }
    // Four different tilings of the same parts.
    expect(new Set(drawings).size).toBe(layouts.length);
  });

  it('draws the survey in four different ways', () => {
    const styles = ['bars', 'stack', 'waffle', 'donut'] as const;
    const drawings = styles.map((style) =>
      SurveyResultsRenderer.renderToSvg({ ...surveyData, style }, { width: 800, height: 400 })
    );

    for (const drawing of drawings) {
      expect(drawing).toContain('<svg');
    }
    expect(new Set(drawings).size).toBe(styles.length);
    // A waffle is a grid of squares; a donut is a ring of paths.
    expect(drawings[2]).toContain('<rect');
    expect(drawings[3]).toContain('<path');
  });
});
