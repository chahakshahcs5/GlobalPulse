#!/usr/bin/env node
/**
 * Install-time hook.
 *
 * A source tarball or a CI checkout may not contain `.git` (Termux verification
 * trees often do not). Husky is only useful in a real working copy, so skip it
 * instead of failing the whole install.
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const huskyBin = join(ROOT, 'node_modules', 'husky', 'bin.js');

if (process.env.HUSKY === '0' || !existsSync(join(ROOT, '.git')) || !existsSync(huskyBin)) {
  console.log('prepare: no git working copy or husky binary; skipping husky.');
  process.exit(0);
}

const result = spawnSync(process.execPath, [huskyBin], {
  cwd: ROOT,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
