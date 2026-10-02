import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { StoryBlockSchema } from '@ai-news/schemas';
import { generateId } from '@ai-news/shared';
import type { AddBlockHelper } from './block-tool-helpers';

export function registerTextEditorialTools(server: McpServer, helperAdd: AddBlockHelper) {
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
}
