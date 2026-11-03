/**
 * Verifies the Prisma driver-adapter path end to end.
 *
 * Run on a developer machine or on a phone:
 *   pnpm db:check
 *
 * It prints the configured host (never the password) and the result of
 * `SELECT 1`. A failure here means the database is unreachable or the
 * committed generated client is stale.
 */
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { dirname, join } from 'path';

function loadRootEnv(): void {
  let dir = process.cwd();
  for (;;) {
    const candidate = join(dir, '.env');
    if (existsSync(candidate)) {
      dotenv.config({ path: candidate });
      return;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  dotenv.config();
}

loadRootEnv();

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env first.');
  }

  const { prismaManager } = await import('@ai-news/database');
  const client = await prismaManager.getClient();
  if (!client) {
    throw new Error(
      'PrismaClient was not created. Check DATABASE_ENGINE; set it to "prisma" to require a real connection.'
    );
  }

  const rows = await client.$queryRaw`SELECT 1 AS ok`;
  const target = new URL(databaseUrl);
  console.log(
    `SELECT 1 OK against ${target.hostname}:${target.port || '5432'}${target.pathname} -> ${JSON.stringify(rows)}`
  );
  await prismaManager.disconnect();
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Database check failed: ${message}`);
  process.exit(1);
});
