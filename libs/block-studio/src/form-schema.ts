import { z } from 'zod';
import { hintFor, type FieldControl, type FieldHint, type VisibilityRule } from './hints';

/**
 * Turn a Zod schema into a tree of form fields.
 *
 * The Block Studio edits a block's payload through an automatically
 * generated form. Rather than hand-writing a field editor per block type
 * (there are fifty-five of them, and they change), the studio reads the
 * Zod schema the platform already validates against — so the form and the
 * validator can never drift apart.
 *
 * Anything the converter does not understand falls back to a JSON field,
 * which is always correct, just less pleasant to edit.
 */

export type FieldKind =
  'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'json' | 'object' | 'array';

export type FieldFormat = 'url' | 'email' | 'date';

export interface FieldOption {
  value: string;
  label: string;
}

export interface FormField {
  /** The property name within the parent object. */
  key: string;
  /** Human label for the control. */
  label: string;
  kind: FieldKind;
  /**
   * The control to draw.
   *
   * It is the inferred `kind` unless a hint asked for something else — a
   * colour wants a swatch picker, a short list of options wants a row of
   * buttons. The data kind is unchanged either way: a colour is still a
   * string, and the schema still decides what a valid string is.
   */
  control?: FieldControl;
  /** The schema's own description, when it carries one. */
  description?: string;
  /** Guidance shown under the control, from a hint. */
  help?: string;
  /** False when the field may be omitted. */
  required: boolean;
  /** Choices for a `select` field. */
  options?: FieldOption[];
  min?: number;
  max?: number;
  step?: number;
  /** The schema's declared default, used to seed an empty field. */
  defaultValue?: unknown;
  format?: FieldFormat;
  /** A suffix shown after the value, e.g. `%` or `km`. */
  unit?: string;
  /** The field is collapsed behind a disclosure until it is asked for. */
  advanced?: boolean;
  /** The rule under which the field applies. */
  visibleWhen?: VisibilityRule;
  /**
   * The group the field belongs to within its section.
   *
   * Only meaningful for a field at the top level of a section; a field
   * nested inside an object or a list belongs to its parent.
   */
  group?: string;
  /** The field's position within its group. Lower comes first. */
  order?: number;
  /** Children of an `object` field. */
  fields?: FormField[];
  /** The element descriptor of an `array` field. */
  item?: FormField;
  /** True when an array's elements are objects (rendered as a list of cards). */
  ofObjects?: boolean;
}

/**
 * A group of fields within a section.
 *
 * A block's payload is rarely one flat list of things. A chart has a
 * headline, axes, data and sourcing; a table has a body and a set of
 * behaviours. Groups give that shape to the form, so a payload of fifty
 * fields reads as a handful of things an editor recognises.
 */
export interface FormGroup {
  /** Stable id, unique within the section. */
  id: string;
  /** Human label for the group. */
  label: string;
  fields: FormField[];
}

/**
 * One part of a block's payload, with its own form.
 *
 * The sections are the block's own anatomy: what it says (`content`), how it
 * is presented (`presentation`), how it is described for readers who cannot
 * see it (`accessibility`), where it came from (`provenance`) and what it
 * cites (`citations`).
 */
export interface FormSection {
  /** Stable id, unique within the block. */
  id: string;
  /** Human label for the section. */
  label: string;
  /** A line of guidance shown under the section heading. */
  description?: string;
  /** The path in the payload the section's fields live under. */
  path: string;
  groups: FormGroup[];
}

interface ZodDef {
  typeName?: string;
  shape?: () => Record<string, z.ZodTypeAny>;
  type?: z.ZodTypeAny;
  options?: z.ZodTypeAny[];
  innerType?: z.ZodTypeAny;
  valueType?: z.ZodTypeAny;
  value?: unknown;
  values?: string[];
  checks?: Array<{ kind: string; value?: number; regex?: RegExp }>;
  defaultValue?: () => unknown;
}

