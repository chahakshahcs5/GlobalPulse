#!/usr/bin/env node
/**
 * Regenerates the committed Prisma client and checks the artifact.
 *
 * Run on Windows/Linux only — Termux never runs this. The output is committed
 * so the phone only needs the pure-JS/WASM files.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const ROOT = process.cwd();
const OUTPUT = join(ROOT, 'libs', 'database', 'generated', 'client');
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

const result = spawnSync(
  pnpm,
  ['--filter', '@ai-news/database', 'exec', 'prisma', 'generate', '--schema=prisma/schema.prisma'],
  { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' }
);
if (result.status !== 0) process.exit(result.status ?? 1);

const TEXT_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.ts', '.json', '.prisma']);
const BINARY_EXTENSIONS = new Set(['.node', '.so', '.dll', '.exe', '.dylib']);
let normalized = 0;
const binaries = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(path);
      continue;
    }
    const ext = extname(entry.name);
    if (BINARY_EXTENSIONS.has(ext)) binaries.push(path);
    if (TEXT_EXTENSIONS.has(ext)) {
      const source = readFileSync(path, 'utf8');
      if (source.includes('\r\n')) {
        writeFileSync(path, source.replace(/\r\n/g, '\n'), 'utf8');
        normalized++;
      }
    }
  }
}

if (!existsSync(OUTPUT)) {
  console.error(`Generated client not found at ${OUTPUT}`);
  process.exit(1);
}
walk(OUTPUT);

if (binaries.length > 0) {
  console.error('Generated client contains native binaries, which breaks Termux:');
  for (const path of binaries) console.error(`  ${path}`);
  process.exit(1);
}

console.log(
  `Prisma client generated at libs/database/generated/client (${normalized} text file(s) normalised to LF, no native binaries).`
);
