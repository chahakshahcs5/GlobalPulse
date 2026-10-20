import { describe, it, expect } from 'vitest';
import {
  BLOCK_REGISTRY,
  buildBlockCatalog,
  getBlockDefinition,
  listBlockDefinitions,
  listBlockTypes,
  supportsBlockType,
  zodToJsonSchema,
} from '@ai-news/schemas';

describe('Story Block Registry', () => {
  it('exposes a stable, unique catalog of block types', () => {
    const types = listBlockTypes();

    expect(types.length).toBeGreaterThanOrEqual(41);
    expect(new Set(types).size).toBe(types.length);
    expect(types).toContain('paragraph');
    expect(types).toContain('timeline');
    expect(types).toContain('evidence');
    expect(types).toContain('what_changed');
    expect(types).toContain('perspective');
    expect(types).toContain('interview');
  });

  it('describes every block with capabilities and a schema', () => {
    for (const definition of listBlockDefinitions()) {
      expect(definition.type).toBeTruthy();
      expect(definition.description.length).toBeGreaterThan(10);
      expect(definition.schemaVersion).toBeGreaterThanOrEqual(1);
      expect(definition.capabilities.api).toBe(true);
      expect(definition.capabilities.mcp).toBe(true);
      expect(definition.schema).toBeDefined();
    }
  });

  it('converts every block schema to JSON Schema', () => {
    for (const definition of listBlockDefinitions()) {
      const jsonSchema = zodToJsonSchema(definition.schema);
      expect(jsonSchema.type).toBe('object');
      expect(jsonSchema.properties).toBeTypeOf('object');
      expect(Array.isArray(jsonSchema.required)).toBe(true);
    }
  });

  it('builds a catalog payload with JSON schemas', () => {
    const catalog = buildBlockCatalog();

    expect(catalog.count).toBe(listBlockDefinitions().length);
    expect(catalog.blocks.length).toBe(catalog.count);
    expect(catalog.version).toBeTruthy();

    const evidence = catalog.blocks.find((entry) => entry.type === 'evidence');
    expect(evidence).toBeDefined();
    expect(evidence?.jsonSchema.type).toBe('object');
    const dataSchema = (evidence?.jsonSchema.properties as Record<string, unknown>)?.data as {
      type?: string;
      required?: string[];
    };
    expect(dataSchema?.type).toBe('object');
    expect(dataSchema?.required).toContain('title');
  });

  it('looks up definitions and reports unknown types', () => {
    expect(getBlockDefinition('paragraph')?.type).toBe('paragraph');
    expect(getBlockDefinition('not_a_block')).toBeUndefined();
    expect(supportsBlockType('paragraph')).toBe(true);
    expect(supportsBlockType('not_a_block')).toBe(false);
  });

  it('keeps the registry frozen', () => {
    expect(Object.isFrozen(BLOCK_REGISTRY)).toBe(true);
  });
});
