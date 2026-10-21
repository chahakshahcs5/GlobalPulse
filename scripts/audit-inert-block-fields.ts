import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { listBlockDefinitions } from '@ai-news/schemas';

/**
 * Audit the block renderers for schema fields that are never read.
 *
 * A field the schema declares but the renderer ignores is a field an editor
 * can change in the Block Studio and see no effect — a promise the platform
 * makes and does not keep. This script finds them.
 *
 *   pnpm audit:fields
 *
 * The check is static: it looks for each field's name in the source of the
 * component that renders the block, and in the programmatic renderers in
 * `@ai-news/media` when the component uses one.
 */

const BLOCKS_DIR = join(process.cwd(), 'libs/blocks-ui/src/blocks');
const MEDIA_DIR = join(process.cwd(), 'libs/media/src');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith('.ts') || full.endsWith('.tsx')) out.push(full);
  }
  return out;
}

/** The data field names a block's schema declares. */
function dataFieldsOf(schema: unknown): string[] {
  const shape =
    (schema as { _def?: { shape?: () => Record<string, unknown> } })?._def?.shape?.() ?? {};
  const dataDef = (shape.data as { _def?: { typeName?: string; shape?: () => object } })?._def;
  if (dataDef?.typeName !== 'ZodObject') return [];
  return Object.keys(dataDef.shape?.() ?? {});
}

/** Split the dispatcher into the source of each `case 'type':` branch. */
function dispatcherCases(): Map<string, string> {
  const source = readFileSync(join(BLOCKS_DIR, 'BlockItem.tsx'), 'utf8');
  const cases = new Map<string, string>();

  const re = /case\s+'([a-z0-9_]+)'\s*:/g;
  const marks: { type: string; start: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(source)) !== null) {
    marks.push({ type: match[1], start: match.index });
  }

  for (let i = 0; i < marks.length; i++) {
    const end = i + 1 < marks.length ? marks[i + 1].start : source.length;
    cases.set(marks[i].type, source.slice(marks[i].start, end));
  }
  return cases;
}

const dispatcher = dispatcherCases();
const blockSources = new Map<string, string>(
  readdirSync(BLOCKS_DIR)
    .filter((file) => file.endsWith('.tsx'))
    .map((file) => [file, readFileSync(join(BLOCKS_DIR, file), 'utf8')])
);
const mediaSources = walk(MEDIA_DIR).map((file) => readFileSync(file, 'utf8'));

/**
 * The data properties a piece of source actually reads.
 *
 * A field only counts as used when it is read *off the data object* — a
 * property access (`data.legend`), an index (`data['legend']`), or a name
 * pulled out of it by destructuring. Matching the bare word would count
 * `showLegend` and `legendSvg` as a use of `legend`, which is exactly the
 * mistake this audit exists to catch.
 */
function readDataProperties(source: string): Set<string> {
  const properties = new Set<string>();

  // `data.title`, `chartData.title`, `mapData.title`, `block.data.title`.
  // The trailing `data` may be capitalised, as it is in the media renderers.
  for (const match of source.matchAll(/\b\w*data\??\.(\w+)/gi)) {
    properties.add(match[1]);
  }

  // `data['title']`
  for (const match of source.matchAll(/\b\w*data\??\[['"](\w+)['"]\]/gi)) {
    properties.add(match[1]);
  }

  // `const { title, subtitle } = data`. The braces must not contain further
  // braces, so a destructuring is not mistaken for an enclosing block.
  for (const match of source.matchAll(/\{([^{}]*)\}\s*=\s*[^;]*?\bdata\b/gi)) {
    for (const name of match[1].split(',')) {
      const cleaned = name
        .split(':')[0]
        .split('=')[0]
        .trim()
        .replace(/^\.\.\./, '');
      if (/^[A-Za-z_$][\w$]*$/.test(cleaned)) properties.add(cleaned);
    }
  }

  return properties;
}

const inert: string[] = [];

/*
 * The envelope's presentation options.
 *
 * A block's presentation — how wide it is, how it is aligned, which theme it
 * is drawn in — is read in one place: the wrapper around the renderers, in
 * `BlockItem.tsx`, and the layout it asks for is worked out in
 * `presentation.ts`. That is what lets one set of options apply to every
 * block type. It is also a promise the platform has to keep, so the fields
 * are checked here like the rest.
 */
const PRESENTATION_FIELDS = ['width', 'align', 'theme'];
const presentationSources = [
  readFileSync(join(BLOCKS_DIR, 'BlockItem.tsx'), 'utf8'),
  readFileSync(join(BLOCKS_DIR, 'presentation.ts'), 'utf8'),
].join('\n');

for (const field of PRESENTATION_FIELDS) {
  const used = new RegExp(`presentation[^\\n]*\\.${field}\\b`).test(presentationSources);
  if (!used) inert.push(`presentation :: ${field}`);
}

for (const definition of listBlockDefinitions()) {
  const fields = dataFieldsOf(definition.schema);
  if (fields.length === 0) continue;

  const branch = dispatcher.get(definition.type) ?? '';
  const sources: string[] = [branch];

  // The React view component the branch delegates to.
  for (const source of blockSources.values()) {
    for (const name of [...branch.matchAll(/<([A-Z][A-Za-z0-9]*)/g)].map((match) => match[1])) {
      if (new RegExp(`export const ${name}\\b`).test(source)) sources.push(source);
    }
  }

  // The programmatic renderers in `@ai-news/media`, when the view uses one.
  if (sources.some((source) => /Renderer|Model|VisualDiff/.test(source))) {
    sources.push(...mediaSources);
  }

  const read = new Set<string>();
  for (const source of sources) {
    for (const property of readDataProperties(source)) read.add(property);
  }

  for (const field of fields) {
    if (!read.has(field)) inert.push(`${definition.type} :: ${field}`);
  }
}

if (inert.length === 0) {
  console.log('Every schema field is read by a renderer.');
  process.exit(0);
}

console.log(`Inert schema fields (declared but never read by a renderer): ${inert.length}\n`);
for (const entry of inert) console.log(`  ${entry}`);
console.log('\nAn inert field can be edited in the Block Studio with no visible effect.');
process.exitCode = 1;
