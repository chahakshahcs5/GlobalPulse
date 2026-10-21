import { z } from 'zod';
import { getBlockDefinition } from '@ai-news/schemas';

export interface ValidationIssue {
  /** Dot path to the offending value, e.g. `xAxis.key`. */
  path: string;
  /** The message the schema produced. */
  message: string;
  /** The value that failed, for context. */
  value?: unknown;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

/** The Zod schema for a block type, or undefined when the type is unknown. */
export function schemaForType(type: string): z.ZodTypeAny | undefined {
  return getBlockDefinition(type)?.schema;
}

/**
 * The path to the offending value, relative to the block's `data` payload.
 *
 * The studio's form fields are addressed relative to `data` as well, so an
 * issue can be shown next to the control that caused it.
 */
function issuePath(error: z.ZodIssue): string {
  const segments = error.path.map((segment) => String(segment));
  if (segments[0] === 'data') segments.shift();
  return segments.join('.');
}

/**
 * Validate a block's `data` payload against the schema the platform stores.
 *
 * The studio shows these issues next to the field that caused them, so an
 * editor sees *why* a payload is rejected instead of just "invalid".
 */
export function validateBlockData(type: string, data: unknown): ValidationResult {
  const schema = schemaForType(type);
  if (!schema) {
    return {
      ok: false,
      issues: [{ path: '', message: `Unknown block type "${type}".` }],
    };
  }

  // The registry stores the full block envelope (id, blockType, sortOrder,
  // data). The studio edits `data` on its own, so it is validated on its own.
  const result = schema.safeParse({
    id: 'studio_preview',
    blockType: type,
    sortOrder: 0,
    data,
  });

  if (result.success) return { ok: true, issues: [] };

  const issues: ValidationIssue[] = result.error.issues.map((error) => ({
    path: issuePath(error),
    message: error.message,
    value: error.path.length > 0 ? getAtPathSafe(data, issuePath(error)) : data,
  }));

  return { ok: false, issues };
}

function getAtPathSafe(source: unknown, path: string): unknown {
  if (path.length === 0) return source;
  let current: unknown = source;
  for (const segment of path.split('.')) {
    if (current === null || current === undefined) return undefined;
    if (Array.isArray(current)) {
      current = current[Number(segment)];
      continue;
    }
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

/** Group issues by their path so the form can mark the right control. */
export function issuesByPath(issues: ValidationIssue[]): Map<string, ValidationIssue[]> {
  const map = new Map<string, ValidationIssue[]>();
  for (const issue of issues) {
    const existing = map.get(issue.path);
    if (existing) existing.push(issue);
    else map.set(issue.path, [issue]);
  }
  return map;
}
