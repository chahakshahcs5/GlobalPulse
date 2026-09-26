import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { DatabaseService } from '@ai-news/database';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';

export function registerResources(
  server: McpServer,
  db: DatabaseService,
  getPrincipal: () => AuthenticatedPrincipal
) {
  server.resource(
    'story-details',
    new ResourceTemplate('news://stories/{id}', { list: undefined }),
    async (uri, { id }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      const story = await db.stories.findById(String(id), principal.organizationId);
      if (!story) {
        throw new Error(`Story ${id} not found`);
      }

      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(story, null, 2),
            mimeType: 'application/json',
          },
        ],
      };
    }
  );

  server.resource(
    'story-versions',
    new ResourceTemplate('news://stories/{id}/versions', { list: undefined }),
    async (uri, { id }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      const versions = await db.stories.getVersions(String(id));
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(versions, null, 2),
            mimeType: 'application/json',
          },
        ],
      };
    }
  );

  server.resource(
    'topic-details',
    new ResourceTemplate('news://topics/{id}', { list: undefined }),
    async (uri, { id }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      const topic = await db.topics.findById(String(id), principal.organizationId);
      if (!topic) {
        throw new Error(`Topic ${id} not found`);
      }

      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(topic, null, 2),
            mimeType: 'application/json',
          },
        ],
      };
    }
  );

  server.resource(
    'event-details',
    new ResourceTemplate('news://events/{id}', { list: undefined }),
    async (uri, { id }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      const event = await db.events.findById(String(id), principal.organizationId);
      if (!event) {
        throw new Error(`Event ${id} not found`);
      }

      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(event, null, 2),
            mimeType: 'application/json',
          },
        ],
      };
    }
  );
}
