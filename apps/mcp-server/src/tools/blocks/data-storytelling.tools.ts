import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { generateId } from '@ai-news/shared';
import type { AddBlockHelper } from './block-tool-helpers';

export function registerDataStorytellingTools(server: McpServer, helperAdd: AddBlockHelper) {
  // 8. add_chart_block (§38)
  server.tool(
    'add_chart_block',
    '[WRITE] Add a programmatic D3 chart (line, bar, stacked_bar, area, scatter, donut, kpi) directly to a story.',
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
        'kpi',
        'comparison',
        'slope',
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
