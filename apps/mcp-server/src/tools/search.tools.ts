import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabaseService } from '@ai-news/database';
import { SearchService } from '@ai-news/search';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { ArticleTypeSchema, StoryStatusSchema } from '@ai-news/schemas';
import { mcpJsonResponse } from './tool-helpers';

export function registerSearchTools(
  server: McpServer,
  db: DatabaseService,
  getPrincipal: () => AuthenticatedPrincipal
) {
  const searchService = new SearchService(db);

  server.tool(
    'search_stories',
    '[READ-ONLY] Search existing published and draft stories across the platform using keyword, status, topic, or date filters. ALWAYS call this tool before creating new stories to avoid duplicate reporting.',
    {
      query: z.string().optional().describe('Keywords or event title to search for (e.g. "BRICS 2026")'),
      status: StoryStatusSchema.optional().describe('Filter by story status: DRAFT, IN_REVIEW, PUBLISHED, ARCHIVED'),
      articleType: ArticleTypeSchema.optional().describe('Filter by format (e.g. breaking_news, analysis, explainer)'),
      topicId: z.string().optional().describe('Filter by topic ID'),
      entityId: z.string().optional().describe('Filter by entity ID'),
      sourceId: z.string().optional().describe('Filter by source ID'),
      limit: z.number().int().min(1).max(50).default(10).describe('Max results to return'),
      offset: z.number().int().min(0).optional().describe('Pagination offset'),
      cursor: z.string().optional().describe('Pagination cursor'),
    },

    async (params) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:search');

      const results = await searchService.searchStories(params, principal.organizationId);
      return mcpJsonResponse(results);
    }
  );

  server.tool(
    'find_similar_stories',
    '[READ-ONLY] Evaluate similarity between candidate reporting and existing coverage to detect updates vs new events. Returns similarity scores between 0 and 1. The external AI decides whether the report constitutes a new story or an update.',
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
      return mcpJsonResponse({ matches: similar });
    }
  );

  server.tool(
    'find_similar_events',
    '[READ-ONLY] Find real-world events similar to an incoming report to assist external AI in clustering occurrences without making editorial decisions.',
    {
      title: z.string().min(1).describe('Event title or occurrence headline'),
      summary: z.string().optional().describe('Brief description of the occurrence'),
      threshold: z.number().min(0).max(1).default(0.4).describe('Similarity cutoff (0.0 to 1.0)'),
      limit: z.number().int().min(1).max(10).default(5).describe('Max event matches'),
    },
    async (params) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:search');

      const allEvents = await db.events.list(principal.organizationId, 100);
      const queryLower = params.title.toLowerCase();
      const matches = allEvents
        .map((evt) => {
          const titleLower = evt.title.toLowerCase();
          let score = 0;
          if (titleLower === queryLower) score = 1.0;
          else if (titleLower.includes(queryLower) || queryLower.includes(titleLower)) score = 0.8;
          else {
            const words = queryLower.split(/\s+/).filter((w) => w.length > 3);
            const matchedWords = words.filter((w) => titleLower.includes(w));
            score = words.length > 0 ? matchedWords.length / words.length : 0;
          }
          return {
            eventId: evt.id,
            title: evt.title,
            summary: evt.summary,
            similarity: Math.round(score * 100) / 100,
          };
        })
        .filter((m) => m.similarity >= params.threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, params.limit);

      return mcpJsonResponse({ matches });
    }
  );

  server.tool(
    'search_events',
    '[READ-ONLY] Search real-world events stored in the knowledge registry.',
    {
      query: z.string().min(1).describe('Event query terms'),
    },
    async (params) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:search');

      const events = await searchService.searchEvents(params.query, principal.organizationId);
      return mcpJsonResponse(events);
    }
  );

  server.tool(
    'search_topics',
    '[READ-ONLY] Search taxonomy topics and category tags.',
    {
      query: z.string().min(1).describe('Topic name or keyword'),
    },
    async (params) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:search');

      const topics = await searchService.searchTopics(params.query, principal.organizationId);
      return mcpJsonResponse(topics);
    }
  );

  server.tool(
    'search_entities',
    '[READ-ONLY] Search named entities (people, organizations, nations, technologies).',
    {
      query: z.string().min(1).describe('Entity name or alias'),
    },
    async (params) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:search');

      const entities = await searchService.searchEntities(params.query, principal.organizationId);
      return mcpJsonResponse(entities);
    }
  );

  server.tool(
    'search_sources',
    '[READ-ONLY] Search registered external publications, news outlets, and documentation sources.',
    {
      query: z.string().min(1).describe('Publisher name, article title, or domain'),
    },
    async (params) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:sources');

      const sources = await searchService.searchSources(params.query, principal.organizationId);
      return mcpJsonResponse(sources);
    }
  );

  server.tool(
    'get_search_suggestions',
    '[READ-ONLY] Retrieve instant autocomplete search suggestions across headlines, topics, entities, and categories.',
    {
      query: z.string().min(1).describe('Partial search query or prefix'),
      limit: z.number().int().min(1).max(20).default(8).describe('Max suggestions to return'),
    },
    async ({ query, limit }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:search');

      const suggestions = await searchService.getSuggestions(query, principal.organizationId, limit);
      return mcpJsonResponse({ query, suggestions });
    }
  );
}
