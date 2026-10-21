import { z } from 'zod';

/**
 * Turn a Zod schema into a tree of form fields.
 *
 * The Block Studio edits a block's `data` payload through an automatically
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
  /** The schema's own description, when it carries one. */
  description?: string;
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
  /** Children of an `object` field. */
  fields?: FormField[];
  /** The element descriptor of an `array` field. */
  item?: FormField;
  /** True when an array's elements are objects (rendered as a list of cards). */
  ofObjects?: boolean;
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
 */
export function buildDataFormFields(blockSchema: z.ZodTypeAny): FormField {
  const def = defOf(blockSchema);
  if (def.typeName === 'ZodObject') {
    const shape = def.shape?.() ?? {};
    const dataSchema = shape.data;
    if (dataSchema) {
      const dataField = toField(dataSchema, 'data', true);
      if (dataField && dataField.kind === 'object') {
        return { ...dataField, key: 'data', label: 'Data' };
      }
    }
  }
  // A block type whose data is not a plain object is edited as raw JSON.
  return { key: 'data', label: 'Data', kind: 'json', required: true };
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
