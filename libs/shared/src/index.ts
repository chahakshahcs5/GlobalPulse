import { v4 as uuidv4 } from 'uuid';

export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'DOMAIN_ERROR',
    public readonly statusCode: number = 400,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class NotFoundError extends DomainError {
  constructor(entityName: string, id: string) {
    super(`${entityName} with id "${id}" was not found.`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONFLICT', 409, details);
    this.name = 'ConflictError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 422, details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string = 'Forbidden') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

export function generateId(prefix?: string): string {
  const id = uuidv4();
  return prefix ? `${prefix}_${id.replace(/-/g, '')}` : id;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor?: string;
  cursor?: string;
  offset?: number;
  limit?: number;
  totalCount?: number;
  total?: number;
  hasMore?: boolean;
}

export function encodeCursor(record: { updatedAt: string; id: string }): string {
  const payload = JSON.stringify({ u: record.updatedAt, i: record.id });
  return Buffer.from(payload).toString('base64url');
}

export function decodeCursor(cursor: string): { updatedAt: string; id: string } | null {
  if (!cursor || typeof cursor !== 'string') return null;
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.i === 'string') {
      return { updatedAt: parsed.u || '', id: parsed.i };
    }
  } catch {
    // If it's a plain ID passed directly as cursor
    return { updatedAt: '', id: cursor };
  }
  return { updatedAt: '', id: cursor };
}

