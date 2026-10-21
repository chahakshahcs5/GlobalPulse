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
export * from './path';
export * from './registry';
export * from './samples';
export * from './validation';
export * from './components/FormEditor';
export * from './components/JsonEditor';
