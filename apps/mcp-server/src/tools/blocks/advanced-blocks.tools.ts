import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { generateId } from '@ai-news/shared';
import type { AddBlockHelper } from './block-tool-helpers';

/**
 * Tools for the flow, hierarchy, analysis and immersive blocks.
 *
 * They are grouped in one file because they were added together and they
 * share a shape: the platform does the arithmetic or the layout, and the
 * agent supplies the data.
 */
export function registerAdvancedBlockTools(server: McpServer, helperAdd: AddBlockHelper) {
  // add_sankey_block
  server.tool(
    'add_sankey_block',
    '[WRITE] Add a flow diagram to a story. The width of each ribbon is the quantity it carries, so use it to show how a total moves between stages, sources or destinations. Every link must point at a node that exists.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      title: z.string().optional().describe('Headline for the diagram'),
      subtitle: z.string().optional().describe('Secondary line under the title'),
      nodes: z
        .array(
          z.object({
            id: z.string().min(1).describe('Stable id, referenced by the links'),
            label: z.string().min(1).describe('Name shown beside the stage'),
            color: z.string().optional().describe('Hex or CSS colour for the node'),
          })
        )
        .min(2)
        .describe('Every stage of the flow'),
      links: z
        .array(
          z.object({
            source: z.string().min(1).describe('Id of the node the flow leaves'),
            target: z.string().min(1).describe('Id of the node the flow arrives at'),
            value: z.number().nonnegative().describe('How much flows along this link'),
            label: z.string().optional(),
          })
        )
        .min(1)
        .describe('How much moves from one stage to another'),
      style: z
        .enum(['classic', 'vertical', 'minimal', 'organic'])
        .optional()
        .describe(
          'How the flow is drawn: wide ribbons, a vertical flow top-to-bottom, hairlines only, or curved links'
        ),
      unit: z.string().optional().describe('The unit the flow is measured in, e.g. cases or £m'),
      showValues: z.boolean().optional().describe('Draw the value on each ribbon'),
      sourceAttribution: z.string().optional(),
      methodology: z.string().max(4000).optional(),
    },
    async ({ storyId, ...data }) =>
      helperAdd(storyId, {
        id: generateId('blk_sankey'),
        blockType: 'sankey',
        sortOrder: 0,
        data,
      })
  );

  // add_treemap_block
  server.tool(
    'add_treemap_block',
    '[WRITE] Add a treemap to a story, showing the size of each part of a hierarchy. The nodes are a flat list: a node that names a parentId sits inside it, and a node that carries a value is drawn at that size.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      title: z.string().optional().describe('Headline for the diagram'),
      subtitle: z.string().optional(),
      nodes: z
        .array(
          z.object({
            id: z.string().min(1).describe('Stable id'),
            parentId: z.string().optional().describe('Id of the node this one sits inside'),
            label: z.string().min(1),
            value: z.number().nonnegative().optional().describe('The size of this node'),
            color: z.string().optional(),
          })
        )
        .min(1)
        .describe('The parts of the hierarchy, as a flat list'),
      layout: z
        .enum(['squarify', 'slice', 'dice', 'binary'])
        .optional()
        .describe(
          'How the rectangles are tiled: as squares, in strips, in a grid, or halved at each step'
        ),
      unit: z.string().optional(),
      showValues: z.boolean().optional(),
      sourceAttribution: z.string().optional(),
      methodology: z.string().max(4000).optional(),
    },
    async ({ storyId, ...data }) =>
      helperAdd(storyId, {
        id: generateId('blk_treemap'),
        blockType: 'treemap',
        sortOrder: 0,
        data,
      })
  );

  // add_network_graph_block
  server.tool(
    'add_network_graph_block',
    '[WRITE] Add a network graph to a story, showing who is connected to whom. The reader can drag the nodes and filter by group. Use it for ownership, directorship, supply or influence.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      title: z.string().optional(),
      subtitle: z.string().optional(),
      nodes: z
        .array(
          z.object({
            id: z.string().min(1).describe('Stable id'),
            label: z.string().min(1),
            group: z.string().optional().describe('Category the node is coloured by'),
            size: z.number().nonnegative().optional(),
            url: z.string().url().optional(),
          })
        )
        .min(2)
        .describe('The people, organisations and things in the graph'),
      links: z
        .array(
          z.object({
            source: z.string().min(1).describe('Id of the node the connection leaves'),
            target: z.string().min(1).describe('Id of the node the connection arrives at'),
            weight: z.number().nonnegative().optional(),
            label: z.string().optional(),
          })
        )
        .min(1)
        .describe('The connections between them'),
      style: z
        .enum(['filled', 'outline', 'bubble'])
        .optional()
        .describe(
          'How the nodes are drawn: filled, as hollow rings, or as bubbles sized by connection'
        ),
      layout: z.enum(['force', 'radial', 'circular']).optional(),
      showLabels: z.boolean().optional(),
      interactive: z.boolean().optional(),
      sourceAttribution: z.string().optional(),
      methodology: z.string().max(4000).optional(),
    },
    async ({ storyId, ...data }) =>
      helperAdd(storyId, {
        id: generateId('blk_network'),
        blockType: 'network_graph',
        sortOrder: 0,
        data,
      })
  );

  // add_regression_block
  server.tool(
    'add_regression_block',
    '[WRITE] Add a regression to a story: a curve fitted through scattered measurements, with the confidence band, the residuals and the equation. The platform fits the curve and works out how much of the variation it explains.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      title: z.string().optional(),
      subtitle: z.string().optional(),
      caption: z.string().optional(),
      xLabel: z.string().optional(),
      yLabel: z.string().optional(),
      points: z
        .array(
          z.object({
            x: z.number(),
            y: z.number(),
            label: z.string().optional(),
          })
        )
        .min(2)
        .describe('The measurements the curve is fitted through'),
      model: z.enum(['linear', 'quadratic', 'logarithmic', 'exponential']).optional(),
      confidenceLevel: z.number().min(0.5).max(0.999).optional(),
      showConfidenceBand: z.boolean().optional(),
      showResiduals: z.boolean().optional(),
      showEquation: z.boolean().optional(),
      sourceAttribution: z.string().optional(),
      methodology: z.string().max(4000).optional(),
    },
    async ({ storyId, ...data }) =>
      helperAdd(storyId, {
        id: generateId('blk_regression'),
        blockType: 'regression',
        sortOrder: 0,
        data,
      })
  );

  // add_anomaly_block
  server.tool(
    'add_anomaly_block',
    '[WRITE] Add an anomaly block to a story: a series over time with the unusual readings marked out. The rule that flagged them is named to the reader, so always give the methodology.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      title: z.string().optional(),
      subtitle: z.string().optional(),
      caption: z.string().optional(),
      points: z
        .array(
          z.object({
            x: z.string().min(1).describe('The label or date of the reading'),
            y: z.number(),
          })
        )
        .min(3)
        .describe('The readings, in order'),
      method: z.enum(['zscore', 'mad', 'iqr', 'percentile']).optional(),
      threshold: z.number().positive().optional(),
      window: z.number().int().min(3).max(200).optional(),
      direction: z.enum(['both', 'up', 'down']).optional(),
      unit: z.string().optional(),
      sourceAttribution: z.string().optional(),
      methodology: z.string().max(4000).optional(),
    },
    async ({ storyId, ...data }) =>
      helperAdd(storyId, {
        id: generateId('blk_anomaly'),
        blockType: 'anomaly',
        sortOrder: 0,
        data,
      })
  );

  // add_survey_results_block
  server.tool(
    'add_survey_results_block',
    '[WRITE] Add survey or poll results to a story, with the breakdown by subgroup, the sample size and the margin of error. Always give the sample size and the fieldwork dates.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      title: z.string().optional(),
      subtitle: z.string().optional(),
      caption: z.string().optional(),
      question: z.string().min(1).describe('The question the respondents were asked'),
      style: z
        .enum(['bars', 'stack', 'waffle', 'donut'])
        .optional()
        .describe(
          'How the answers are drawn: as bars, as one split bar, as a hundred squares, or as a ring'
        ),
      responses: z
        .array(
          z.object({
            option: z.string().min(1),
            count: z.number().int().nonnegative(),
            color: z.string().optional(),
          })
        )
        .min(1)
        .describe('The answers, and how many gave each'),
      segments: z
        .array(
          z.object({
            label: z.string().min(1),
            responses: z
              .array(
                z.object({
                  option: z.string().min(1),
                  count: z.number().int().nonnegative(),
                  color: z.string().optional(),
                })
              )
              .min(1),
          })
        )
        .optional()
        .describe('The same question, split by a subgroup'),
      totalRespondents: z.number().int().nonnegative().optional(),
      marginOfError: z.number().nonnegative().max(100).optional(),
      fieldDates: z.string().optional(),
      sourceAttribution: z.string().optional(),
      methodology: z.string().max(4000).optional(),
    },
    async ({ storyId, ...data }) =>
      helperAdd(storyId, {
        id: generateId('blk_survey'),
        blockType: 'survey_results',
        sortOrder: 0,
        data,
      })
  );

  // add_scrolly_block
  server.tool(
    'add_scrolly_block',
    '[WRITE] Add a scroll-driven narrative to a story: a picture that stays put while the reader moves through each step. Each step shows one visual — a chart, an image, a figure or a paragraph of text.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      title: z.string().optional(),
      steps: z
        .array(
          z.object({
            id: z.string().min(1).describe('Stable id for the step'),
            heading: z.string().optional(),
            body: z.string().optional(),
            visual: z
              .discriminatedUnion('kind', [
                z.object({
                  kind: z.literal('chart'),
                  chart: z
                    .object({
                      chartType: z.string().min(1),
                      title: z.string().min(1),
                      xAxis: z.object({ key: z.string().min(1), label: z.string().min(1) }),
                      yAxis: z.object({ label: z.string().min(1) }),
                      series: z
                        .array(z.object({ name: z.string().min(1), key: z.string().min(1) }))
                        .min(1),
                      values: z.array(z.record(z.unknown())).min(1),
                    })
                    .describe('A complete chart payload'),
                }),
                z.object({
                  kind: z.literal('image'),
                  url: z.string().url(),
                  alt: z.string().min(1),
                  caption: z.string().optional(),
                }),
                z.object({
                  kind: z.literal('stat'),
                  value: z.string().min(1),
                  label: z.string().min(1),
                  delta: z.string().optional(),
                }),
                z.object({
                  kind: z.literal('text'),
                  text: z.string().max(5000),
                }),
              ])
              .describe('The picture this step shows'),
          })
        )
        .min(1)
        .describe('The steps of the narrative, in the order the reader meets them'),
      layout: z
        .enum(['sticky', 'stacked'])
        .optional()
        .describe(
          'Sticky keeps the picture in place while the steps go past it; stacked gives every step its own'
        ),
      showProgress: z.boolean().optional(),
      caption: z.string().optional(),
      sourceAttribution: z.string().optional(),
      methodology: z.string().max(4000).optional(),
    },
    async ({ storyId, ...data }) =>
      helperAdd(storyId, {
        id: generateId('blk_scrolly'),
        blockType: 'scrolly',
        sortOrder: 0,
        data,
      })
  );

  // add_motion_chart_block
  server.tool(
    'add_motion_chart_block',
    '[WRITE] Add an animated chart to a story: the ordinary chart, drawn and then animated. Readers whose system asks for reduced motion are shown the finished chart instead.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      title: z.string().optional(),
      subtitle: z.string().optional(),
      caption: z.string().optional(),
      chart: z
        .object({
          chartType: z.string().min(1),
          title: z.string().min(1),
          xAxis: z.object({ key: z.string().min(1), label: z.string().min(1) }),
          yAxis: z.object({ label: z.string().min(1) }),
          series: z.array(z.object({ name: z.string().min(1), key: z.string().min(1) })).min(1),
          values: z.array(z.record(z.unknown())).min(1),
        })
        .describe('The chart that is drawn, and then animated'),
      animation: z.enum(['grow', 'draw', 'sweep', 'count', 'fade']).optional(),
      durationMs: z.number().int().min(100).max(20000).optional(),
      staggerMs: z.number().int().min(0).max(2000).optional(),
      loop: z.boolean().optional(),
      respectReducedMotion: z.boolean().optional(),
      sourceAttribution: z.string().optional(),
    },
    async ({ storyId, ...data }) =>
      helperAdd(storyId, {
        id: generateId('blk_motion'),
        blockType: 'motion_chart',
        sortOrder: 0,
        data,
      })
  );

  // add_sandbox_block
  server.tool(
    'add_sandbox_block',
    '[WRITE] Add a custom visual to a story: HTML, CSS and JavaScript run in a sandboxed frame that cannot read the page. The block’s own data is handed to the frame on window.__blockData. Only use this for visuals the newsroom has written itself.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      title: z.string().optional(),
      html: z.string().max(200000).describe('The markup and styles the frame is given'),
      script: z.string().max(200000).optional().describe('The script the frame runs'),
      data: z.record(z.unknown()).optional().describe('The data handed to the frame'),
      height: z.number().int().min(80).max(2000).optional(),
      allowScripts: z.boolean().optional(),
      caption: z.string().optional(),
      accessibilityText: z
        .string()
        .max(5000)
        .optional()
        .describe('The block in words, for anyone who cannot see what it drew'),
      sourceAttribution: z.string().optional(),
    },
    async ({ storyId, ...data }) =>
      helperAdd(storyId, {
        id: generateId('blk_sandbox'),
        blockType: 'sandbox',
        sortOrder: 0,
        data,
      })
  );

  // add_scene_3d_block
  server.tool(
    'add_scene_3d_block',
    '[WRITE] Add a three-dimensional scene to a story: a globe, a point cloud, a set of columns or a model, drawn in WebGL and explorable with a pointer. Always give the alt text and a poster image, which is what phones are shown.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      title: z.string().optional(),
      subtitle: z.string().optional(),
      caption: z.string().optional(),
      scene: z.enum(['globe', 'points', 'bars', 'model']).optional(),
      points: z
        .array(
          z.object({
            lat: z.number().min(-90).max(90),
            lon: z.number().min(-180).max(180),
            value: z.number().optional(),
            label: z.string().optional(),
            color: z.string().optional(),
          })
        )
        .optional()
        .describe('The places marked on the globe, or the points of the cloud'),
      bars: z
        .array(
          z.object({ label: z.string().min(1), value: z.number(), color: z.string().optional() })
        )
        .optional()
        .describe('The columns of the chart'),
      modelUrl: z.string().url().optional().describe('The model to show, as a .glb file'),
      autoRotate: z.boolean().optional(),
      cameraDistance: z.number().min(0.5).max(200).optional(),
      height: z.number().int().min(120).max(1200).optional(),
      background: z.string().optional(),
      posterUrl: z
        .string()
        .url()
        .optional()
        .describe('The picture shown where the scene cannot be drawn'),
      alt: z.string().max(1000).optional().describe('The scene in words'),
      sourceAttribution: z.string().optional(),
      methodology: z.string().max(4000).optional(),
    },
    async ({ storyId, ...data }) =>
      helperAdd(storyId, {
        id: generateId('blk_scene3d'),
        blockType: 'scene_3d',
        sortOrder: 0,
        data,
      })
  );
}
