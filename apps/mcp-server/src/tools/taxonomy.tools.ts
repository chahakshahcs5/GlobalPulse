import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabaseService } from '@ai-news/database';
import { TopicService } from '@ai-news/topics';
import { EventService } from '@ai-news/events';
import { EntityService } from '@ai-news/entities';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { EntityTypeSchema, EventStatusSchema } from '@ai-news/schemas';

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
      return {
        content: [{ type: 'text', text: JSON.stringify({ message: 'Topic created.', topic }, null, 2) }],
      };
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

      return {
        content: [{ type: 'text', text: JSON.stringify({ message: 'Topic updated.', topic: updated }, null, 2) }],
      };
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
      return {
        content: [{ type: 'text', text: JSON.stringify(topic, null, 2) }],
      };
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

      return {
        content: [{ type: 'text', text: JSON.stringify({ message: 'Story linked to topic.', storyId, topicId }) }],
      };
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
      return {
        content: [{ type: 'text', text: JSON.stringify({ message: 'Event created.', event }, null, 2) }],
      };
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

      return {
        content: [{ type: 'text', text: JSON.stringify({ message: 'Event updated.', event: updated }, null, 2) }],
      };
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
      return {
        content: [{ type: 'text', text: JSON.stringify(event, null, 2) }],
      };
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

      return {
        content: [{ type: 'text', text: JSON.stringify({ message: 'Story linked to event.', storyId, eventId }) }],
      };
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
      return {
        content: [{ type: 'text', text: JSON.stringify({ message: 'Entity created.', entity }, null, 2) }],
      };
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

      return {
        content: [{ type: 'text', text: JSON.stringify({ message: 'Entity updated.', entity: updated }, null, 2) }],
      };
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
      return {
        content: [{ type: 'text', text: JSON.stringify(entity, null, 2) }],
      };
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

      return {
        content: [{ type: 'text', text: JSON.stringify({ message: 'Story linked to entity.', storyId, entityId }) }],
      };
    }
  );
}
