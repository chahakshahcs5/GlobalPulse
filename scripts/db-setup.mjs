#!/usr/bin/env node
/**
 * Cross-platform database bootstrap.
 *
 * Production deployments apply the committed Prisma migrations with
 * `prisma migrate deploy`. `db push` is available only as an explicit local
 * convenience (`--push`) because it bypasses the migration history.
 *
 *   node scripts/db-setup.mjs                 # migrate deploy + bootstrap rows
 *   node scripts/db-setup.mjs --migrate-only  # migrate deploy only
 *   node scripts/db-setup.mjs --seed-only     # bootstrap rows only
 *   node scripts/db-setup.mjs --push          # local-only: db push instead
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
const migrateOnly = args.includes('--migrate-only') || args.includes('--push-only');
const seedOnly = args.includes('--seed-only');
const acceptDataLoss = args.includes('--accept-data-loss');
const usePush = args.includes('--push');

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
    if (usePush) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('db push is disabled in production; use migrate deploy.');
      }
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
      console.log('[db] pushing schema to DATABASE_URL (local only)...');
      await run(pushArgs);
    } else {
      console.log('[db] applying committed migrations with prisma migrate deploy...');
      await run([
        '--filter',
        '@ai-news/database',
        'exec',
        'prisma',
        'migrate',
        'deploy',
        '--schema=prisma/schema.prisma',
      ]);
    }
  }

  if (!migrateOnly) {
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
