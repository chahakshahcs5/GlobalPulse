import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabaseService } from '@ai-news/database';
import { TopicService, specialDeskService } from '@ai-news/topics';
import { EventService } from '@ai-news/events';
import { EntityService } from '@ai-news/entities';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import {
  EntityTypeSchema,
  EventStatusSchema,
  CANONICAL_CATEGORIES,
  CategoryCodeSchema,
  CreateSpecialDeskInputSchema,
} from '@ai-news/schemas';
import { mcpJsonResponse } from './tool-helpers';

export function registerTaxonomyTools(
  server: McpServer,
  db: DatabaseService,
  getPrincipal: () => AuthenticatedPrincipal
) {
  const topicService = new TopicService(db);
  const eventService = new EventService(db);
  const entityService = new EntityService(db);

  // Topics
  server.tool(
    'create_topic',
    '[WRITE] Register a new topic or beat in the taxonomy registry.',
    {
      name: z.string().min(1).describe('Topic name (e.g. "BRICS 2026", "Artificial Intelligence")'),
      description: z.string().optional(),
      aliases: z.array(z.string()).optional().default([]),
    },
    async (params) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:topics');

      const topic = await topicService.createTopic(params, principal.organizationId);
      return mcpJsonResponse({ message: 'Topic created.', topic });
    }
  );

  server.tool(
    'update_topic',
    '[WRITE] Update existing topic metadata, description, or aliases.',
    {
      topicId: z.string().min(1).describe('Topic ID to update'),
      name: z.string().optional().describe('Updated topic name'),
      description: z.string().optional().describe('Updated topic description'),
      aliases: z.array(z.string()).optional().describe('Updated aliases array'),
    },
    async ({ topicId, ...updates }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:topics');

      const existing = await topicService.getTopic(topicId, principal.organizationId);
      const updated = await db.topics.update({
        ...existing,
        name: updates.name ?? existing.name,
        description: updates.description !== undefined ? updates.description : existing.description,
        aliases: updates.aliases ?? existing.aliases,
        updatedAt: new Date().toISOString(),
      });

      return mcpJsonResponse({ message: 'Topic updated.', topic: updated });
    }
  );

  server.tool(
    'get_topic',
    '[READ-ONLY] Retrieve topic details by ID or slug.',
    {
      topicId: z.string().min(1),
    },
    async ({ topicId }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      const topic = await topicService.getTopic(topicId, principal.organizationId);
      return mcpJsonResponse(topic);
    }
  );

  server.tool(
    'link_story_to_topic',
    '[WRITE] Associate a story with a topic ID.',
    {
      storyId: z.string().min(1),
      topicId: z.string().min(1),
    },
    async ({ storyId, topicId }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:topics');

      const story = await db.stories.findById(storyId, principal.organizationId);
      if (!story) throw new Error(`Story ${storyId} not found`);
      if (!story.topicIds.includes(topicId)) {
        story.topicIds.push(topicId);
        await db.stories.update(story);
      }

      return mcpJsonResponse({ message: 'Story linked to topic.', storyId, topicId });
    }
  );

  // Events
  server.tool(
    'create_event',
    '[WRITE] Register a real-world occurrence (distinct from stories) in the event registry.',
    {
      title: z.string().min(1).describe('Event title'),
      summary: z.string().min(1).describe('Event summary'),
      status: EventStatusSchema.default('ACTIVE'),
      occurredAt: z.string().optional(),
      location: z.string().optional(),
      coordinates: z.tuple([z.number(), z.number()]).optional(),
    },
    async (params) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:write');

      const event = await eventService.createEvent(params, principal.organizationId);
      return mcpJsonResponse({ message: 'Event created.', event });
    }
  );

  server.tool(
    'update_event',
    '[WRITE] Update a real-world occurrence record in the event registry.',
    {
      eventId: z.string().min(1).describe('Event ID to update'),
      title: z.string().optional().describe('Updated event title'),
      summary: z.string().optional().describe('Updated event summary'),
      status: EventStatusSchema.optional().describe('Updated event status'),
      location: z.string().optional().describe('Updated location label'),
    },
    async ({ eventId, ...updates }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:write');

      const existing = await eventService.getEvent(eventId, principal.organizationId);
      const updated = await db.events.update({
        ...existing,
        title: updates.title ?? existing.title,
        summary: updates.summary ?? existing.summary,
        status: updates.status ?? existing.status,
        location: updates.location !== undefined ? updates.location : existing.location,
        updatedAt: new Date().toISOString(),
      });

      return mcpJsonResponse({ message: 'Event updated.', event: updated });
    }
  );

  server.tool(
    'get_event',
    '[READ-ONLY] Retrieve event details by ID.',
    {
      eventId: z.string().min(1),
    },
    async ({ eventId }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      const event = await eventService.getEvent(eventId, principal.organizationId);
      return mcpJsonResponse(event);
    }
  );

  server.tool(
    'link_story_to_event',
    '[WRITE] Associate a story with an occurrence in the real-world event registry.',
    {
      storyId: z.string().min(1),
      eventId: z.string().min(1),
    },
    async ({ storyId, eventId }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:write');

      const story = await db.stories.findById(storyId, principal.organizationId);
      if (!story) throw new Error(`Story ${storyId} not found`);
      story.eventId = eventId;
      await db.stories.update(story);

      return mcpJsonResponse({ message: 'Story linked to event.', storyId, eventId });
    }
  );

  // Entities
  server.tool(
    'create_entity',
    '[WRITE] Register a named entity (Person, Organization, Country, Location, Technology, Product, Institution).',
    {
      name: z.string().min(1).describe('Entity name'),
      type: EntityTypeSchema.describe('Entity category'),
      description: z.string().optional(),
      aliases: z.array(z.string()).optional().default([]),
    },
    async (params) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:write');

      const entity = await entityService.createEntity(params, principal.organizationId);
      return mcpJsonResponse({ message: 'Entity created.', entity });
    }
  );

  server.tool(
    'update_entity',
    '[WRITE] Update a named entity profile, description, or aliases.',
    {
      entityId: z.string().min(1).describe('Entity ID to update'),
      name: z.string().optional().describe('Updated entity name'),
      description: z.string().optional().describe('Updated entity description'),
      aliases: z.array(z.string()).optional().describe('Updated aliases array'),
      type: EntityTypeSchema.optional().describe('Updated entity category'),
    },
    async ({ entityId, ...updates }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:write');

      const existing = await entityService.getEntity(entityId, principal.organizationId);
      const updated = await db.entities.update({
        ...existing,
        name: updates.name ?? existing.name,
        description: updates.description !== undefined ? updates.description : existing.description,
        aliases: updates.aliases ?? existing.aliases,
        type: updates.type ?? existing.type,
        updatedAt: new Date().toISOString(),
      });

      return mcpJsonResponse({ message: 'Entity updated.', entity: updated });
    }
  );

  server.tool(
    'get_entity',
    '[READ-ONLY] Retrieve entity profile by ID.',
    {
      entityId: z.string().min(1),
    },
    async ({ entityId }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      const entity = await entityService.getEntity(entityId, principal.organizationId);
      return mcpJsonResponse(entity);
    }
  );

  server.tool(
    'link_story_to_entity',
    '[WRITE] Associate a story with a named entity ID.',
    {
      storyId: z.string().min(1),
      entityId: z.string().min(1),
    },
    async ({ storyId, entityId }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:write');

      const story = await db.stories.findById(storyId, principal.organizationId);
      if (!story) throw new Error(`Story ${storyId} not found`);
      if (!story.entityIds.includes(entityId)) {
        story.entityIds.push(entityId);
        await db.stories.update(story);
      }

      return mcpJsonResponse({ message: 'Story linked to entity.', storyId, entityId });
    }
  );

  // Dynamic Subcategory Registry Map
  const dynamicSubCategories = new Map<string, string[]>();
  for (const cat of CANONICAL_CATEGORIES) {
    dynamicSubCategories.set(cat.code, [...(cat.subCategories || [])]);
  }

  // Category Hierarchy
  server.tool(
    'list_category_hierarchy',
    '[READ-ONLY] Retrieve all primary news categories, their nested subcategories, and story distribution.',
    {},
    async () => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      const allStories = await db.stories.list({ status: 'PUBLISHED', limit: 200 });
      const countsByCat = new Map<string, number>();

      for (const s of allStories) {
        if (s.articleType) {
          countsByCat.set(s.articleType, (countsByCat.get(s.articleType) || 0) + 1);
        }
        if (s.categories) {
          for (const c of s.categories) {
            countsByCat.set(c, (countsByCat.get(c) || 0) + 1);
          }
        }
      }

      const hierarchy = CANONICAL_CATEGORIES.map((cat) => {
        const subs = dynamicSubCategories.get(cat.code) || [];
        return {
          code: cat.code,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          icon: cat.icon,
          storyCount: countsByCat.get(cat.code) || countsByCat.get(cat.slug) || 0,
          subCategories: subs.map((subName) => ({
            name: subName,
            storyCount: countsByCat.get(subName) || 0,
          })),
        };
      });

      return mcpJsonResponse({ categories: hierarchy, totalCategories: hierarchy.length });
    }
  );

  server.tool(
    'create_subcategory',
    '[WRITE] Register a new editorial subcategory under a primary category code.',
    {
      parentCode: CategoryCodeSchema.describe(
        'Parent primary category code (e.g. "technology", "world")'
      ),
      name: z.string().min(1).describe('Subcategory name (e.g. "Quantum Cryptography")'),
    },
    async ({ parentCode, name }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:write');

      const existing = dynamicSubCategories.get(parentCode) || [];
      if (!existing.includes(name)) {
        existing.push(name);
        dynamicSubCategories.set(parentCode, existing);
      }

      return mcpJsonResponse({
        message: 'Subcategory registered.',
        parentCode,
        name,
        allSubCategories: existing,
      });
    }
  );

  server.tool(
    'assign_story_categories',
    '[WRITE] Assign hierarchical categories and subcategories to a story.',
    {
      storyId: z.string().min(1).describe('Story ID'),
      categories: z.array(z.string().min(1)).describe('Category names or subcategories to assign'),
    },
    async ({ storyId, categories }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:write');

      const story = await db.stories.findById(storyId, principal.organizationId);
      if (!story) throw new Error(`Story ${storyId} not found`);
      story.categories = Array.from(new Set([...(story.categories || []), ...categories]));
      await db.stories.update(story);

      return mcpJsonResponse({
        message: 'Categories assigned to story.',
        storyId,
        categories: story.categories,
      });
    }
  );

  // Special Pop-Up Event Desks
  server.tool(
    'create_special_desk',
    '[WRITE] Launch a dynamic pop-up event news desk with custom theme color, banner, and live ticker.',
    CreateSpecialDeskInputSchema.shape,
    async (params) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:write');

      const desk = await specialDeskService.createDesk(params);
      return mcpJsonResponse({ message: 'Special desk launched.', desk });
    }
  );

  server.tool(
    'list_special_desks',
    '[READ-ONLY] List active or archived special coverage pop-up desks.',
    {
      onlyActive: z.boolean().optional().default(true).describe('Filter to only active desks'),
    },
    async ({ onlyActive }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      const desks = await specialDeskService.listDesks(onlyActive);
      return mcpJsonResponse({ desks, count: desks.length });
    }
  );

  server.tool(
    'pin_story_to_special_desk',
    '[WRITE] Pin a key breaking story to a special coverage desk.',
    {
      deskId: z.string().min(1).describe('Special desk ID or slug'),
      storyId: z.string().min(1).describe('Story ID to pin'),
    },
    async ({ deskId, storyId }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:write');

      const desk = await specialDeskService.pinStory(deskId, storyId);
      return mcpJsonResponse({ message: 'Story pinned to special desk.', desk });
    }
  );

  // Topic Dossier & Knowledge Graph
  server.tool(
    'get_topic_dossier',
    '[READ-ONLY] Retrieve comprehensive topic dossier including timeline milestones, sentiment pulse, key entities, and co-occurring topics.',
    {
      topicSlugOrId: z
        .string()
        .min(1)
        .describe('Topic slug or ID (e.g. "artificial-intelligence" or "top_ai")'),
    },
    async ({ topicSlugOrId }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      const dossier = await topicService.getTopicDossier(topicSlugOrId, principal.organizationId);
      return mcpJsonResponse(dossier);
    }
  );

  server.tool(
    'get_topic_knowledge_graph',
    '[READ-ONLY] Retrieve network knowledge graph of topics, co-occurrence edge weights, and story clusters.',
    {},
    async () => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      const graph = await topicService.getTopicKnowledgeGraph(principal.organizationId);
      return mcpJsonResponse(graph);
    }
  );
}
