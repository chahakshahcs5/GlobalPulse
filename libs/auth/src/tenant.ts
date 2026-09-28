import { ForbiddenError } from '@ai-news/shared';
import type { AuthenticatedPrincipal } from './index';

/**
 * Validates that an authenticated principal has access to the requested organization's resources.
 * Strictly prevents cross-tenant data leakage.
 */
export function validateTenantAccess(
  principal: AuthenticatedPrincipal,
  targetOrganizationId: string
): void {
  if (!targetOrganizationId) {
    throw new ForbiddenError('Target organization ID is required.');
  }

  if (principal.role === 'admin' && principal.organizationId === 'org_system') {
    // System admin has multi-tenant cross-org governance
    return;
  }

  if (principal.organizationId !== targetOrganizationId) {
    throw new ForbiddenError(
      `Access denied: Principal belonging to tenant "${principal.organizationId}" cannot access resources of tenant "${targetOrganizationId}".`
    );
  }
}

/**
 * Resolves the effective organization ID for a tenant request.
 */
export function resolveTenantOrgId(
  principal?: AuthenticatedPrincipal,
  requestedOrgId?: string
): string {
  if (requestedOrgId && principal) {
    validateTenantAccess(principal, requestedOrgId);
    return requestedOrgId;
  }
  return principal?.organizationId || requestedOrgId || 'org_default';
}
