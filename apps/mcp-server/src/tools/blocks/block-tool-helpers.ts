import type { StoryService } from '@ai-news/stories';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { mcpJsonResponse } from '../tool-helpers';

export type AddBlockHelper = (
  storyId: string,
  block: Parameters<StoryService['addBlock']>[1]
) => Promise<ReturnType<typeof mcpJsonResponse>>;

export function createAddBlockHelper(
  storyService: StoryService,
  getPrincipal: () => AuthenticatedPrincipal
): AddBlockHelper {
  return async (storyId: string, block: Parameters<StoryService['addBlock']>[1]) => {
    const principal = getPrincipal();
    AuthService.requireScope(principal, 'news:write');

    const added = await storyService.addBlock(storyId, block, {
      organizationId: principal.organizationId,
      authorId: principal.id,
      clientType: principal.clientType,
      createdVia: 'mcp',
    });

    return mcpJsonResponse({
      message: `Block of type "${added.blockType}" added to story.`,
      blockId: added.id,
      sortOrder: added.sortOrder,
    });
  };
}
