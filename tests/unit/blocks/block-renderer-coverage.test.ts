import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { listBlockTypes } from '@ai-news/schemas';

/**
 * Every block type in the registry must have a renderer on both the web and
 * the mobile surface.
 *
 * A missing renderer is silent: the article simply renders without the
 * content. This guard turns that into a failing test.
 */
function collectCaseStatements(directory: string): Set<string> {
  const found = new Set<string>();
  for (const file of readdirSync(directory)) {
    if (!file.endsWith('.tsx')) continue;
    const source = readFileSync(join(directory, file), 'utf8');
    for (const match of source.matchAll(/case\s+'([a-z0-9_]+)'\s*:/g)) {
      found.add(match[1]);
    }
  }
  return found;
}

describe('Block renderer coverage', () => {
  const webDir = join(process.cwd(), 'apps/web/src/components/story-blocks');
  const mobileDir = join(process.cwd(), 'apps/mobile/src/components/mobile-blocks');

  it('renders every registered block type on the web', () => {
    const rendered = collectCaseStatements(webDir);
    const missing = listBlockTypes().filter((type) => !rendered.has(type));
    expect(missing).toEqual([]);
  });

  it('renders every registered block type on mobile', () => {
    const rendered = collectCaseStatements(mobileDir);
    const missing = listBlockTypes().filter((type) => !rendered.has(type));
    expect(missing).toEqual([]);
  });

  it('keeps the renderer in sync with the registry', () => {
    // Only the dispatchers are checked for orphans: helper views contain
    // non-block `case` statements (statuses, formats) that are not types.
    const webDispatcher = readFileSync(join(webDir, 'BlockItem.tsx'), 'utf8');
    const mobileDispatcher = readFileSync(join(mobileDir, 'MobileBlockItem.tsx'), 'utf8');
    const registered = listBlockTypes();

    const webOrphans = Array.from(webDispatcher.matchAll(/case\s+'([a-z0-9_]+)'\s*:/g))
      .map((match) => match[1])
      .filter((type) => !registered.includes(type));
    const mobileOrphans = Array.from(mobileDispatcher.matchAll(/case\s+'([a-z0-9_]+)'\s*:/g))
      .map((match) => match[1])
      .filter((type) => !registered.includes(type));

    expect(webOrphans).toEqual([]);
    expect(mobileOrphans).toEqual([]);
  });
});
