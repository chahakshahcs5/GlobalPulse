import { describe, it, expect } from 'vitest';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { ApiError } from '../../../apps/api/src/common/errors/api-error';
import { globalErrorHandler } from '../../../apps/api/src/common/errors/error-handler';
import { requireScope } from '../../../apps/api/src/common/guards/scope.guard';
import { ApiResponse } from '../../../apps/api/src/common/response/api-response';
import { NotFoundError, ForbiddenError } from '@ai-news/shared';
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
      const captured = {
        status: 0,
        body: null as Record<string, unknown> | null,
      };

      const mockReply = {
        status: (s: number) => {
          captured.status = s;
          return {
            send: (b: Record<string, unknown>) => {
              captured.body = b;
              return b;
            },
          };
        },
      } as unknown as FastifyReply;

      const mockRequest = {
        url: '/api/stories/sty_missing',
        method: 'GET',
      } as unknown as FastifyRequest;

      const notFoundErr = new NotFoundError('Story', 'sty_missing');
      globalErrorHandler(notFoundErr, mockRequest, mockReply);

      expect(captured.status).toBe(404);
      expect(captured.body?.type as string).toContain('not-found');
      expect(captured.body?.status).toBe(404);
      expect(captured.body?.detail as string).toContain('sty_missing');
      expect(captured.body?.timestamp).toBeDefined();
    });

    it('formats ZodError into validation problem details with field errors', () => {
      const captured = {
        status: 0,
        body: null as Record<string, unknown> | null,
      };

      const mockReply = {
        status: (s: number) => {
          captured.status = s;
          return {
            send: (b: Record<string, unknown>) => {
              captured.body = b;
              return b;
            },
          };
        },
      } as unknown as FastifyReply;

      const mockRequest = { url: '/api/stories', method: 'POST' } as unknown as FastifyRequest;

      const TestSchema = z.object({ title: z.string().min(5) });
      let zodErr: unknown;
      try {
        TestSchema.parse({ title: 'abc' });
      } catch (e: unknown) {
        zodErr = e;
      }

      globalErrorHandler(zodErr as Error, mockRequest, mockReply);

      expect(captured.status).toBe(400);
      expect(captured.body?.code).toBe('VALIDATION_ERROR');
      const errors = captured.body?.errors as Array<{ path: string }>;
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].path).toBe('title');
    });
  });

  describe('OAuth Scope Guard', () => {
    it('allows principal with matching scope', async () => {
      const guard = requireScope('news:publish');
      const req = {
        principal: {
          id: 'usr_1',
          organizationId: 'org_1',
          role: 'editor',
          scopes: ['news:read', 'news:publish'],
        },
      } as unknown as FastifyRequest;
      const dummyReply = {} as FastifyReply;
      await expect(guard(req, dummyReply)).resolves.toBeUndefined();
    });

    it('allows principal with news:admin scope for any required scope', async () => {
      const guard = requireScope('news:publish');
      const req = {
        principal: {
          id: 'usr_admin',
          organizationId: 'org_1',
          role: 'admin',
          scopes: ['news:admin'],
        },
      } as unknown as FastifyRequest;
      const dummyReply = {} as FastifyReply;
      await expect(guard(req, dummyReply)).resolves.toBeUndefined();
    });

    it('throws ForbiddenError if principal lacks required scope', async () => {
      const guard = requireScope('news:publish');
      const req = {
        principal: {
          id: 'usr_reader',
          organizationId: 'org_1',
          role: 'reader',
          scopes: ['news:read'],
        },
      } as unknown as FastifyRequest;
      const dummyReply = {} as FastifyReply;
      await expect(guard(req, dummyReply)).rejects.toThrow(ForbiddenError);
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
