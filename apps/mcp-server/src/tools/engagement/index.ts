import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { DatabaseService } from '@ai-news/database';
import {
  EngagementService,
  NewsletterService,
  CollectionService,
  StoryService,
  PerspectivesService,
} from '@ai-news/stories';
import type { AuthenticatedPrincipal } from '@ai-news/auth';

import { registerCommentTools } from './comments.tools';
import { registerReactionBookmarkTools } from './reactions-bookmarks.tools';
import { registerNewsletterSocialTools } from './newsletter-social.tools';
import { registerCollectionTools } from './collections.tools';
import { registerPollPerspectiveTools } from './polls-perspectives.tools';

export * from './comments.tools';
export * from './reactions-bookmarks.tools';
export * from './newsletter-social.tools';
export * from './collections.tools';
export * from './polls-perspectives.tools';

export function registerEngagementTools(
  server: McpServer,
  db: DatabaseService,
  getPrincipal: () => AuthenticatedPrincipal
) {
  const engagementService = new EngagementService(db);
  const storyService = new StoryService(db);
  const newsletterService = new NewsletterService(db);
  const collectionService = new CollectionService(db);
  const perspectivesService = new PerspectivesService();

  registerCommentTools(server, engagementService, getPrincipal);
  registerReactionBookmarkTools(server, engagementService, getPrincipal);
  registerNewsletterSocialTools(server, db, newsletterService, getPrincipal);
  registerCollectionTools(server, collectionService, getPrincipal);
  registerPollPerspectiveTools(server, storyService, perspectivesService, getPrincipal);
}
