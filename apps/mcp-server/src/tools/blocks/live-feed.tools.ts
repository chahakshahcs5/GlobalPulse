import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { LiveFeedService } from '@ai-news/stories';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { generateId } from '@ai-news/shared';
import { mcpJsonResponse, mcpErrorResponse } from '../tool-helpers';
import type { AddBlockHelper } from './block-tool-helpers';

/**
 * Live feeds and live blocks.
 *
 * A `live_data` block carries the values it was published with. Binding it to
 * a live feed key lets the platform push fresher numbers to readers over the
 * realtime channel, without the story being republished.
 */
export function registerLiveFeedTools(
  server: McpServer,
  liveFeedService: LiveFeedService,
  getPrincipal: () => AuthenticatedPrincipal,
  helperAdd: AddBlockHelper
) {
  const liveItemShape = {
    id: z.string().min(1).describe('Stable identifier for the value (e.g. "brent", "btc_usd")'),
    label: z.string().min(1).describe('Readable label (e.g. "Brent Crude")'),
    value: z.union([z.number(), z.string()]).describe('Current value'),
    previousValue: z
      .union([z.number(), z.string()])
      .optional()
      .describe('Previous value, used to derive the percentage change'),
    change: z.number().optional().describe('Percentage change against previousValue'),
    unit: z.string().optional().describe('Unit or currency (e.g. "$", "pts", "%")'),
    provider: z.string().optional().describe('Data provider'),
    asOf: z.string().optional().describe('ISO timestamp of the reading'),
    sparkline: z
      .array(z.number())
      .optional()
      .describe('Recent samples (0-1 or raw values) used to draw a sparkline'),
  };

  server.tool(
    'add_live_data_block',
    '[WRITE] Add a live data block. Bind it to a live feed key so readers receive fresher values over the realtime channel instead of the published snapshot.',
    {
      storyId: z.string().min(1).describe('Target story ID'),
      title: z.string().optional().describe('Heading for the block'),
      refreshIntervalSeconds: z.number().int().min(5).max(3600).default(60),
      liveKey: z
        .string()
        .min(1)
        .optional()
        .describe(
          'Live feed key to bind to (see set_live_feed). Omit to render a static snapshot.'
        ),
      items: z
        .array(z.object(liveItemShape))
        .min(1)
        .describe('Fallback values shown until the live feed delivers data'),
      sourceAttribution: z.string().optional(),
    },
    async ({ storyId, ...data }) =>
      helperAdd(storyId, {
        id: generateId('blk_live'),
        blockType: 'live_data',
        sortOrder: 0,
        data,
      })
  );

  server.tool(
    'set_live_feed',
    '[WRITE] Create or replace a live feed. Every reader of a block bound to this key receives the new values immediately over the realtime channel.',
    {
      key: z.string().min(1).describe('Stable feed key (e.g. "markets", "energy_grid")'),
      title: z.string().min(1).optional().describe('Human-readable feed title'),
      provider: z.string().optional().describe('Upstream data provider'),
      items: z.array(z.object(liveItemShape)).min(1).describe('Current values'),
      refreshIntervalSeconds: z.number().int().min(5).max(3600).optional(),
      license: z.string().optional().describe('License or usage terms of the underlying data'),
      methodology: z.string().optional().describe('How the values are produced'),
      sourceAttribution: z.string().optional().describe('Attribution shown to readers'),
    },
    async ({ key, ...update }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:write');

        const feed = await liveFeedService.setFeed(key, update, {
          organizationId: principal.organizationId,
        });

        return mcpJsonResponse({
          message: `Live feed "${key}" published.`,
          feed,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to publish live feed: ${msg}`);
      }
    }
  );

  server.tool(
    'get_live_feed',
    '[READ-ONLY] Retrieve the current values of a live feed.',
    {
      key: z.string().min(1).describe('Feed key'),
    },
    async ({ key }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const feed = await liveFeedService.getFeed(key);
        if (!feed) {
          return mcpErrorResponse(`No live feed registered for key "${key}".`);
        }
        return mcpJsonResponse({ feed });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to read live feed: ${msg}`);
      }
    }
  );

  server.tool(
    'list_live_feeds',
    '[READ-ONLY] List every registered live feed with its current values.',
    {},
    async () => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const feeds = await liveFeedService.listFeeds({
          organizationId: principal.organizationId,
        });
        return mcpJsonResponse({ count: feeds.length, feeds });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to list live feeds: ${msg}`);
      }
    }
  );
}