function defOf(schema: z.ZodTypeAny): ZodDef {
  return schema._def as unknown as ZodDef;
}

function descriptionOf(schema: z.ZodTypeAny): string | undefined {
  const description = (schema as unknown as { description?: string }).description;
  return typeof description === 'string' && description.length > 0 ? description : undefined;
}

/** `xAxis` -> `X axis`, `sourceIds` -> `Source ids`. */
function humanize(key: string): string {
  const spaced = key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim();
  if (spaced.length === 0) return key;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Fields whose values are prose rather than a label. */
const LONG_TEXT_KEYS = new Set([
  'text',
  'body',
  'description',
  'caption',
  'quote',
  'methodology',
  'explanation',
  'content',
  'summary',
  'transcript',
  'note',
  'notes',
  'footer',
  'title',
  'label',
  'headline',
  'question',
  'answer',
  'claim',
  'report',
  'snippet',
  'altText',
  'reasoning',
  'insight',
]);

const LONG_TEXT_MAX = 400;

function isLongText(key: string, checks: ZodDef['checks']): boolean {
  if (LONG_TEXT_KEYS.has(key)) return true;
  const maxCheck = checks?.find((check) => check.kind === 'max');
  return typeof maxCheck?.value === 'number' && maxCheck.value >= LONG_TEXT_MAX;
}

function numberChecks(schema: z.ZodTypeAny): { min?: number; max?: number; step?: number } {
  const checks = defOf(schema).checks ?? [];
  const out: { min?: number; max?: number; step?: number } = {};
  for (const check of checks) {
    if (check.kind === 'min' && check.value !== undefined) out.min = check.value;
    if (check.kind === 'max' && check.value !== undefined) out.max = check.value;
    if (check.kind === 'multipleOf' && check.value !== undefined) out.step = check.value;
  }
  if (out.step === undefined && out.min !== undefined && out.max !== undefined) {
    out.step = Number((out.max - out.min).toFixed(4)) || 1;
  }
  return out;
}

function stringChecks(schema: z.ZodTypeAny): { min?: number; max?: number; format?: FieldFormat } {
  const checks = defOf(schema).checks ?? [];
  const out: { min?: number; max?: number; format?: FieldFormat } = {};
  for (const check of checks) {
    if (check.kind === 'min' && check.value !== undefined) out.min = check.value;
    if (check.kind === 'max' && check.value !== undefined) out.max = check.value;
    if (check.kind === 'url') out.format = 'url';
    if (check.kind === 'email') out.format = 'email';
    if (check.kind === 'datetime') out.format = 'date';
  }
  return out;
}

function literalValue(schema: z.ZodTypeAny): { value: unknown } | null {
  const def = defOf(schema);
  if (def.typeName !== 'ZodLiteral') return null;
  return { value: def.value };
}

/**
 * Build the field tree for a schema.
 *
 * The returned root is always an `object` field: the studio edits a block's
 * `data`, which is an object in every block type.
 */
export function buildFormFields(schema: z.ZodTypeAny): FormField {
  const field = toField(schema, 'data', true);
  if (!field) {
    return { key: 'data', label: 'Data', kind: 'json', required: true };
  }
  if (field.kind === 'object') return field;
  return { key: 'data', label: 'Data', kind: 'json', required: true };
}

/**
 * Build the field tree for a block's `data` payload.
 *
 * The registry stores the whole block envelope — `id`, `blockType`,
 * `sortOrder` and the `data` object — in one schema. The envelope is the
 * platform's bookkeeping and is not something an editor authors by hand, so
 * the form is generated from the `data` object alone.
 *
 * When a block type is given, the hints for that type are applied, so the
 * fields carry their groups, their guidance and their controls.
 */
export function buildDataFormFields(blockSchema: z.ZodTypeAny, blockType?: string): FormField {
  const dataSchema = shapeOf(blockSchema)?.data;
  if (!dataSchema) {
    return { key: 'data', label: 'Data', kind: 'json', required: true };
  }

  const dataField = toField(dataSchema, 'data', true);
  if (!dataField || dataField.kind !== 'object') {
    // A block type whose data is not a plain object is edited as raw JSON.
    return { key: 'data', label: 'Data', kind: 'json', required: true };
  }

  const fields = blockType
    ? applyHints(dataField.fields ?? [], blockType, 'data', true)
    : (dataField.fields ?? []);

  return { ...dataField, key: 'data', label: 'Data', fields };
}

/**
 * Build the form for a block, section by section.
 *
 * The sections are the block's own anatomy rather than one flat list of
 * fields. A block that says one thing, sits in the story in a particular
 * way, carries a text summary for screen readers and a methodology note for
 * the lawyers is four different kinds of edit, and they are edited apart.
 *
 * A section with no fields is left out entirely, so a block that has no
 * accessibility metadata does not show an empty accessibility section.
 */
export function buildBlockFormSections(
  blockType: string,
  blockSchema: z.ZodTypeAny
): FormSection[] {
  const shape = shapeOf(blockSchema);
  if (!shape) return [];

  const sections: FormSection[] = [];

  const content = sectionFrom(
    blockType,
    shape.data,
    'content',
    'Content',
    'What the block says.',
    'data'
  );
  if (content) sections.push(content);

  const presentation = sectionFrom(
    blockType,
    shape.presentation,
    'presentation',
    'Presentation',
    'How the block sits in the story.',
    'presentation'
  );
  if (presentation) sections.push(presentation);

  const accessibility = sectionFrom(
    blockType,
    shape.accessibility,
    'accessibility',
    'Accessibility',
    'For readers who cannot see the block, and for anyone searching for it.',
    'accessibility'
  );
  if (accessibility) sections.push(accessibility);

  const provenance = sectionFrom(
    blockType,
    shape.provenance,
    'provenance',
    'Provenance',
    'Where the content came from, and what it may be used for.',
    'provenance'
  );
  if (provenance) sections.push(provenance);

  const citations = citationSection(blockType, shape);
  if (citations) sections.push(citations);

  return sections;
}

/** The shape of a schema, when it is an object. */
function shapeOf(schema: z.ZodTypeAny): Record<string, z.ZodTypeAny> | null {
  const def = defOf(schema);
  if (def.typeName !== 'ZodObject') return null;
  return def.shape?.() ?? {};
}

/**
 * The schema inside an optional, default or nullable wrapper.
 *
 * The envelope's own fields are all optional, so `accessibility` is an
 * optional object rather than an object. Without unwrapping it, it would
 * look like something the form cannot edit.
 */
function unwrap(schema: z.ZodTypeAny): z.ZodTypeAny {
  const def = defOf(schema);
  if (def.innerType) return unwrap(def.innerType);
  return schema;
}

/** The children of an object schema, or none when it is not an object. */
function childrenOf(schema: z.ZodTypeAny | undefined): FormField[] {
  if (!schema) return [];
  const unwrapped = unwrap(schema);
  const def = defOf(unwrapped);
  if (def.typeName !== 'ZodObject') return [];
  const shape = def.shape?.() ?? {};
  const fields: FormField[] = [];
  for (const [childKey, childSchema] of Object.entries(shape)) {
    const child = toField(childSchema, childKey, isRequired(childSchema));
    if (child) fields.push(child);
  }
  return fields;
}

function sectionFrom(
  blockType: string,
  schema: z.ZodTypeAny | undefined,
  id: string,
  label: string,
  description: string,
  path: string
): FormSection | null {
  const children = childrenOf(schema);
  if (children.length === 0) return null;

  const hinted = applyHints(children, blockType, path, true);
  return { id, label, description, path, groups: buildGroups(label, hinted) };
}

/**
 * The citations section.
 *
 * The two lists of registered source ids sit at the root of the payload
 * rather than under a parent, so they are built from the envelope directly
 * instead of from an object schema.
 */
function citationSection(
  blockType: string,
  shape: Record<string, z.ZodTypeAny>
): FormSection | null {
  const fields: FormField[] = [];

  for (const key of ['citationIds', 'sourceIds']) {
    const schema = shape[key];
    if (!schema) continue;
    const field = toField(schema, key, isRequired(schema));
    if (field) fields.push(field);
  }

  if (fields.length === 0) return null;

  const hinted = applyHints(fields, blockType, '', true);
  return {
    id: 'citations',
    label: 'Citations',
    description: 'The registered sources this block draws on.',
    path: '',
    groups: buildGroups('Citations', hinted),
  };
}

/**
 * Group the fields of a section.
 *
 * A field with no group of its own stays in the section's default group,
 * which is dropped when every field has found a group. Groups appear in the
 * order their fields are first met, so the order follows the schema.
 */
function buildGroups(sectionLabel: string, fields: FormField[]): FormGroup[] {
  const groups: FormGroup[] = [];
  const byId = new Map<string, FormGroup>();

  for (const field of fields) {
    const id = field.group ?? 'default';
    let group = byId.get(id);
    if (!group) {
      group = { id, label: id === 'default' ? sectionLabel : id, fields: [] };
      byId.set(id, group);
      groups.push(group);
    }
    group.fields.push(field);
  }

  for (const group of groups) {
    group.fields = orderFields(group.fields);
  }

  return groups;
}

/**
 * Order the fields of a group.
 *
 * A field with an explicit order comes first, in that order; a field
 * without one keeps the order the schema gave it.
 */
function orderFields(fields: FormField[]): FormField[] {
  return fields
    .map((field, index) => ({ field, index }))
    .sort((a, b) => {
      const left = a.field.order ?? Number.MAX_SAFE_INTEGER;
      const right = b.field.order ?? Number.MAX_SAFE_INTEGER;
      if (left !== right) return left - right;
      return a.index - b.index;
    })
    .map((entry) => entry.field);
}

/** Join a hint path. An empty prefix means the path starts at the payload. */
function joinHintPath(prefix: string, key: string): string {
  return prefix.length === 0 ? key : `${prefix}.${key}`;
}

/**
 * Apply the hints for a block type to a field tree.
 *
 * The hint path is the field's path in the payload, with an array's indexes
 * written as `[]` — a hint covers every element of a list, not just the
 * first one.
 *
 * Groups and orders are only applied at the top level of a section: a field
 * nested inside an object or a list belongs to its parent, and giving it a
 * group of its own would pull it out of the object that holds it.
 */
function applyHints(
  fields: FormField[],
  blockType: string,
  hintPath: string,
  topLevel: boolean
): FormField[] {
  return fields.map((field) => {
    const path = joinHintPath(hintPath, field.key);
    const hint = hintFor(blockType, path);
    const next: FormField = { ...field };

    applyHintTo(next, hint, topLevel);

    if (field.kind === 'object') {
      next.fields = applyHints(field.fields ?? [], blockType, path, false);
    } else if (field.kind === 'array' && field.item) {
      const itemPath = `${path}[]`;
      const item = { ...field.item };
      applyHintTo(item, hintFor(blockType, itemPath), false);
      if (field.item.kind === 'object') {
        item.fields = applyHints(field.item.fields ?? [], blockType, itemPath, false);
      }
      next.item = item;
    }

    return next;
  });
}

/** Copy a hint's own properties onto a field. */
function applyHintTo(field: FormField, hint: FieldHint | undefined, topLevel: boolean): void {
  if (!hint) return;

  if (hint.label) field.label = hint.label;
  if (hint.help) field.help = hint.help;
  if (hint.control) field.control = hint.control;
  if (hint.unit) field.unit = hint.unit;
  if (hint.advanced) field.advanced = true;
  if (hint.visibleWhen) field.visibleWhen = hint.visibleWhen;

  if (topLevel) {
    if (hint.group) field.group = hint.group;
    if (hint.order !== undefined) field.order = hint.order;
  }
}

function toField(schema: z.ZodTypeAny, key: string, required: boolean): FormField | null {
  const def = defOf(schema);
  const base = {
    key,
    label: humanize(key),
    description: descriptionOf(schema),
    required,
  };

  switch (def.typeName) {
    case 'ZodObject': {
      const shape = def.shape?.() ?? {};
      const fields: FormField[] = [];
      for (const [childKey, childSchema] of Object.entries(shape)) {
        const child = toField(childSchema, childKey, isRequired(childSchema));
        if (child) fields.push(child);
      }
      return { ...base, kind: 'object', fields };
    }

    case 'ZodString': {
      const checks = stringChecks(schema);
      const long = isLongText(key, def.checks);
      return {
        ...base,
        kind: long ? 'textarea' : 'text',
        min: checks.min,
        max: checks.max,
        format: checks.format,
      };
    }

    case 'ZodNumber': {
      const checks = numberChecks(schema);
      return { ...base, kind: 'number', ...checks };
    }

    case 'ZodBoolean':
      return { ...base, kind: 'boolean' };

    case 'ZodEnum':
      return {
        ...base,
        kind: 'select',
        options: (def.values ?? []).map((value) => ({ value, label: humanize(value) })),
      };

    case 'ZodNativeEnum': {
      const values = Object.values((def.values ?? {}) as Record<string, string>);
      return {
        ...base,
        kind: 'select',
        options: values.map((value) => ({ value, label: humanize(value) })),
      };
    }

    case 'ZodLiteral': {
      const literal = literalValue(schema);
      return {
        ...base,
        kind: 'text',
        defaultValue: literal?.value,
      };
    }

    case 'ZodArray': {
      const element = def.type;
      if (!element) return { ...base, kind: 'json' };
      const item = toField(element, key, isRequired(element));
      if (!item) return { ...base, kind: 'json' };
      return {
        ...base,
        kind: 'array',
        item,
        ofObjects: item.kind === 'object',
      };
    }

    case 'ZodUnion':
    case 'ZodDiscriminatedUnion': {
      const options = def.options ?? [];
      const literals = options.map((option) => literalValue(option)).filter(Boolean) as {
        value: unknown;
      }[];
      if (literals.length === options.length && literals.length > 0) {
        return {
          ...base,
          kind: 'select',
          options: literals.map((literal) => ({
            value: String(literal.value),
            label: humanize(String(literal.value)),
          })),
        };
      }
      return { ...base, kind: 'json' };
    }

    case 'ZodRecord':
      return { ...base, kind: 'json' };

    case 'ZodOptional':
    case 'ZodNullable': {
      if (!def.innerType) return { ...base, kind: 'json', required: false };
      const inner = toField(def.innerType, key, false);
      return inner ? { ...inner, required: false } : { ...base, kind: 'json', required: false };
    }

    case 'ZodDefault': {
      if (!def.innerType) return { ...base, kind: 'json' };
      const inner = toField(def.innerType, key, false);
      if (!inner) return { ...base, kind: 'json' };
      const defaultValue = def.defaultValue?.();
      return { ...inner, required: false, defaultValue };
    }

    case 'ZodBranded': {
      if (!def.innerType) return { ...base, kind: 'json' };
      return toField(def.innerType, key, required) ?? { ...base, kind: 'json' };
    }

    case 'ZodEffects': {
      if (!def.innerType) return { ...base, kind: 'json' };
      const inner = toField(def.innerType, key, required);
      return inner ?? { ...base, kind: 'json' };
    }

    default:
      return { ...base, kind: 'json' };
  }
}

function isRequired(schema: z.ZodTypeAny): boolean {
  const typeName = defOf(schema).typeName;
  if (typeName === 'ZodOptional' || typeName === 'ZodDefault' || typeName === 'ZodNullable') {
    return false;
  }
  return true;
}
