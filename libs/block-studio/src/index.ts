/**
 * `@ai-news/block-studio` — the engine behind the Block Studio.
 *
 * It knows which block types exist, what each one's variants look like, how
 * to turn a block's schema into an editable form, and how to validate an
 * edited payload. The studio UI lives in `apps/block-studio`; this package
 * holds everything that could be useful elsewhere (a docs generator, a
 * validation CLI, an authoring assistant).
 */
export * from './types';
export * from './form-schema';
export * from './hints';
export * from './handoff';
export * from './path';
export * from './payload';
export * from './registry';
export * from './samples/index';
export * from './validation';
export * from './components/BlockForm';
export * from './components/FormEditor';
export * from './components/JsonEditor';
