#!/usr/bin/env node
/**
 * Cross-platform `next dev` launcher.
 *
 * Next's CLI reads PORT, but the API also uses PORT. This launcher maps
 * WEB_PORT (default 3002) to Next's `-p` flag so both can run in one process
 * tree without one overwriting the other.
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { existsSync } from 'node:fs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APP_DIR = join(ROOT, 'apps', 'web');
for (const name of ['.env.local', '.env']) {
  const path = join(ROOT, name);
  if (existsSync(path)) dotenv.config({ path });
}

const port = process.env.WEB_PORT || process.env.NEXT_DEV_PORT || '3002';
const host = process.env.WEB_HOST || '127.0.0.1';

const require = createRequire(join(APP_DIR, 'package.json'));
const nextBin = require.resolve('next/dist/bin/next');

const child = spawn(process.execPath, [nextBin, 'dev', '-p', port, '-H', host], {
  cwd: APP_DIR,
  env: process.env,
  stdio: 'inherit',
});
child.on('exit', (code) => process.exit(code ?? 1));
for (const signal of ['SIGINT', 'SIGTERM', 'SIGBREAK']) {
  process.once(signal, () => child.kill(signal));
}
