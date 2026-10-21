import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { generateId } from '@ai-news/shared';
import type { AddBlockHelper } from './block-tool-helpers';

export function registerDataStorytellingTools(server: McpServer, helperAdd: AddBlockHelper) {
  // 8. add_chart_block (§38)
  server.tool(
    'add_chart_block',
    '[WRITE] Add a programmatic D3 chart directly to a story. Every chart type in the block catalog is supported (line, area, bar, stacked_bar, grouped_bar, scatter, heatmap, histogram, waterfall, donut, pie, kpi, comparison, slope, dot_plot, lollipop, diverging_bar, sparkline, bump, radar, small_multiples).',
    {
      storyId: z.string().min(1),
      chartType: z.enum([
        'line',
        'area',
        'bar',
        'stacked_bar',
        'grouped_bar',
        'scatter',
        'heatmap',
        'histogram',
        'waterfall',
        'donut',
        'pie',
        'kpi',
        'comparison',
        'slope',
        'dot_plot',
        'lollipop',
        'diverging_bar',
        'sparkline',
        'bump',
        'radar',
        'small_multiples',
      ]),
      title: z.string().min(1),
      xAxis: z.object({
        key: z.string(),
        label: z.string(),
        type: z.enum(['category', 'time', 'linear']).default('category'),
      }),
      yAxis: z.object({
        label: z.string(),
        unit: z.string().optional(),
      }),
      series: z.array(
        z.object({ name: z.string(), key: z.string(), color: z.string().optional() })
      ),
      values: z.array(z.record(z.unknown())).min(1),
      annotations: z
        .array(
          z.object({
            id: z.string().min(1).describe('Stable id for the annotation'),
            xValue: z
              .string()
              .min(1)
              .describe(
                'Value of the x-axis key for the data point to anchor to (e.g. "2026" when xAxis.key is "year")'
              ),
            seriesKey: z
              .string()
              .optional()
              .describe('Series to anchor to, when the chart has more than one'),
            label: z.string().min(1).describe('Short headline for the annotation'),
            body: z.string().max(2000).describe('Explanation revealed when opened'),
            sourceId: z.string().optional().describe('Registered source id backing it'),
          })
        )
        .default([])
        .describe('Click-to-reveal annotations anchored to specific data points'),
      sourceAttribution: z.string().optional(),
    },
    async ({ storyId, ...chartData }) =>
      helperAdd(storyId, {
        id: generateId('blk_chart'),
        blockType: 'chart',
        sortOrder: 0,
        data: chartData,
      })
  );

  // add_uncertainty_block
  server.tool(
    'add_uncertainty_block',
    '[WRITE] Add an estimates-with-confidence-intervals block. Each point carries a point estimate, its lower and upper bounds, an optional sample size and an optional source. Use this whenever a number is an estimate rather than a measurement.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      title: z.string().min(1).describe('Headline for the set of estimates'),
      subtitle: z.string().optional().describe('Secondary line under the title'),
      description: z.string().max(4000).optional().describe('Explainer shown above the plot'),
      unit: z
        .string()
        .optional()
        .describe('Unit shared by every estimate (e.g. "TWh", "$bn", "%")'),
      intervalLabel: z
        .string()
        .optional()
        .describe('How to describe the interval (e.g. "95% credible interval")'),
      confidenceLevel: z
        .number()
        .min(0)
        .max(1)
        .optional()
        .describe('Confidence level behind the intervals (0.95 for 95%)'),
      points: z
        .array(
          z.object({
            id: z.string().optional(),
            label: z.string().min(1).describe('What the estimate is about'),
            value: z.number().describe('The point estimate'),
            low: z.number().describe('Lower bound of the interval'),
            high: z.number().describe('Upper bound of the interval'),
            n: z.number().int().nonnegative().optional().describe('Sample size, if known'),
            sourceId: z.string().optional().describe('Registered source id for this estimate'),
            note: z.string().max(2000).optional().describe('Short editorial caveat'),
          })
        )
        .min(1)
        .max(50),
      referenceValue: z
        .number()
        .optional()
        .describe('Reference line value — consensus, target or baseline'),
      referenceLabel: z.string().optional().describe('Label for the reference line'),
      methodology: z
        .string()
        .max(4000)
        .optional()
        .describe('How the estimates and intervals were produced'),
      sourceAttribution: z.string().optional(),
    },
    async ({ storyId, ...data }) =>
      helperAdd(storyId, {
        id: generateId('blk_unc'),
        blockType: 'uncertainty',
        sortOrder: 0,
        data,
      })
  );

  // add_correlation_block
  server.tool(
    'add_correlation_block',
    '[WRITE] Add a correlation matrix. Supply the raw observations — the platform derives the coefficients, the sample sizes and the significance, so the reader can see how well-evidenced each relationship is.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      title: z.string().min(1).describe('Headline for the matrix'),
      subtitle: z.string().optional().describe('Secondary line under the title'),
      description: z.string().max(4000).optional().describe('Explainer shown above the matrix'),
      variables: z
        .array(
          z.object({
            key: z
              .string()
              .min(1)
              .describe('Key the observations are stored under (no spaces, e.g. "gpu_price")'),
            label: z.string().min(1).describe('Readable label'),
            unit: z.string().optional().describe('Unit of the variable'),
          })
        )
        .min(2)
        .max(20),
      observations: z
        .array(z.record(z.number()))
        .min(2)
        .max(5000)
        .describe(
          'One row per observation, keyed by the variable keys. Missing values are skipped when a pair is incomplete.'
        ),
      rowLabels: z
        .array(z.string())
        .optional()
        .describe('Optional labels for the observations (e.g. years)'),
      showCoefficients: z.boolean().default(true),
      significanceThreshold: z
        .number()
        .min(0)
        .max(1)
        .default(0.05)
        .describe('The p-value below which a relationship is marked significant'),
      methodology: z.string().max(4000).optional(),
      sourceAttribution: z.string().optional(),
    },
    async ({ storyId, ...data }) =>
      helperAdd(storyId, {
        id: generateId('blk_corr'),
        blockType: 'correlation',
        sortOrder: 0,
        data,
      })
  );

  // add_knowledge_graph_block
  server.tool(
    'add_knowledge_graph_block',
    '[WRITE] Add a knowledge graph over the entities, sources and events in a story. Nodes are typed and edges carry a named relationship.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      title: z.string().min(1).describe('Headline for the graph'),
      description: z.string().max(4000).optional().describe('Explainer shown above the graph'),
      nodes: z
        .array(
          z.object({
            id: z.string().min(1).describe('Stable id for the node'),
            label: z.string().min(1).describe('Display name of the entity'),
            type: z
              .string()
              .min(1)
              .describe(
                'The kind of thing: person, organization, company, country, source, story, event, product, location'
              ),
            description: z.string().max(2000).optional(),
            url: z.string().url().optional(),
          })
        )
        .min(1)
        .max(120),
      edges: z
        .array(
          z.object({
            id: z.string().min(1).describe('Stable id for the relationship'),
            from: z.string().min(1).describe('The node id the relationship starts at'),
            to: z.string().min(1).describe('The node id the relationship points to'),
            relation: z
              .string()
              .min(1)
              .describe('The relationship in words (e.g. "employs", "cited by")'),
            weight: z.number().optional().describe('Strength of the relationship'),
            label: z.string().optional().describe('Short label for the edge'),
          })
        )
        .max(400)
        .default([]),
      focusNodeId: z
        .string()
        .optional()
        .describe('The node the layout centres on. Defaults to the most connected node.'),
      methodology: z.string().max(4000).optional(),
      sourceAttribution: z.string().optional(),
    },
    async ({ storyId, ...data }) =>
      helperAdd(storyId, {
        id: generateId('blk_kg'),
        blockType: 'knowledge_graph',
        sortOrder: 0,
        data,
      })
  );

  // add_animated_map_block
  server.tool(
    'add_animated_map_block',
    '[WRITE] Add a map that moves through time. The reader scrubs through the frames, so the story shows how a situation spread rather than only its end state.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      title: z.string().min(1).describe('Headline for the map'),
      description: z.string().max(4000).optional().describe('Explainer shown above the map'),
      frames: z
        .array(
          z.object({
            at: z.string().min(1).describe('When this frame was recorded (ISO date)'),
            label: z.string().optional().describe('Short label for the frame'),
            points: z
              .array(
                z.object({
                  id: z.string().min(1).describe('Stable id for the location'),
                  label: z.string().min(1).describe('Name of the location'),
                  lng: z.number().min(-180).max(180).describe('Longitude'),
                  lat: z.number().min(-90).max(90).describe('Latitude'),
                  value: z.number().optional().describe('The value that sizes the marker'),
                  highlight: z.boolean().default(false).describe('Mark as the focus of the story'),
                })
              )
              .default([]),
          })
        )
        .min(2)
        .max(60),
      valueLabel: z.string().optional().describe('What the values represent'),
      unit: z.string().optional().describe('Unit of the values'),
      autoplay: z.boolean().default(false).describe('Play the frames automatically on load'),
      methodology: z.string().max(4000).optional(),
      sourceAttribution: z.string().optional(),
    },
    async ({ storyId, ...data }) =>
      helperAdd(storyId, {
        id: generateId('blk_amap'),
        blockType: 'animated_map',
        sortOrder: 0,
        data,
      })
  );

  // add_sensitivity_block
  server.tool(
    'add_sensitivity_block',
    '[WRITE] Add a sensitivity analysis block. Give a base case, a range for each input, and the expression that produces the output; the platform varies one input at a time and shows which assumption actually drives the result.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      title: z.string().min(1).describe('Headline for the analysis'),
      subtitle: z.string().optional().describe('Secondary line under the title'),
      description: z.string().max(4000).optional().describe('Explainer shown above the chart'),
      outputLabel: z
        .string()
        .min(1)
        .describe('What the output measures (e.g. "Annual emissions", "Total capital cost")'),
      outputUnit: z.string().optional().describe('Unit of the output (e.g. "Mt", "$m")'),
      baseOutput: z.number().describe('The output at the base case'),
      expression: z
        .string()
        .min(1)
        .describe(
          'Expression producing the output from the input ids, e.g. "capacity * panel_cost + capacity * 0.04 * labour_rate". Only + - * / ( ) and the input ids are allowed.'
        ),
      inputs: z
        .array(
          z.object({
            id: z
              .string()
              .min(1)
              .describe('Identifier used in the expression (no spaces, e.g. "panel_cost")'),
            label: z.string().min(1).describe('Readable label'),
            base: z.number().describe('Value at the base case'),
            low: z.number().describe('Low end of the explored range'),
            high: z.number().describe('High end of the explored range'),
            unit: z.string().optional().describe('Unit of this input'),
            note: z.string().max(2000).optional().describe('Where the range comes from'),
          })
        )
        .min(1)
        .max(12),
      methodology: z
        .string()
        .max(4000)
        .optional()
        .describe('How the ranges and the base case were chosen'),
      sourceAttribution: z.string().optional(),
    },
    async ({ storyId, ...data }) =>
      helperAdd(storyId, {
        id: generateId('blk_sens'),
        blockType: 'sensitivity',
        sortOrder: 0,
        data,
      })
  );

  // add_prediction_leaderboard_block
  server.tool(
    'add_prediction_leaderboard_block',
    '[WRITE] Add a tracked-prediction leaderboard. Each prediction carries a probability and, once resolved, an outcome; the platform scores forecasters by Brier score and reports their calibration.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      title: z.string().min(1).describe('Headline for the leaderboard'),
      subtitle: z.string().optional().describe('Secondary line under the title'),
      description: z.string().max(4000).optional().describe('Explainer shown above the table'),
      predictions: z
        .array(
          z.object({
            id: z.string().min(1).describe('Stable id for the prediction'),
            claim: z.string().min(1).describe('What is being predicted'),
            forecaster: z.string().min(1).describe('Who made the prediction'),
            forecasterId: z.string().optional(),
            probability: z.number().min(0).max(1).describe('Probability the claim comes true'),
            resolvesAt: z.string().optional().describe('When the prediction resolves'),
            predictedAt: z.string().optional().describe('When the prediction was made'),
            resolved: z.boolean().default(false).describe('Whether it has resolved'),
            outcome: z
              .number()
              .min(0)
              .max(1)
              .optional()
              .describe('1 when the claim came true, 0 when it did not'),
            sourceId: z.string().optional().describe('Registered source id'),
            note: z.string().max(2000).optional(),
          })
        )
        .min(1)
        .max(200),
      scoringMethod: z
        .string()
        .max(2000)
        .optional()
        .describe('How the score is calculated, shown next to the leaderboard'),
      methodology: z.string().max(4000).optional(),
      sourceAttribution: z.string().optional(),
    },
    async ({ storyId, ...data }) =>
      helperAdd(storyId, {
        id: generateId('blk_pred'),
        blockType: 'prediction_leaderboard',
        sortOrder: 0,
        data,
      })
  );

  // add_what_if_block
  server.tool(
    'add_what_if_block',
    '[WRITE] Add an interactive scenario explorer. The reader moves sliders over a range for each input and the outcome recomputes live from the expressions you supply.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      title: z.string().min(1).describe('Headline for the explorer'),
      description: z.string().max(4000).optional().describe('Explainer shown above the sliders'),
      inputs: z
        .array(
          z.object({
            id: z
              .string()
              .min(1)
              .describe('Identifier used in the expressions (no spaces, e.g. "insulation_saving")'),
            label: z.string().min(1).describe('Readable label'),
            min: z.number().describe('Lowest value the reader can dial to'),
            max: z.number().describe('Highest value the reader can dial to'),
            step: z.number().positive().optional().describe('Slider granularity'),
            defaultValue: z.number().describe('Where the slider starts'),
            unit: z.string().optional().describe('Unit shown beside the value'),
            note: z.string().max(2000).optional(),
          })
        )
        .min(1)
        .max(8),
      expression: z
        .string()
        .min(1)
        .describe(
          'Expression producing the outcome from the input ids, e.g. "base_bill * (1 - insulation_saving)". Only + - * / ( ) and the input ids are allowed.'
        ),
      outcomeLabel: z.string().min(1).describe('What the outcome measures'),
      outcomeUnit: z.string().optional().describe('Unit of the outcome'),
      breakdown: z
        .array(
          z.object({
            label: z.string().min(1).describe('Name of this component'),
            expression: z.string().min(1).describe('Expression producing the component'),
            color: z.string().optional().describe('CSS colour for the component'),
          })
        )
        .max(8)
        .optional()
        .describe('Optional breakdown of the outcome into components'),
      baselineOutcome: z
        .number()
        .optional()
        .describe('The outcome at the default values, if it differs from the computed baseline'),
      methodology: z.string().max(4000).optional(),
      sourceAttribution: z.string().optional(),
    },
    async ({ storyId, ...data }) =>
      helperAdd(storyId, {
        id: generateId('blk_whatif'),
        blockType: 'what_if',
        sortOrder: 0,
        data,
      })
  );

  // 9. add_map_block (§38)
  server.tool(
    'add_map_block',
    '[WRITE] Add an interactive MapLibre map block with geographic coordinates.',
    {
      storyId: z.string().min(1),
      center: z.tuple([z.number(), z.number()]).describe('[longitude, latitude]'),
      zoom: z.number().min(0).max(22).default(4),
      style: z.enum(['dark', 'light', 'satellite', 'streets']).default('dark'),
      markers: z
        .array(
          z.object({
            coordinates: z.tuple([z.number(), z.number()]),
            title: z.string(),
            description: z.string().optional(),
          })
        )
        .optional(),
      title: z.string().optional(),
    },
    async ({ storyId, ...mapData }) =>
      helperAdd(storyId, {
        id: generateId('blk_map'),
        blockType: 'map',
        sortOrder: 0,
        data: mapData,
      })
  );

  // 10. add_timeline_block (§38)
  server.tool(
    'add_timeline_block',
    '[WRITE] Add a chronological milestone timeline to a story.',
    {
      storyId: z.string().min(1),
      title: z.string().optional(),
      items: z
        .array(
          z.object({
            date: z.string(),
            headline: z.string(),
            body: z.string(),
            sourceIds: z.array(z.string()).optional(),
          })
        )
        .min(1),
    },
    async ({ storyId, title, items }) =>
      helperAdd(storyId, {
        id: generateId('blk_tl'),
        blockType: 'timeline',
        sortOrder: 0,
        data: { title, items },
      })
  );

  // 11. add_diagram_block (§38)
  server.tool(
    'add_diagram_block',
    '[WRITE] Add a flowchart or architecture diagram using Mermaid or declarative syntax.',
    {
      storyId: z.string().min(1),
      definition: z.string().min(1),
      format: z.enum(['mermaid', 'svg_declarative', 'flowchart', 'sequence']).default('mermaid'),
      title: z.string().optional(),
      caption: z.string().optional(),
    },
    async ({ storyId, definition, format, title, caption }) =>
      helperAdd(storyId, {
        id: generateId('blk_diag'),
        blockType: 'diagram',
        sortOrder: 0,
        data: { definition, format, title, caption },
      })
  );

  // 15. add_table_block (§38)
  server.tool(
    'add_table_block',
    '[WRITE] Add a structured numerical or categorical data table.',
    {
      storyId: z.string().min(1),
      headers: z.array(z.string()).min(1),
      rows: z.array(z.array(z.string())).min(1),
      title: z.string().optional(),
      footer: z.string().optional(),
    },
    async ({ storyId, headers, rows, title, footer }) =>
      helperAdd(storyId, {
        id: generateId('blk_tbl'),
        blockType: 'table',
        sortOrder: 0,
        data: { headers, rows, title, footer },
      })
  );

  // 16. add_statistic_block (§38)
  server.tool(
    'add_statistic_block',
    '[WRITE] Add a prominent metric KPI block with trend indicators and context.',
    {
      storyId: z.string().min(1),
      value: z.string().min(1),
      label: z.string().min(1),
      trend: z.enum(['up', 'down', 'neutral']).optional(),
      trendValue: z.string().optional(),
      context: z.string().optional(),
    },
    async ({ storyId, value, label, trend, trendValue, context }) =>
      helperAdd(storyId, {
        id: generateId('blk_stat'),
        blockType: 'statistic',
        sortOrder: 0,
        data: { value, label, trend, trendValue, context },
      })
  );

  // 17. add_comparison_block (§38)
  server.tool(
    'add_comparison_block',
    '[WRITE] Add a side-by-side comparative analysis block between two subjects or viewpoints.',
    {
      storyId: z.string().min(1),
      title: z.string().optional(),
      subjectA: z.object({ name: z.string(), points: z.array(z.string()).min(1) }),
      subjectB: z.object({ name: z.string(), points: z.array(z.string()).min(1) }),
    },
    async ({ storyId, title, subjectA, subjectB }) =>
      helperAdd(storyId, {
        id: generateId('blk_cmp'),
        blockType: 'comparison',
        sortOrder: 0,
        data: { title, subjectA, subjectB },
      })
  );
}
