import { describe, it, expect } from 'vitest';
import { ApiError } from '../../../apps/api/src/common/errors/api-error';
import { globalErrorHandler } from '../../../apps/api/src/common/errors/error-handler';
import { requireScope } from '../../../apps/api/src/common/guards/scope.guard';
import { ApiResponse } from '../../../apps/api/src/common/response/api-response';
import { DomainError, NotFoundError, ValidationError, ForbiddenError } from '@ai-news/shared';
import { z } from 'zod';

describe('API Common Layer Unit Tests', () => {
  describe('ApiError Factory Subclasses', () => {
    it('creates badRequest error with statusCode 400', () => {
      const err = ApiError.badRequest('Invalid parameter', { field: 'slug' });
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe('BAD_REQUEST');
      expect(err.message).toBe('Invalid parameter');
      expect(err.details).toEqual({ field: 'slug' });
    });

    it('creates notFound error with standard message', () => {
      const err = ApiError.notFound('Story', 'sty_123');
      expect(err.statusCode).toBe(404);
      expect(err.code).toBe('NOT_FOUND');
      expect(err.message).toContain('sty_123');
    });

    it('creates unauthorized error with 401', () => {
      const err = ApiError.unauthorized();
      expect(err.statusCode).toBe(401);
      expect(err.code).toBe('UNAUTHORIZED');
    });

    it('creates forbidden error with 403', () => {
      const err = ApiError.forbidden();
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe('FORBIDDEN');
    });
  });

  describe('RFC 7807 Global Error Handler', () => {
    it('formats DomainError into RFC 7807 problem details JSON', () => {
      let sentStatus = 0;
      let sentBody: any = null;

      const mockReply: any = {
        status: (s: number) => {
          sentStatus = s;
          return {
            send: (b: any) => {
              sentBody = b;
              return b;
            },
          };
        },
      };

      const mockRequest: any = {
        url: '/api/stories/sty_missing',
        method: 'GET',
      };

      const notFoundErr = new NotFoundError('Story', 'sty_missing');
      globalErrorHandler(notFoundErr, mockRequest, mockReply);

      expect(sentStatus).toBe(404);
      expect(sentBody.type).toContain('not-found');
      expect(sentBody.status).toBe(404);
      expect(sentBody.detail).toContain('sty_missing');
      expect(sentBody.timestamp).toBeDefined();
    });

    it('formats ZodError into validation problem details with field errors', () => {
      let sentStatus = 0;
      let sentBody: any = null;

      const mockReply: any = {
        status: (s: number) => {
          sentStatus = s;
          return {
            send: (b: any) => {
              sentBody = b;
              return b;
            },
          };
        },
      };

      const mockRequest: any = { url: '/api/stories', method: 'POST' };

      const TestSchema = z.object({ title: z.string().min(5) });
      let zodErr: any;
      try {
        TestSchema.parse({ title: 'abc' });
      } catch (e) {
        zodErr = e;
      }

      globalErrorHandler(zodErr, mockRequest, mockReply);

      expect(sentStatus).toBe(400);
      expect(sentBody.code).toBe('VALIDATION_ERROR');
      expect(sentBody.errors.length).toBeGreaterThan(0);
      expect(sentBody.errors[0].path).toBe('title');
    });
  });

  describe('OAuth Scope Guard', () => {
    it('allows principal with matching scope', async () => {
      const guard = requireScope('news:publish');
      const req: any = {
        principal: {
          id: 'usr_1',
          organizationId: 'org_1',
          scopes: ['news:read', 'news:publish'],
        },
      };
      await expect(guard(req, {} as any)).resolves.toBeUndefined();
    });

    it('allows principal with news:admin scope for any required scope', async () => {
      const guard = requireScope('news:publish');
      const req: any = {
        principal: {
          id: 'usr_admin',
          organizationId: 'org_1',
          scopes: ['news:admin'],
        },
      };
      await expect(guard(req, {} as any)).resolves.toBeUndefined();
    });

    it('throws ForbiddenError if principal lacks required scope', async () => {
      const guard = requireScope('news:publish');
      const req: any = {
        principal: {
          id: 'usr_reader',
          organizationId: 'org_1',
          scopes: ['news:read'],
        },
      };
      await expect(guard(req, {} as any)).rejects.toThrow(ForbiddenError);
    });
  });

  describe('ApiResponse Envelope Helper', () => {
    it('wraps payload in success envelope with timestamp', () => {
      const response = ApiResponse.success({ id: '123', name: 'AI News' });
      expect(response.success).toBe(true);
      expect(response.data).toEqual({ id: '123', name: 'AI News' });
      expect(response.timestamp).toBeDefined();
    });

    it('wraps array in paginated response envelope with metadata', () => {
      const items = [{ id: '1' }, { id: '2' }];
      const response = ApiResponse.paginated(items, 10, 2);
      expect(response.success).toBe(true);
      expect(response.data.length).toBe(2);
      expect(response.meta?.total).toBe(10);
      expect(response.meta?.limit).toBe(2);
      expect(response.meta?.hasMore).toBe(true);
    });
  });
});
