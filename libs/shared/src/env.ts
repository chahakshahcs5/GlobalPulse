/**
 * Loads `.env` without relying on a shell, so it works identically in
 * PowerShell, cmd.exe and Termux's bash.
 *
 * Values are read literally by dotenv: a value such as `A=$B` is not expanded,
 * which is why `.env.example` documents every variable with a concrete value
 * instead of shell syntax.
 */
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { dirname, join, resolve } from 'path';

let loaded = false;

export function loadEnv(): void {
  if (loaded) return;
  loaded = true;

  const explicit = process.env.ENV_FILE;
  if (explicit) {
    const path = resolve(explicit);
    if (existsSync(path)) {
      dotenv.config({ path });
      return;
    }
  }

  // Walk up from the current package directory. `pnpm --filter ... start`
  // runs in apps/<name>, while a root `node scripts/dev.mjs` runs at the repo
  // root; both should find the same file.
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

  // No file found: dotenv is still called so the process behaves the same as
  // one with an empty .env (existing environment variables always win).
  dotenv.config();
}
