import { describe, it, expect } from 'vitest';
import {
  DomainError,
  NotFoundError,
  ConflictError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  generateId,
  slugify,
  type PaginatedResult,
} from '@ai-news/shared';

describe('Shared Utilities & Domain Exceptions (Unit Tests)', () => {
  describe('Domain Exceptions Hierarchy', () => {
    it('instantiates base DomainError with default code and status 400', () => {
      const err = new DomainError('Base operation failure');
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(DomainError);
      expect(err.name).toBe('DomainError');
      expect(err.message).toBe('Base operation failure');
      expect(err.code).toBe('DOMAIN_ERROR');
      expect(err.statusCode).toBe(400);
      expect(err.details).toBeUndefined();
    });

    it('instantiates NotFoundError with 404 status and formatted entity message', () => {
      const err = new NotFoundError('Story', 'sty_abc_123');
      expect(err).toBeInstanceOf(DomainError);
      expect(err.name).toBe('NotFoundError');
      expect(err.statusCode).toBe(404);
      expect(err.code).toBe('NOT_FOUND');
      expect(err.message).toBe('Story with id "sty_abc_123" was not found.');
    });

    it('instantiates ConflictError with 409 status and optional details', () => {
      const details = { existingSlug: 'brics-2026-summit' };
      const err = new ConflictError('A story with this slug already exists.', details);
      expect(err).toBeInstanceOf(DomainError);
      expect(err.name).toBe('ConflictError');
      expect(err.statusCode).toBe(409);
      expect(err.code).toBe('CONFLICT');
      expect(err.details).toEqual(details);
    });

    it('instantiates ValidationError with 422 status and schema errors', () => {
      const schemaIssues = [{ field: 'title', message: 'Required' }];
      const err = new ValidationError('Payload validation failed', schemaIssues);
      expect(err).toBeInstanceOf(DomainError);
      expect(err.name).toBe('ValidationError');
      expect(err.statusCode).toBe(422);
      expect(err.code).toBe('VALIDATION_ERROR');
      expect(err.details).toEqual(schemaIssues);
    });

    it('instantiates UnauthorizedError with 401 status and default message', () => {
      const errDefault = new UnauthorizedError();
      expect(errDefault.statusCode).toBe(401);
      expect(errDefault.code).toBe('UNAUTHORIZED');
      expect(errDefault.message).toBe('Unauthorized');

      const errCustom = new UnauthorizedError('Token has expired');
      expect(errCustom.message).toBe('Token has expired');
    });

    it('instantiates ForbiddenError with 403 status and default message', () => {
      const errDefault = new ForbiddenError();
      expect(errDefault.statusCode).toBe(403);
      expect(errDefault.code).toBe('FORBIDDEN');
      expect(errDefault.message).toBe('Forbidden');

      const errCustom = new ForbiddenError('Insufficient privileges');
      expect(errCustom.message).toBe('Insufficient privileges');
    });
  });

  describe('generateId', () => {
    it('generates a standard UUID without prefix', () => {
      const id = generateId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('generates a prefixed alphanumeric ID with dashes stripped', () => {
      const id = generateId('sty');
      expect(id).toMatch(/^sty_[0-9a-f]{32}$/);

      const topicId = generateId('top');
      expect(topicId).toMatch(/^top_[0-9a-f]{32}$/);
    });

    it('produces unique identifiers across successive invocations', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 50; i++) {
        ids.add(generateId('test'));
      }
      expect(ids.size).toBe(50);
    });
  });

  describe('slugify', () => {
    it('converts titles to URL-safe kebab-case slugs', () => {
      expect(slugify('BRICS 2026 Summit in New Delhi')).toBe('brics-2026-summit-in-new-delhi');
    });

    it('strips punctuation, symbols, and leading/trailing dashes', () => {
      expect(slugify('  -- AI: Breakthroughs, Risks & Regulations! -- ')).toBe('ai-breakthroughs-risks-regulations');
    });

    it('collapses multiple spaces, underscores, and hyphens into single hyphens', () => {
      expect(slugify('quantum____computing   advancements---2026')).toBe('quantum-computing-advancements-2026');
    });

    it('handles empty or special-character-only strings gracefully', () => {
      expect(slugify('$$$###@@@')).toBe('');
      expect(slugify('')).toBe('');
    });
  });

  describe('PaginatedResult typing and structure', () => {
    it('constructs well-typed pagination responses', () => {
      const result: PaginatedResult<string> = {
        items: ['story_1', 'story_2'],
        nextCursor: 'cur_abc',
        totalCount: 150,
        hasMore: true,
      };

      expect(result.items.length).toBe(2);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('cur_abc');
    });
  });
});
