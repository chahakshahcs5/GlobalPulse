import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { createRequire } from 'module';
import { dirname, join } from 'path';

const SCHEMA_PATH = join(process.cwd(), 'libs/database/prisma/schema.prisma');
// `@prisma/client` is a dependency of the database package, not the root.
const require = createRequire(join(process.cwd(), 'libs/database/package.json'));

interface ModelShape {
  models: Record<string, string[]>;
}

/**
 * The models and their fields, in a form two schemas can be compared by.
 *
 * Only the field names matter: the generated client and the schema are
 * always formatted the same way by Prisma, but a field being present in one
 * and absent from the other is what breaks the API at runtime.
 */
function readShape(source: string): ModelShape {
  const models: Record<string, string[]> = {};
  let current: string[] | null = null;

  for (const line of source.split('\n')) {
    const modelMatch = /^model\s+(\w+)\s*\{/.exec(line);
    if (modelMatch) {
      current = [];
      models[modelMatch[1]] = current;
      continue;
    }
    if (current) {
      if (/^\}/.test(line)) {
        current = null;
        continue;
      }
      const fieldMatch = /^\s{2,}(\w+)\s+\w+/.exec(line);
      if (fieldMatch) current.push(fieldMatch[1]);
    }
  }

  return { models };
}

/** Where Prisma put the generated client. */
function generatedSchemaPath(): string | null {
  let entry: string;
  try {
    entry = require.resolve('@prisma/client');
  } catch {
    return null;
  }

  // Walk up looking for the `.prisma/client` directory Prisma generates
  // alongside the client package, rather than assuming a fixed depth.
  let dir = dirname(entry);
  for (let depth = 0; depth < 8; depth++) {
    const candidate = join(dir, '.prisma', 'client', 'schema.prisma');
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return null;
}

/**
 * The generated Prisma client must match the schema.
 *
 * The client is generated, not compiled, so it goes stale the moment the
 * schema changes. A stale client does not fail loudly at build time — it
 * fails at runtime, on the first query that touches a field the client does
 * not know about, with an "Unknown argument" error that looks like a bug in
 * the calling code rather than a build artefact left behind.
 *
 * That is not hypothetical: a stale client is what made every story update
 * and every version commit fail with a 500.
 */
describe('Prisma client', () => {
  it('is generated from the current schema', () => {
    const generated = generatedSchemaPath();

    expect(
      generated,
      'The Prisma client has not been generated. Run `pnpm db:generate`.'
    ).not.toBeNull();

    const expected = readShape(readFileSync(SCHEMA_PATH, 'utf8'));
    const actual = readShape(readFileSync(generated!, 'utf8'));

    const differences: string[] = [];

    for (const [model, fields] of Object.entries(expected.models)) {
      const actualFields = actual.models[model];
      if (!actualFields) {
        differences.push(`${model}: missing from the generated client`);
        continue;
      }
      const missing = fields.filter((field) => !actualFields.includes(field));
      if (missing.length > 0) {
        differences.push(`${model}: missing field(s) ${missing.join(', ')}`);
      }
    }

    expect(
      differences,
      `The generated Prisma client is out of date:\n  ${differences.join('\n  ')}\n\n` +
        'Run `pnpm db:generate` and commit the result.'
    ).toEqual([]);
  });
});
