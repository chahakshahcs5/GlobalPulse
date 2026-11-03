#!/usr/bin/env node
/**
 * Starts the Next.js portal in production mode on any platform.
 *
 * If a standalone build exists it runs `.next/standalone/.../server.js`;
 * otherwise it falls back to `next start`. In both cases `$PORT` is honoured.
 *
 * This is what Windows, Termux and phleet should call:
 *   node scripts/start-web.mjs
 */
import { spawn } from 'node:child_process';
import { cpSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APP_DIR = join(ROOT, 'apps', 'web');
for (const name of ['.env.local', '.env']) {
  const path = join(ROOT, name);
  if (existsSync(path)) dotenv.config({ path });
}

const port = process.env.WEB_PORT || process.env.PORT || '3002';
const host = process.env.HOST || process.env.HOSTNAME || '0.0.0.0';
process.env.PORT = port;
process.env.HOSTNAME = host;
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const standaloneRoot = join(APP_DIR, '.next', 'standalone');
const serverCandidates = [
  process.env.NEXT_STANDALONE_SERVER,
  join(standaloneRoot, 'apps', 'web', 'server.js'),
  join(standaloneRoot, 'server.js'),
].filter(Boolean);

const server = serverCandidates.find((candidate) => existsSync(candidate));

function copyIfMissing(from, to) {
  if (!existsSync(from) || existsSync(to)) return;
  cpSync(from, to, { recursive: true });
}

if (server) {
  const standaloneApp = dirname(server);
  // `output: 'standalone'` intentionally leaves static assets out of the trace.
  copyIfMissing(join(APP_DIR, '.next', 'static'), join(standaloneApp, '.next', 'static'));
  copyIfMissing(join(APP_DIR, 'public'), join(standaloneApp, 'public'));
  copyIfMissing(join(APP_DIR, 'public'), join(standaloneRoot, 'public'));

  console.log(`[web] standalone server on ${host}:${port} (${server})`);
  const child = spawn(process.execPath, [server], {
    cwd: standaloneApp,
    env: process.env,
    stdio: 'inherit',
  });
  child.on('exit', (code) => process.exit(code ?? 1));
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGBREAK']) {
    process.once(signal, () => child.kill(signal));
  }
} else {
  const require = createRequire(join(APP_DIR, 'package.json'));
  const nextBin = require.resolve('next/dist/bin/next');
  console.log(`[web] next start on ${host}:${port} (no standalone build found)`);
  const child = spawn(process.execPath, [nextBin, 'start', '-p', port, '-H', host], {
    cwd: APP_DIR,
    env: process.env,
    stdio: 'inherit',
  });
  child.on('exit', (code) => process.exit(code ?? 1));
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGBREAK']) {
    process.once(signal, () => child.kill(signal));
  }
}
