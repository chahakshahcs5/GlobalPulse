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

  server.tool(
    'create_topic',
    'Register a new topic or beat in the taxonomy registry.',
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
    'get_topic',
    'Retrieve topic details by ID or slug.',
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
    'create_event',
    'Register a real-world occurrence (distinct from stories) in the event registry.',
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
    'get_event',
    'Retrieve event details by ID.',
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
    'create_entity',
    'Register a named entity (Person, Organization, Country, Location, Technology, Product, Institution).',
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
    'get_entity',
    'Retrieve entity profile by ID.',
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
    'link_story_to_topic',
    'Associate a story with a topic ID.',
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
}
