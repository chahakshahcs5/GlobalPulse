import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { StoryService } from '@ai-news/stories';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { generateId } from '@ai-news/shared';
import { mcpJsonResponse } from '../tool-helpers';
import type { AddBlockHelper } from './block-tool-helpers';

export function registerInteractiveDocumentTools(
  server: McpServer,
  storyService: StoryService,
  getPrincipal: () => AuthenticatedPrincipal,
  helperAdd: AddBlockHelper
) {
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

  // 29. add_document_viewer_block
  server.tool(
    'add_document_viewer_block',
    '[WRITE] Embed a primary source document viewer (court filings, treaties, financial disclosures, leaked memos, or whitepapers) with annotated highlight excerpts.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      documentUrl: z
        .string()
        .url()
        .describe('Direct link or hosted PDF URL of the primary document'),
      title: z.string().min(1).describe('Document title or filing heading'),
      pageCount: z.number().int().positive().describe('Total pages in the source document'),
      documentType: z
        .enum([
          'court_filing',
          'treaty',
          'financial_disclosure',
          'leak',
          'whitepaper',
          'regulatory_directive',
        ])
        .default('whitepaper')
        .describe('Class of primary source material'),
      description: z
        .string()
        .optional()
        .describe('Editorial overview of the document significance'),
      highlights: z
        .array(
          z.object({
            page: z.number().int().positive().describe('Page number of the quote'),
            excerpt: z.string().min(1).describe('Exact text excerpt from the document'),
            note: z
              .string()
              .optional()
              .describe('Editorial annotation explaining the legal/technical meaning'),
            tag: z
              .string()
              .optional()
              .describe('Section or topic tag, e.g. "Section 4.1" or "Clause 9"'),
          })
        )
        .default([])
        .describe('List of highlighted passages'),
      sourceAttribution: z.string().optional().describe('Issuing authority, court, or repository'),
    },
    async ({
      storyId,
      documentUrl,
      title,
      pageCount,
      documentType,
      description,
      highlights,
      sourceAttribution,
    }) => {
      return helperAdd(storyId, {
        id: generateId('blk_doc'),
        blockType: 'document_viewer',
        sortOrder: 0,
        data: {
          documentUrl,
          title,
          pageCount,
          documentType,
          description,
          highlights,
          sourceAttribution,
        },
      });
    }
  );
}
