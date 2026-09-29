import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabaseService } from '@ai-news/database';
import { StoryService } from '@ai-news/stories';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { StoryBlockSchema } from '@ai-news/schemas';
import { generateId } from '@ai-news/shared';
import { mcpJsonResponse } from './tool-helpers';

export function registerBlockTools(
  server: McpServer,
  db: DatabaseService,
  getPrincipal: () => AuthenticatedPrincipal
) {
  const storyService = new StoryService(db);

  const helperAdd = async (storyId: string, block: Parameters<StoryService['addBlock']>[1]) => {
    const principal = getPrincipal();
    AuthService.requireScope(principal, 'news:write');

    const added = await storyService.addBlock(storyId, block, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'mcp',
    });

    return mcpJsonResponse({
      message: `Block of type "${added.blockType}" added to story.`,
      blockId: added.id,
      sortOrder: added.sortOrder,
    });
  };

  // 1. Generic add_story_block
  server.tool(
    'add_story_block',
    '[WRITE] Add any structured block payload to a story adhering to the StoryBlock schema.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      block: StoryBlockSchema.describe('Structured block object'),
    },
    async ({ storyId, block }) => helperAdd(storyId, block)
  );

  // 2. add_text_block (§38)
  server.tool(
    'add_text_block',
    '[WRITE] Add an editorial prose paragraph block formatted in Markdown or plain text.',
    {
      storyId: z.string().min(1),
      text: z.string().min(1).describe('Paragraph text content (Markdown supported)'),
      format: z.enum(['markdown', 'plain']).default('markdown'),
    },
    async ({ storyId, text, format }) =>
      helperAdd(storyId, {
        id: generateId('blk_p'),
        blockType: 'paragraph',
        sortOrder: 0,
        data: { text, format },
      })
  );

  // 3. add_heading_block (§38)
  server.tool(
    'add_heading_block',
    '[WRITE] Add a section header with optional subtext to structure story hierarchy.',
    {
      storyId: z.string().min(1),
      text: z.string().min(1).describe('Heading text'),
      level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).default(2),
      subtext: z.string().optional(),
    },
    async ({ storyId, text, level, subtext }) =>
      helperAdd(storyId, {
        id: generateId('blk_h'),
        blockType: 'heading',
        sortOrder: 0,
        data: { text, level, subtext },
      })
  );

  // 4. add_summary_block (§38)
  server.tool(
    'add_summary_block',
    '[WRITE] Add an executive briefing callout with bullet points and optional sentiment.',
    {
      storyId: z.string().min(1),
      headline: z.string().min(1),
      bulletPoints: z.array(z.string()).min(1),
      sentiment: z.enum(['neutral', 'positive', 'cautious', 'critical']).optional(),
    },
    async ({ storyId, headline, bulletPoints, sentiment }) =>
      helperAdd(storyId, {
        id: generateId('blk_sum'),
        blockType: 'summary',
        sortOrder: 0,
        data: { headline, bulletPoints, sentiment },
      })
  );

  // 5. add_quote_block (§38)
  server.tool(
    'add_quote_block',
    '[WRITE] Add an attributed pull quote or official statement.',
    {
      storyId: z.string().min(1),
      quote: z.string().min(1),
      attribution: z.string().min(1),
      title: z.string().optional(),
      avatarUrl: z.string().url().optional(),
      sourceUrl: z.string().url().optional(),
    },
    async ({ storyId, quote, attribution, title, avatarUrl, sourceUrl }) =>
      helperAdd(storyId, {
        id: generateId('blk_q'),
        blockType: 'quote',
        sortOrder: 0,
        data: { quote, attribution, title, avatarUrl, sourceUrl },
      })
  );

  // 6. add_image_block (§38)
  server.tool(
    'add_image_block',
    '[WRITE] Add an image with caption, credit, and responsive aspect ratio.',
    {
      storyId: z.string().min(1),
      url: z.string().url(),
      altText: z.string().min(1),
      caption: z.string().optional(),
      aspectRatio: z.enum(['16:9', '4:3', '1:1', '9:16', '21:9']).default('16:9'),
      credit: z.string().optional(),
    },
    async ({ storyId, url, altText, caption, aspectRatio, credit }) =>
      helperAdd(storyId, {
        id: generateId('blk_img'),
        blockType: 'image',
        sortOrder: 0,
        data: { url, altText, caption, aspectRatio, credit },
      })
  );

  // 7. add_gallery_block (§38)
  server.tool(
    'add_gallery_block',
    '[WRITE] Add a multi-image carousel or photo gallery.',
    {
      storyId: z.string().min(1),
      title: z.string().optional(),
      images: z
        .array(
          z.object({
            url: z.string().url(),
            altText: z.string().min(1),
            caption: z.string().optional(),
            credit: z.string().optional(),
          })
        )
        .min(2),
    },
    async ({ storyId, title, images }) =>
      helperAdd(storyId, {
        id: generateId('blk_gal'),
        blockType: 'gallery',
        sortOrder: 0,
        data: { title, images },
      })
  );

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

  // 12. add_video_block (§38)
  server.tool(
    'add_video_block',
    '[WRITE] Add a streaming video player block with aspect ratio and optional captions.',
    {
      storyId: z.string().min(1),
      url: z.string().url(),
      caption: z.string().optional(),
      posterUrl: z.string().url().optional(),
      aspectRatio: z.enum(['16:9', '9:16', '1:1']).default('16:9'),
      durationSeconds: z.number().positive().optional(),
    },
    async ({ storyId, ...videoData }) =>
      helperAdd(storyId, {
        id: generateId('blk_vid'),
        blockType: 'video',
        sortOrder: 0,
        data: videoData,
      })
  );

  // 13. add_audio_block (§38)
  server.tool(
    'add_audio_block',
    '[WRITE] Add a narrated audio briefing or podcast segment block with optional synchronized cue points.',
    {
      storyId: z.string().min(1),
      url: z.string().url(),
      title: z.string().min(1),
      narrator: z.string().optional(),
      durationSeconds: z.number().positive().optional(),
      transcript: z.string().optional(),
      language: z.string().default('en'),
      cuePoints: z
        .array(
          z.object({
            timeMs: z.number().nonnegative().describe('Offset in milliseconds'),
            text: z.string().min(1).describe('Spoken sentence or phrase'),
            blockRefId: z.string().optional().describe('Referenced paragraph or block ID'),
          })
        )
        .optional()
        .describe('Synchronized read-along cue points for karaoke audio playback'),
    },
    async ({ storyId, ...audioData }) =>
      helperAdd(storyId, {
        id: generateId('blk_aud'),
        blockType: 'audio',
        sortOrder: 0,
        data: audioData,
      })
  );

  // 14. add_slide_deck_block (§38)
  server.tool(
    'add_slide_deck_block',
    '[WRITE] Add an interactive slide deck presentation block.',
    {
      storyId: z.string().min(1),
      title: z.string().min(1),
      slides: z
        .array(
          z.object({
            slideNumber: z.number().int(),
            title: z.string().min(1),
            bullets: z.array(z.string()).optional(),
            body: z.string().optional(),
            imageUrl: z.string().url().optional(),
          })
        )
        .min(2),
    },
    async ({ storyId, title, slides }) =>
      helperAdd(storyId, {
        id: generateId('blk_slide'),
        blockType: 'slide_deck',
        sortOrder: 0,
        data: { title, slides },
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

  // 18. add_callout_block (§38)
  server.tool(
    'add_callout_block',
    '[WRITE] Add an emphasis box with style (info, warning, tip, critical).',
    {
      storyId: z.string().min(1),
      text: z.string().min(1),
      style: z.enum(['info', 'warning', 'tip', 'critical']).default('info'),
      title: z.string().optional(),
    },
    async ({ storyId, text, style, title }) =>
      helperAdd(storyId, {
        id: generateId('blk_call'),
        blockType: 'callout',
        sortOrder: 0,
        data: { text, style, title },
      })
  );

  // 19. add_citation_block (§38)
  server.tool(
    'add_citation_block',
    '[WRITE] Add a verified claim citation block tied to registered sources.',
    {
      storyId: z.string().min(1),
      claim: z.string().min(1),
      sourceIds: z.array(z.string()).min(1),
      quoteExcerpt: z.string().optional(),
    },
    async ({ storyId, claim, sourceIds, quoteExcerpt }) =>
      helperAdd(storyId, {
        id: generateId('blk_cite'),
        blockType: 'citation',
        sortOrder: 0,
        data: { claim, sourceIds, quoteExcerpt },
      })
  );

  // 20. add_source_block (§38)
  server.tool(
    'add_source_block',
    '[WRITE] Add an inline source card attribution block.',
    {
      storyId: z.string().min(1),
      sourceId: z.string().min(1),
      title: z.string().min(1),
      publisher: z.string().min(1),
      url: z.string().url(),
      publishedAt: z.string().optional(),
    },
    async ({ storyId, ...sourceData }) =>
      helperAdd(storyId, {
        id: generateId('blk_src'),
        blockType: 'source',
        sortOrder: 0,
        data: sourceData,
      })
  );

  // 21. add_related_stories_block (§38)
  server.tool(
    'add_related_stories_block',
    '[WRITE] Add a cross-reference block linking to related stories.',
    {
      storyId: z.string().min(1),
      storyIds: z.array(z.string()).min(1),
      title: z.string().default('Related Stories'),
    },
    async ({ storyId, storyIds, title }) =>
      helperAdd(storyId, {
        id: generateId('blk_rel'),
        blockType: 'related_stories',
        sortOrder: 0,
        data: { title, storyIds },
      })
  );

  // 22. update_story_block
  server.tool(
    'update_story_block',
    '[WRITE] Update an existing block inside a story.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      blockId: z.string().min(1).describe('Block ID to update'),
      block: StoryBlockSchema.describe('Updated structured block payload'),
    },
    async ({ storyId, blockId, block }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:write');

      const updated = await storyService.updateBlock(storyId, blockId, block, {
        organizationId: principal.organizationId,
        authorId: principal.id,
        clientType: principal.clientType,
        createdVia: 'mcp',
      });

      return mcpJsonResponse({ message: `Block "${blockId}" updated.`, block: updated });
    }
  );

  // 23. remove_story_block
  server.tool(
    'remove_story_block',
    '[WRITE] Remove a block from a story and re-index remaining blocks.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      blockId: z.string().min(1).describe('Block ID to delete'),
    },
    async ({ storyId, blockId }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:write');

      const removed = await storyService.removeBlock(storyId, blockId, {
        organizationId: principal.organizationId,
        authorId: principal.id,
        clientType: principal.clientType,
        createdVia: 'mcp',
      });

      return mcpJsonResponse({
        message: removed ? 'Block removed.' : 'Block not found.',
        success: removed,
      });
    }
  );

  // 24. reorder_story_blocks
  server.tool(
    'reorder_story_blocks',
    '[WRITE] Reorder the visual sequence of blocks in a story by supplying the ordered list of block IDs.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      blockIdsInOrder: z.array(z.string()).min(1).describe('Ordered array of block IDs'),
    },
    async ({ storyId, blockIdsInOrder }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:write');

      const blocks = await storyService.reorderBlocks(storyId, blockIdsInOrder, {
        organizationId: principal.organizationId,
        authorId: principal.id,
        clientType: principal.clientType,
        createdVia: 'mcp',
      });

      return mcpJsonResponse({ message: 'Blocks reordered successfully.', count: blocks.length });
    }
  );

  // 25. add_image_diff_block
  server.tool(
    'add_image_diff_block',
    '[WRITE] Add an interactive before/after visual difference slider comparing two images (e.g. satellite imagery, urban change).',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      beforeUrl: z.string().url().describe('URL of before image'),
      afterUrl: z.string().url().describe('URL of after image'),
      beforeLabel: z.string().default('Before').describe('Label for before image'),
      afterLabel: z.string().default('After').describe('Label for after image'),
      caption: z.string().optional().describe('Editorial caption explaining the visual difference'),
      orientation: z.enum(['horizontal', 'vertical']).default('horizontal'),
      defaultSplitPercent: z.number().min(0).max(100).default(50),
      credit: z.string().optional().describe('Image copyright or attribution credit'),
    },
    async ({ storyId, ...diffData }) =>
      helperAdd(storyId, {
        id: generateId('blk_diff'),
        blockType: 'image_diff',
        sortOrder: 0,
        data: diffData,
      })
  );

  // 26. add_live_ticker_block
  server.tool(
    'add_live_ticker_block',
    '[WRITE] Add a live financial or numerical data ticker with metric cards, delta indicators, and sparkline arrays.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      title: z.string().optional().describe('Title of the ticker (e.g. "Live Market Pulse")'),
      refreshIntervalSeconds: z.number().int().min(5).max(3600).default(30),
      items: z
        .array(
          z.object({
            symbol: z.string().min(1).describe('Ticker symbol (e.g. "BRENT", "BTC/USD")'),
            label: z.string().min(1).describe('Readable label (e.g. "Brent Crude")'),
            value: z.number().describe('Current numeric value'),
            delta: z.number().describe('Percentage or point delta (positive or negative)'),
            unit: z.string().optional().describe('Currency or unit (e.g. "$", "pts", "%")'),
            sparkline: z
              .array(z.number())
              .optional()
              .default([])
              .describe('Historical values for sparkline chart'),
          })
        )
        .min(1)
        .describe('List of metric items to track in the ticker'),
    },
    async ({ storyId, ...tickerData }) =>
      helperAdd(storyId, {
        id: generateId('blk_tick'),
        blockType: 'live_ticker',
        sortOrder: 0,
        data: tickerData,
      })
  );

  // 27. update_live_ticker_block
  server.tool(
    'update_live_ticker_block',
    '[WRITE] Update metric values and sparklines on an existing live ticker block.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      blockId: z.string().min(1).describe('Block ID of the live ticker'),
      items: z
        .array(
          z.object({
            symbol: z.string().min(1),
            label: z.string().min(1),
            value: z.number(),
            delta: z.number(),
            unit: z.string().optional(),
            sparkline: z.array(z.number()).optional().default([]),
            lastUpdated: z.string().optional(),
          })
        )
        .min(1),
    },
    async ({ storyId, blockId, items }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:write');

      const story = await storyService.getStory(storyId, principal.organizationId);
      const existingBlock = story.blocks?.find((b) => b.id === blockId);
      if (!existingBlock || existingBlock.blockType !== 'live_ticker') {
        throw new Error(`Live ticker block "${blockId}" not found in story "${storyId}".`);
      }

      const updatedBlock = {
        ...existingBlock,
        data: {
          title: existingBlock.data.title,
          refreshIntervalSeconds: existingBlock.data.refreshIntervalSeconds,
          items: items.map((it) => ({
            ...it,
            sparkline: it.sparkline || [],
            lastUpdated: it.lastUpdated || new Date().toISOString(),
          })),
        },
      };

      const updated = await storyService.updateBlock(storyId, blockId, updatedBlock, {
        organizationId: principal.organizationId,
        authorId: principal.id,
        clientType: principal.clientType,
        createdVia: 'mcp',
      });

      return mcpJsonResponse({ message: `Live ticker "${blockId}" updated.`, block: updated });
    }
  );

  // 28. add_poll_block
  server.tool(
    'add_poll_block',
    '[WRITE] Add an interactive reader poll with selectable options to a story.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      question: z
        .string()
        .min(1)
        .describe('Poll question (e.g. "Do you agree with the trade agreement?")'),
      options: z
        .array(z.string().min(1))
        .min(2)
        .describe('List of choice strings (e.g. ["Yes, strongly", "No, oppose", "Undecided"])'),
      expiresAt: z.string().optional().describe('Optional ISO date when the poll closes'),
    },
    async ({ storyId, question, options, expiresAt }) => {
      const pollId = generateId('pol');
      return helperAdd(storyId, {
        id: generateId('blk_pol'),
        blockType: 'poll',
        sortOrder: 0,
        data: {
          pollId,
          question,
          options: options.map((text, idx) => ({
            id: `opt_${idx + 1}`,
            text,
            voteCount: 0,
          })),
          totalVotes: 0,
          expiresAt,
          closed: false,
        },
      });
    }
  );
}
