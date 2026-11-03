#!/usr/bin/env node
/**
 * Case-sensitive import check.
 *
 * Windows resolves `./Components/Foo` even when the file is `components/foo`,
 * but Linux (and Termux) do not. This walks every first-party import and
 * verifies that each path segment matches the on-disk name exactly.
 *
 * It is deliberately dependency-free so it runs before `pnpm install`.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';

const ROOT = process.cwd();
const SEARCH_DIRS = ['apps', 'libs', 'scripts', 'tests'];
const SKIP_DIRS = new Set([
  'node_modules',
  '.next',
  'dist',
  'build',
  'coverage',
  '.nx',
  '.turbo',
  'generated',
]);
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const RESOLVE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json'];
const IMPORT_PATTERN = /(?:from\s*|import\s*\(\s*|require\s*\(\s*)['"]([^'"]+)['"]/g;

function walk(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(join(dir, entry.name), files);
    } else if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name))) {
      files.push(join(dir, entry.name));
    }
  }
  return files;
}

function isRelative(specifier) {
  return specifier.startsWith('./') || specifier.startsWith('../');
}

/** Resolve a relative specifier the way TypeScript/Node would, preferring TS. */
function resolveCandidate(fromFile, specifier) {
  const base = resolve(dirname(fromFile), specifier);
  const withoutJs = base.replace(/\.(m|c)?jsx?$/, '');

  const candidates = [base];
  if (withoutJs !== base) {
    for (const ext of RESOLVE_EXTENSIONS) candidates.push(withoutJs + ext);
  } else {
    for (const ext of RESOLVE_EXTENSIONS) candidates.push(base + ext);
  }
  for (const ext of RESOLVE_EXTENSIONS) candidates.push(join(base, `index${ext}`));
  return candidates.find((candidate) => existsSync(candidate));
}

/** True when every path segment matches the directory listing's casing. */
function hasExactCase(absolutePath) {
  const parts = relative(ROOT, absolutePath).split(sep).filter(Boolean);
  let current = ROOT;
  for (const part of parts) {
    if (!existsSync(current)) return false;
    const names = readdirSync(current);
    if (!names.includes(part)) return false;
    current = join(current, part);
  }
  return true;
}

const files = SEARCH_DIRS.flatMap((dir) => walk(join(ROOT, dir)));
const problems = [];

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  IMPORT_PATTERN.lastIndex = 0;
  let match;
  while ((match = IMPORT_PATTERN.exec(source)) !== null) {
    const specifier = match[1];
    if (!isRelative(specifier)) continue;

    const resolved = resolveCandidate(file, specifier);
    if (!resolved) continue; // tsc reports genuinely missing modules.
    if (!statSync(resolved).isFile()) continue;
    if (!hasExactCase(resolved)) {
      problems.push({
        file: relative(ROOT, file),
        specifier,
        resolved: relative(ROOT, resolved),
      });
    }
  }
}

if (problems.length > 0) {
  console.error('Case-sensitive import mismatches:');
  for (const problem of problems) {
    console.error(`  ${problem.file}: "${problem.specifier}" resolves to ${problem.resolved}`);
  }
  console.error(
    `\n${problems.length} mismatch(es). Rename the import or the file so Linux/Termux can resolve it.`
  );
  process.exit(1);
}

console.log(`Import casing OK (${files.length} source files checked).`);
