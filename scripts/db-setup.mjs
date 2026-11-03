#!/usr/bin/env node
/**
 * Cross-platform database bootstrap.
 *
 * `prisma db push` uses the native schema engine, so it is a *development
 * machine* task (Windows/Linux), never a Termux task. The phone only consumes
 * the committed generated client.
 *
 *   node scripts/db-setup.mjs                 # push schema + bootstrap rows
 *   node scripts/db-setup.mjs --push-only
 *   node scripts/db-setup.mjs --seed-only
 *   node scripts/db-setup.mjs --accept-data-loss
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

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Copy .env.windows.example to .env and edit it.');
  process.exit(1);
}

const args = process.argv.slice(2);
const pushOnly = args.includes('--push-only');
const seedOnly = args.includes('--seed-only');
const acceptDataLoss = args.includes('--accept-data-loss');

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

function run(pnpmArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(pnpm, pnpmArgs, {
      cwd: ROOT,
      env: process.env,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`Command failed with exit code ${code}`))
    );
  });
}

async function main() {
  if (!seedOnly) {
    const pushArgs = [
      '--filter',
      '@ai-news/database',
      'exec',
      'prisma',
      'db',
      'push',
      '--schema=prisma/schema.prisma',
      '--skip-generate',
    ];
    if (acceptDataLoss) pushArgs.push('--accept-data-loss');
    console.log('[db] pushing schema to DATABASE_URL...');
    await run(pushArgs);
  }

  if (!pushOnly) {
    console.log('[db] applying bootstrap.sql...');
    await run([
      '--filter',
      '@ai-news/database',
      'exec',
      'prisma',
      'db',
      'execute',
      '--schema=prisma/schema.prisma',
      '--file=prisma/bootstrap.sql',
    ]);
  }

  console.log('[db] done.');
}

main().catch((error) => {
  console.error(`[db] ${error.message}`);
  process.exit(1);
});
