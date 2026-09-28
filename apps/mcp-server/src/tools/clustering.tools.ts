import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabaseService } from '@ai-news/database';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { ClusteringService } from '@ai-news/stories';
import { mcpJsonResponse, mcpErrorResponse } from './tool-helpers';

export function registerClusteringTools(
  server: McpServer,
  db: DatabaseService,
  getPrincipal: () => AuthenticatedPrincipal
) {
  const clusteringService = new ClusteringService(db);

  server.tool(
    'get_full_coverage',
    '[READ-ONLY] Retrieve Google News style "Full Coverage" for a story, including multi-source editorial perspectives and a chronological timeline.',
    {
      storyId: z
        .string()
        .min(1)
        .describe('The story ID or identifier to retrieve full coverage for'),
    },
    async ({ storyId }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const result = await clusteringService.getFullCoverage(storyId, principal.organizationId);
        return mcpJsonResponse({
          clusterId: result.clusterId,
          storyId: result.storyId,
          title: result.title,
          summary: result.summary,
          leadStoryHeadline: result.leadStory.title,
          perspectivesCount: result.perspectives.length,
          perspectives: result.perspectives,
          timelineCount: result.timeline.length,
          timeline: result.timeline,
          relatedStoriesCount: result.relatedStories.length,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to retrieve full coverage: ${msg}`);
      }
    }
  );

  server.tool(
    'list_story_clusters',
    '[READ-ONLY] List active multi-source story clusters in the organization.',
    {
      limit: z
        .number()
        .int()
        .positive()
        .max(100)
        .default(20)
        .optional()
        .describe('Maximum clusters to return'),
    },
    async ({ limit }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:read');

        const clusters = await clusteringService.listClusters(
          principal.organizationId,
          limit || 20
        );
        return mcpJsonResponse({
          total: clusters.length,
          clusters,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to list story clusters: ${msg}`);
      }
    }
  );

  server.tool(
    'create_story_cluster',
    'Create an explicit multi-source story cluster grouping related stories covering the same event.',
    {
      title: z.string().min(1).describe('Cluster title or event headline'),
      summary: z.string().optional().describe('Brief summary of the clustered event'),
      leadStoryId: z.string().min(1).describe('ID of the primary lead story in the cluster'),
      storyIds: z
        .array(z.string())
        .default([])
        .describe('Additional related story IDs to associate'),
      topic: z.string().optional().describe('Primary topic tag'),
      category: z.string().optional().describe('Primary canonical category'),
    },
    async ({ title, summary, leadStoryId, storyIds, topic, category }) => {
      try {
        const principal = getPrincipal();
        AuthService.requireScope(principal, 'news:write');

        const cluster = await clusteringService.createCluster(
          {
            title,
            summary,
            leadStoryId,
            storyIds,
            topic,
            category,
          },
          principal.organizationId
        );

        return mcpJsonResponse({
          success: true,
          cluster,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return mcpErrorResponse(`Failed to create story cluster: ${msg}`);
      }
    }
  );
}
