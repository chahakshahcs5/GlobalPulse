import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { DatabaseService } from '@ai-news/database';
import { StoryService, LiveFeedService } from '@ai-news/stories';
import type { AuthenticatedPrincipal } from '@ai-news/auth';

import { createAddBlockHelper } from './block-tool-helpers';
import { registerTextEditorialTools } from './text-editorial.tools';
import { registerMediaBlockTools } from './media-blocks.tools';
import { registerMediaExpansionTools } from './media-expansion.tools';
import { registerDataStorytellingTools } from './data-storytelling.tools';
import { registerInteractiveDocumentTools } from './interactive-document.tools';
import { registerLiveFeedTools } from './live-feed.tools';
import { registerBlockLifecycleTools } from './lifecycle.tools';

export * from './block-tool-helpers';
export * from './text-editorial.tools';
export * from './media-blocks.tools';
export * from './media-expansion.tools';
export * from './data-storytelling.tools';
export * from './interactive-document.tools';
export * from './live-feed.tools';
export * from './lifecycle.tools';

export function registerBlockTools(
  server: McpServer,
  db: DatabaseService,
  getPrincipal: () => AuthenticatedPrincipal
) {
  const storyService = new StoryService(db);
  const liveFeedService = new LiveFeedService(db);
  const helperAdd = createAddBlockHelper(storyService, getPrincipal);

  registerTextEditorialTools(server, helperAdd);
  registerMediaBlockTools(server, helperAdd);
  registerMediaExpansionTools(server, helperAdd);
  registerDataStorytellingTools(server, helperAdd);
  registerInteractiveDocumentTools(server, storyService, getPrincipal, helperAdd);
  registerLiveFeedTools(server, liveFeedService, getPrincipal, helperAdd);
  registerBlockLifecycleTools(server, storyService, getPrincipal);
}
