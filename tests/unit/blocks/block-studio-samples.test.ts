import { describe, it, expect } from 'vitest';
import { listBlockTypes } from '@ai-news/schemas';
import {
  BLOCK_SAMPLES,
  buildDataFormFields,
  getAtPath,
  listStudioBlocks,
  schemaForType,
  setAtPath,
  validateBlockData,
  type FormField,
} from '@ai-news/block-studio';

/**
 * Every path the generated form can write to.
 *
 * Objects contribute their children, arrays contribute the array itself plus
 * the fields of their first element, and every other kind is a leaf.
 */
function collectLeafPaths(fields: FormField[], prefix = ''): string[] {
  const paths: string[] = [];

  for (const field of fields) {
    const path = prefix.length === 0 ? field.key : `${prefix}.${field.key}`;

    if (field.kind === 'object') {
      paths.push(...collectLeafPaths(field.fields ?? [], path));
      continue;
    }

    paths.push(path);

    if (field.kind === 'array' && field.item?.kind === 'object') {
      paths.push(...collectLeafPaths(field.item.fields ?? [], `${path}.0`));
    }
  }

  return paths;
}

/**
 * The studio previews sample payloads for every block type.
 *
 * A sample that does not match its schema would preview a block the platform
 * would reject, so the preview would teach an editor the wrong thing. These
 * tests make that impossible to ship by accident.
 */
describe('Block Studio samples', () => {
  const blockTypes = listBlockTypes();

  it('has a sample for every registered block type', () => {
    const missing = blockTypes.filter((type) => !BLOCK_SAMPLES[type]?.length);
    expect(missing).toEqual([]);
  });

  it('has no samples for block types that do not exist', () => {
    const orphans = Object.keys(BLOCK_SAMPLES).filter((type) => !blockTypes.includes(type));
    expect(orphans).toEqual([]);
  });

  it('validates every sample against its block schema', () => {
    const failures: string[] = [];

    for (const [type, variants] of Object.entries(BLOCK_SAMPLES)) {
      for (const variant of variants) {
        const result = validateBlockData(type, variant.data);
        if (!result.ok) {
          const detail = result.issues
            .map((issue) => `${issue.path || '(root)'}: ${issue.message}`)
            .join('; ');
          failures.push(`${type} / ${variant.id} — ${detail}`);
        }
      }
    }

    expect(failures).toEqual([]);
  });

  it('gives every block a unique variant id', () => {
    for (const block of listStudioBlocks()) {
      const ids = block.variants.map((variant) => variant.id);
      expect(new Set(ids).size, `${block.type} has duplicate variant ids`).toBe(ids.length);
    }
  });

  it('builds an editable form for every block type', () => {
    for (const type of blockTypes) {
      const schema = schemaForType(type);
      expect(schema, `${type} has no schema`).toBeDefined();

      const fields = buildDataFormFields(schema!);
      expect(fields.kind).toBe('object');
      expect(fields.fields?.length ?? 0, `${type} produced no fields`).toBeGreaterThan(0);
    }
  });

  it('edits the data payload, not the block envelope', () => {
    // The envelope is the platform's bookkeeping (`id`, `sortOrder`, …).
    // An editor authors the data, so the form must be generated from that.
    const fields = buildDataFormFields(schemaForType('chart')!);
    const keys = (fields.fields ?? []).map((field) => field.key);

    expect(keys).toContain('chartType');
    expect(keys).toContain('title');
    expect(keys).toContain('xAxis');
    expect(keys).not.toContain('id');
    expect(keys).not.toContain('blockType');
    expect(keys).not.toContain('sortOrder');
  });

  it('finds the same fields the validator reports on', () => {
    const result = validateBlockData('chart', {
      chartType: 'not_a_chart_type',
      title: 'Broken',
      xAxis: { key: 'x', label: 'X' },
      yAxis: { label: 'Y' },
      series: [{ name: 'S', key: 's' }],
      values: [{ x: 1, s: 2 }],
    });

    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.path)).toContain('chartType');
  });

  it('can write and read back every field the form generates', () => {
    const failures: string[] = [];

    for (const block of listStudioBlocks()) {
      const schema = schemaForType(block.type);
      if (!schema) continue;

      const fields = buildDataFormFields(schema);
      const sample = block.variants[0].data;

      for (const path of collectLeafPaths(fields.fields ?? [])) {
        const before = getAtPath(sample, path);
        const written = setAtPath(sample, path, 'PROBE');
        const after = getAtPath(written, path);

        if (after !== 'PROBE') {
          failures.push(`${block.type}: could not read back "${path}"`);
        }
        if (getAtPath(sample, path) !== before) {
          failures.push(`${block.type}: writing "${path}" mutated the source payload`);
        }
      }
    }

    expect(failures).toEqual([]);
  });

  it('generates a form that reaches every part of the payload', () => {
    // A field that the form cannot reach is a value the editor cannot
    // change, so the generated paths have to cover the sample payload.
    const unreachable: string[] = [];

    for (const block of listStudioBlocks()) {
      const schema = schemaForType(block.type);
      if (!schema) continue;

      const fields = buildDataFormFields(schema);
      const paths = collectLeafPaths(fields.fields ?? []);
      const covered = new Set(paths);

      // An object is edited through its children, so the object path itself
      // counts as covered when the form has fields for what is inside it.
      const groupPaths = new Set<string>();
      for (const path of paths) {
        const parts = path.split('.');
        while (parts.length > 1) {
          parts.pop();
          groupPaths.add(parts.join('.'));
        }
      }

      // A path is covered when the form edits it directly, when it is an
      // object whose children are edited, or when one of its parents is
      // edited wholesale — an array, or a JSON record, is changed as a whole
      // rather than field by field.
      const isCovered = (path: string): boolean => {
        if (covered.has(path) || groupPaths.has(path)) return true;
        const parts = path.split('.');
        while (parts.length > 1) {
          parts.pop();
          const parent = parts.join('.');
          if (covered.has(parent) || groupPaths.has(parent)) return true;
        }
        return false;
      };

      const walk = (value: unknown, prefix: string) => {
        if (!value || typeof value !== 'object') return;
        for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
          const path = prefix.length === 0 ? key : `${prefix}.${key}`;
          if (!isCovered(path)) {
            unreachable.push(`${block.type}: ${path}`);
            continue;
          }
          walk(child, path);
        }
      };

      walk(block.variants[0].data, '');
    }

    expect(unreachable).toEqual([]);
  });
});
