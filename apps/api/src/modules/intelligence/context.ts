import type { AuthenticatedPrincipal } from '@ai-news/auth';
import { db } from '@ai-news/database';
import type { IntelligenceContext } from '@ai-news/stories';

export function intelligenceContext(principal: AuthenticatedPrincipal): IntelligenceContext {
  return {
    organizationId: principal.organizationId,
    actorId: principal.id,
    clientType: principal.clientType,
  };
}

export const defaultOrgId = 'org_default';
export { db };
