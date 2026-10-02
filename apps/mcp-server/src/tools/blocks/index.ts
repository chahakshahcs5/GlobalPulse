import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { DatabaseService } from '@ai-news/database';
import { StoryService } from '@ai-news/stories';
import type { AuthenticatedPrincipal } from '@ai-news/auth';

import { createAddBlockHelper } from './block-tool-helpers';
import { registerTextEditorialTools } from './text-editorial.tools';
import { registerMediaBlockTools } from './media-blocks.tools';
import { registerDataStorytellingTools } from './data-storytelling.tools';
import { registerInteractiveDocumentTools } from './interactive-document.tools';
import { registerBlockLifecycleTools } from './lifecycle.tools';

export * from './block-tool-helpers';
export * from './text-editorial.tools';
export * from './media-blocks.tools';
export * from './data-storytelling.tools';
export * from './interactive-document.tools';
export * from './lifecycle.tools';

export function registerBlockTools(
  server: McpServer,
  db: DatabaseService,
  getPrincipal: () => AuthenticatedPrincipal
) {
  const storyService = new StoryService(db);
  const helperAdd = createAddBlockHelper(storyService, getPrincipal);

  registerTextEditorialTools(server, helperAdd);
  registerMediaBlockTools(server, helperAdd);
  registerDataStorytellingTools(server, helperAdd);
  registerInteractiveDocumentTools(server, storyService, getPrincipal, helperAdd);
  registerBlockLifecycleTools(server, storyService, getPrincipal);
}
