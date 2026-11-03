#!/usr/bin/env node
/**
 * Guardrail for the Windows + Termux promise.
 *
 * Flags shell-isms in package scripts and POSIX-only paths in first-party
 * source. It is not a general linter; it only enforces rules this repository
 * has committed to.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const ROOT = process.cwd();
const SKIP_DIRS = new Set([
  'node_modules',
  '.next',
  'dist',
  'build',
  'coverage',
  '.nx',
  '.turbo',
  'generated',
  'playwright-report',
  'test-results',
]);
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const SCAN_DIRS = ['apps', 'libs', 'scripts'];

const problems = [];

function walk(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(join(dir, entry.name), files);
    } else if (entry.isFile()) {
      files.push(join(dir, entry.name));
    }
  }
  return files;
}

function report(file, message) {
  problems.push(`${relative(ROOT, file)}: ${message}`);
}

// 1. npm scripts must not use shell env prefixes or POSIX file utilities.
const manifests = [
  join(ROOT, 'package.json'),
  ...walk(join(ROOT, 'apps')).filter((file) => file.endsWith('package.json')),
  ...walk(join(ROOT, 'libs')).filter((file) => file.endsWith('package.json')),
];
const shellPrefix = /^\s*[A-Za-z_][A-Za-z0-9_]*=\S/;
const posixCommands = /(^|[\s;&|])(rm|cp|mv|sed|chmod|chown|ln)\s+-/;

for (const manifest of manifests) {
  const json = JSON.parse(readFileSync(manifest, 'utf8'));
  for (const [name, script] of Object.entries(json.scripts ?? {})) {
    if (typeof script !== 'string') continue;
    if (shellPrefix.test(script)) {
      report(manifest, `script "${name}" starts with a shell env prefix; use cross-env`);
    }
    if (posixCommands.test(script)) {
      report(manifest, `script "${name}" uses a POSIX file command; use a Node script`);
    }
    if (script.includes('$(')) {
      report(manifest, `script "${name}" uses command substitution`);
    }
  }
}

// 2. First-party source must not hardcode POSIX temp/home paths or old ports.
const patterns = [
  { regex: /(^|[^A-Za-z])['"`]\/tmp(\/|['"`])/, message: 'uses /tmp; use os.tmpdir()' },
  { regex: /['"`]\/home\//, message: 'uses /home; use os.homedir()' },
  { regex: /localhost:300\d/, message: 'hardcodes a localhost:300x URL' },
  { regex: /127\.0\.0\.1:300\d/, message: 'hardcodes a 127.0.0.1:300x URL' },
  { regex: /[A-Za-z]:\\(?![ntr])[A-Za-z]/, message: 'hardcodes a Windows drive path' },
];

for (const file of SCAN_DIRS.flatMap((dir) => walk(join(ROOT, dir)))) {
  if (!SOURCE_EXTENSIONS.has(extname(file))) continue;
  const source = readFileSync(file, 'utf8');
  for (const { regex, message } of patterns) {
    if (regex.test(source)) report(file, message);
  }
}

// 3. Dockerfile RUN lines must not prefix commands with shell variables.
for (const file of walk(join(ROOT, 'apps')).filter((name) => name.endsWith('Dockerfile'))) {
  const source = readFileSync(file, 'utf8');
  for (const line of source.split(/\r?\n/)) {
    if (/^\s*RUN\s+[A-Za-z_][A-Za-z0-9_]*=/.test(line)) {
      report(file, 'RUN starts with a shell env prefix; use ENV before RUN');
    }
  }
}

if (problems.length > 0) {
  console.error('Portability check failed:');
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log('Portability check OK.');
