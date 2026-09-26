import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabaseService } from '@ai-news/database';
import { SearchService } from '@ai-news/search';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { ArticleTypeSchema, StoryStatusSchema } from '@ai-news/schemas';

export function registerSearchTools(
  server: McpServer,
  db: DatabaseService,
  getPrincipal: () => AuthenticatedPrincipal
) {
  const searchService = new SearchService(db);

  server.tool(
    'search_stories',
    'Search existing published and draft stories across the platform using keyword, status, topic, or date filters. ALWAYS call this tool before creating new stories to avoid duplicate reporting.',
    {
      query: z.string().optional().describe('Keywords or event title to search for (e.g. "BRICS 2026")'),
      status: StoryStatusSchema.optional().describe('Filter by story status: DRAFT, IN_REVIEW, PUBLISHED, ARCHIVED'),
      articleType: ArticleTypeSchema.optional().describe('Filter by format (e.g. breaking_news, analysis, explainer)'),
      topicId: z.string().optional().describe('Filter by topic ID'),
      entityId: z.string().optional().describe('Filter by entity ID'),
      sourceId: z.string().optional().describe('Filter by source ID'),
      limit: z.number().int().min(1).max(50).default(10).describe('Max results to return'),
    },
    async (params) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:search');

      const results = await searchService.searchStories(params, principal.organizationId);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    'find_similar_stories',
    'Evaluate similarity between candidate reporting and existing coverage to detect updates vs new events. Returns similarity scores between 0 and 1. The external AI decides whether the report constitutes a new story or an update.',
    {
      title: z.string().min(1).describe('Headline or working title of the candidate story'),
      summary: z.string().optional().describe('Brief abstract of the event'),
      threshold: z.number().min(0).max(1).default(0.4).describe('Minimum similarity threshold'),
      limit: z.number().int().min(1).max(10).default(5).describe('Max candidates to return'),
    },
    async (params) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:search');

      const similar = await searchService.findSimilarStories(params, principal.organizationId);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ matches: similar }, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    'search_events',
    'Search real-world events stored in the knowledge registry.',
    {
      query: z.string().min(1).describe('Event query terms'),
    },
    async (params) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:search');

      const events = await searchService.searchEvents(params.query, principal.organizationId);
      return {
        content: [{ type: 'text', text: JSON.stringify(events, null, 2) }],
      };
    }
  );

  server.tool(
    'search_topics',
    'Search taxonomy topics and category tags.',
    {
      query: z.string().min(1).describe('Topic name or keyword'),
    },
    async (params) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:search');

      const topics = await searchService.searchTopics(params.query, principal.organizationId);
      return {
        content: [{ type: 'text', text: JSON.stringify(topics, null, 2) }],
      };
    }
  );

  server.tool(
    'search_entities',
    'Search named entities (people, organizations, nations, technologies).',
    {
      query: z.string().min(1).describe('Entity name or alias'),
    },
    async (params) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:search');

      const entities = await searchService.searchEntities(params.query, principal.organizationId);
      return {
        content: [{ type: 'text', text: JSON.stringify(entities, null, 2) }],
      };
    }
  );

  server.tool(
    'search_sources',
    'Search registered external publications, news outlets, and documentation sources.',
    {
      query: z.string().min(1).describe('Publisher name, article title, or domain'),
    },
    async (params) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:sources');

      const sources = await searchService.searchSources(params.query, principal.organizationId);
      return {
        content: [{ type: 'text', text: JSON.stringify(sources, null, 2) }],
      };
    }
  );
}
