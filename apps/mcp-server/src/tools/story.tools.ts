import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabaseService } from '@ai-news/database';
import { StoryService } from '@ai-news/stories';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import {
  ArticleTypeSchema,
  StoryBlockSchema,
} from '@ai-news/schemas';
import { mcpJsonResponse } from './tool-helpers';

export function registerStoryTools(
  server: McpServer,
  db: DatabaseService,
  getPrincipal: () => AuthenticatedPrincipal
) {
  const storyService = new StoryService(db);

  server.tool(
    'get_story',
    '[READ-ONLY] Retrieve complete structured details of a story by ID, including its current blocks, topics, entities, and sources.',
    {
      storyId: z.string().min(1).describe('The unique ID of the story (e.g. "sty_123")'),
    },
    async ({ storyId }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      const story = await storyService.getStory(storyId, principal.organizationId);
      return mcpJsonResponse(story);
    }
  );

  server.tool(
    'get_story_version',
    '[READ-ONLY] Retrieve a specific immutable historical revision of a story by version number.',
    {
      storyId: z.string().min(1).describe('Story ID'),
      versionNumber: z.number().int().positive().describe('Version sequence number (e.g. 1, 2)'),
    },
    async ({ storyId, versionNumber }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      const version = await storyService.getStoryVersion(storyId, versionNumber, principal.organizationId);
      return mcpJsonResponse(version);
    }
  );

  server.tool(
    'get_story_versions',
    '[READ-ONLY] List all historical versions of a story with changelog summaries, authors, and timestamps.',
    {
      storyId: z.string().min(1).describe('Story ID'),
    },
    async ({ storyId }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      const versions = await storyService.getStoryVersions(storyId, principal.organizationId);
      return mcpJsonResponse(versions);
    }
  );

  server.tool(
    'create_story',
    '[WRITE] Create a new draft story. Initializes Version 1 snapshot. Supports idempotencyKey to prevent duplicate creation on agent retries.',
    {
      title: z.string().min(1).max(300).describe('Story headline'),
      summary: z.string().min(1).max(2000).describe('Editorial executive summary'),
      articleType: ArticleTypeSchema.default('developing_story').describe('Story genre or format'),
      eventId: z.string().optional().describe('Associated real-world Event ID if applicable'),
      topicIds: z.array(z.string()).optional().default([]).describe('List of topic IDs'),
      entityIds: z.array(z.string()).optional().default([]).describe('List of entity IDs'),
      sourceIds: z.array(z.string()).optional().default([]).describe('List of source IDs cited'),
      blocks: z.array(StoryBlockSchema).optional().default([]).describe('Initial structured blocks'),
      heroImageUrl: z.string().url().optional().describe('URL for hero image'),
      idempotencyKey: z.string().optional().describe('Unique key from client to prevent duplicate execution'),
    },
    async (params) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:write');

      const story = await storyService.createStory(params, {
        organizationId: principal.organizationId,
        authorId: principal.id,
        clientType: principal.clientType,
        createdVia: 'mcp',
      });

      return mcpJsonResponse({
        message: 'Story created successfully as draft (Version 1).',
        storyId: story.id,
        slug: story.slug,
        status: story.status,
        version: story.currentVersionNumber,
      });
    }
  );

  server.tool(
    'update_story',
    '[WRITE] Update story metadata such as headline, summary, topic associations, or hero image.',
    {
      storyId: z.string().min(1).describe('Story ID to update'),
      title: z.string().min(1).max(300).optional(),
      summary: z.string().min(1).max(2000).optional(),
      articleType: ArticleTypeSchema.optional(),
      eventId: z.string().optional(),
      topicIds: z.array(z.string()).optional(),
      entityIds: z.array(z.string()).optional(),
      heroImageUrl: z.string().url().optional(),
    },
    async ({ storyId, ...input }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:write');

      const updated = await storyService.updateStory(storyId, input, {
        organizationId: principal.organizationId,
        authorId: principal.id,
        clientType: principal.clientType,
        createdVia: 'mcp',
      });

      return mcpJsonResponse({
        message: 'Story metadata updated.',
        storyId: updated.id,
        updatedAt: updated.updatedAt,
      });
    }
  );

  server.tool(
    'create_story_version',
    '[WRITE] Commit a new immutable version snapshot for an existing story. Automatically diffs blocks and generates a WhatChangedBlock if not provided.',
    {
      storyId: z.string().min(1).describe('Story ID to snapshot'),
      changeSummary: z.string().min(1).describe('Editorial explanation of what changed in this version'),
      title: z.string().optional().describe('Updated headline if modified'),
      summary: z.string().optional().describe('Updated summary if modified'),
      blocks: z.array(StoryBlockSchema).optional().describe('Full updated array of structured blocks'),
      idempotencyKey: z.string().optional().describe('Idempotency key'),
    },
    async ({ storyId, ...input }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:write');

      const version = await storyService.createStoryVersion(storyId, input, {
        organizationId: principal.organizationId,
        authorId: principal.id,
        clientType: principal.clientType,
        createdVia: 'mcp',
      });

      return mcpJsonResponse({
        message: `Story updated to Version ${version.versionNumber}.`,
        storyId,
        versionNumber: version.versionNumber,
        changeSummary: version.changeSummary,
      });
    }
  );

  server.tool(
    'publish_story',
    '[HIGH-IMPACT WRITE] Publish a draft or revised story to live feeds and public readers. Requires news:publish scope and client approval policy.',
    {
      storyId: z.string().min(1).describe('Story ID to publish'),
      idempotencyKey: z.string().optional().describe('Idempotency key'),
    },
    async ({ storyId, idempotencyKey }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:publish');

      const published = await storyService.publishStory(
        storyId,
        {
          organizationId: principal.organizationId,
          authorId: principal.id,
          clientType: principal.clientType,
          createdVia: 'mcp',
        },
        idempotencyKey
      );

      return mcpJsonResponse({
        message: `Story "${published.title}" is now PUBLISHED.`,
        storyId: published.id,
        slug: published.slug,
        status: published.status,
        publishedAt: published.publishedAt,
        version: published.currentVersionNumber,
      });
    }
  );

  server.tool(
    'unpublish_story',
    '[HIGH-IMPACT WRITE] Revert a published story back to DRAFT status. Requires news:publish scope.',
    {
      storyId: z.string().min(1).describe('Story ID to unpublish'),
    },
    async ({ storyId }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:publish');

      const story = await storyService.unpublishStory(storyId, {
        organizationId: principal.organizationId,
        authorId: principal.id,
        clientType: principal.clientType,
        createdVia: 'mcp',
      });

      return mcpJsonResponse({ message: 'Story unpublished to DRAFT.', storyId: story.id, status: story.status });
    }
  );

  server.tool(
    'archive_story',
    '[HIGH-IMPACT WRITE] Archive a superseded or retired story. Requires news:publish scope.',
    {
      storyId: z.string().min(1).describe('Story ID to archive'),
    },
    async ({ storyId }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:publish');

      const story = await storyService.archiveStory(storyId, {
        organizationId: principal.organizationId,
        authorId: principal.id,
        clientType: principal.clientType,
        createdVia: 'mcp',
      });

      return mcpJsonResponse({ message: 'Story ARCHIVED.', storyId: story.id, status: story.status });
    }
  );

  server.tool(
    'delete_story',
    '[HIGH-IMPACT WRITE] Permanently remove a story and its blocks. Sensitive administrative action.',
    {
      storyId: z.string().min(1).describe('Story ID to permanently delete'),
    },
    async ({ storyId }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:admin');

      const deleted = await db.stories.delete(storyId, principal.organizationId);
      return mcpJsonResponse({ message: deleted ? 'Story deleted.' : 'Story not found.', success: deleted });
    }
  );
}
