#!/usr/bin/env node
/**
 * Cross-platform development stack.
 *
 * Starts the API, MCP server, web portal, Block Studio and worker with one
 * command on Windows, Linux and Termux. All ports come from the environment
 * (with local defaults); nothing here assumes a Unix shell.
 *
 *   node scripts/dev.mjs                    # everything
 *   node scripts/dev.mjs --only=api,web     # a subset
 *   node scripts/dev.mjs --no-worker        # skip the worker
 *   node scripts/dev.mjs --list             # show the plan
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
for (const name of ['.env.local', '.env']) {
  const path = join(ROOT, name);
  if (existsSync(path)) dotenv.config({ path });
}

const DEFAULTS = {
  api: 4000,
  mcp: 4001,
  web: 3002,
  studio: 3003,
};
const ENV_KEYS = { api: 'PORT', mcp: 'MCP_PORT', web: 'WEB_PORT', studio: 'STUDIO_PORT' };

const args = process.argv.slice(2);
const onlyArg = args.find((arg) => arg.startsWith('--only='));
const only = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',')) : null;
const excluded = new Set(
  args.filter((arg) => arg.startsWith('--no-')).map((arg) => arg.slice('--no-'.length))
);

const services = [
  { name: 'api', filter: '@ai-news/api', port: 'PORT' },
  { name: 'mcp', filter: '@ai-news/mcp-server', port: 'MCP_PORT' },
  { name: 'worker', filter: '@ai-news/worker', port: null },
  { name: 'web', filter: '@ai-news/web', port: 'WEB_PORT' },
  { name: 'studio', filter: '@ai-news/block-studio-app', port: 'STUDIO_PORT' },
];

const selected = services.filter(
  (service) => (!only || only.has(service.name)) && !excluded.has(service.name)
);

for (const service of selected) {
  if (service.port && !process.env[service.port]) {
    process.env[service.port] = String(DEFAULTS[service.name]);
  }
}
process.env.API_INTERNAL_URL ??= `http://127.0.0.1:${process.env.PORT || DEFAULTS.api}`;
process.env.NEXT_PUBLIC_API_URL ??= `http://127.0.0.1:${process.env.PORT || DEFAULTS.api}`;

if (args.includes('--list')) {
  for (const service of selected) {
    const port = service.port ? process.env[service.port] : '(no port)';
    console.log(`${service.name.padEnd(7)} ${service.filter.padEnd(24)} ${port}`);
  }
  process.exit(0);
}

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const mode = args.includes('--prod') ? 'start' : 'dev';
const children = [];
let shuttingDown = false;

function start(service) {
  const env = { ...process.env };
  if (service.name === 'web') {
    // The API also owns PORT. Give the web child its own mapping so both
    // processes can run in the same terminal.
    env.PORT = env.WEB_PORT || String(DEFAULTS.web);
    env.WEB_PORT = env.PORT;
  }
  if (service.name === 'studio') {
    // The studio also reads PORT. Its own dev script pins 3003, but the
    // production start (`next start`) needs the value from here.
    env.PORT = env.STUDIO_PORT || String(DEFAULTS.studio);
  }
  const command = [pnpm, '--filter', service.filter, mode];
  console.log(`[dev] starting ${service.name} (${command.join(' ')})`);
  const child = spawn(command[0], command.slice(1), {
    cwd: ROOT,
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    detached: process.platform !== 'win32',
  });
  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    if (code !== 0 || signal) {
      console.error(`[dev] ${service.name} exited (${signal || code}). Stopping the stack.`);
      shutdown(code ?? 1);
    }
  });
  children.push(child);
}

function killTree(child) {
  if (!child.pid) return;
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      child.kill('SIGTERM');
    }
  }
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) killTree(child);
  setTimeout(() => process.exit(code), 500);
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGBREAK']) {
  process.once(signal, () => {
    console.log(`\n[dev] ${signal}. Stopping the stack...`);
    shutdown(0);
  });
}

for (const service of selected) start(service);

for (const service of selected) {
  if (!service.port) continue;
  const label =
    service.name === 'mcp'
      ? `http://localhost:${process.env[service.port]}/mcp`
      : `http://localhost:${process.env[service.port]}`;
  console.log(`[dev] ${service.name.padEnd(7)} ${label}`);
}

console.log('[dev] Ctrl+C stops every service.');
