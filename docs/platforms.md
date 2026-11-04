# Running GlobalPulse on Windows and Termux

This repository is built to run from the **same commit and the same lockfile** in two
places:

|               | Windows developer machine                       | Termux on non-root Android                           |
| ------------- | ----------------------------------------------- | ---------------------------------------------------- |
| OS / libc     | Windows 10/11, win32-x64                        | Android arm64, bionic (`$PREFIX`)                    |
| Node          | 20.x (verified 20.19.5)                         | Termux `nodejs-lts` (>=20; verified 24.22 and 26.12) |
| pnpm          | 10.x                                            | 10.x                                                 |
| Database      | PostgreSQL over TCP                             | PostgreSQL over loopback TCP                         |
| Redis         | Redis/Memurai over TCP                          | Redis over loopback TCP                              |
| Prisma engine | **none** — driver adapter + WASM query compiler | **none** — same code                                 |
| Next.js SWC   | native Windows binary                           | WASM fallback, or a standalone build made on Windows |

There is no proot, chroot, Docker, systemd, root, Unix socket, or glibc dependency on the
phone. Nothing in `apps/` or `libs/` forks per platform; platform differences are limited to
environment values and which optional native package the package manager installs.

Last verified with: Windows 11 + Node 20.19.5 + pnpm 10.34.9 + PostgreSQL 16, and Termux
(Android 10, arm64) + Node 24.22.2 / 26.12.1 + pnpm 10.34.9 + PostgreSQL 18.6 + Redis 8.10.3.
On the phone the Next.js portal was built with the WASM/webpack path and served from
`.next/standalone`, with `/health` proxied to the API.

The rule that keeps this honest:

> `node_modules` is never copied between machines. Run `pnpm install` on each OS so
> esbuild (and Next/SWC where available) resolve to that platform's binary.

---

## 1. Prerequisites

### Windows

- Node 20.x (`nvm-windows`, `fnm`, or the official installer)
- pnpm 10: `npm install -g pnpm@10`
- PostgreSQL 16, 17 or 18, running on `localhost:5432`
- Redis (Memurai, WSL, Docker, or a native build) on `localhost:6379`
- Git for Windows

Optional: Docker Desktop if you prefer `pnpm docker:up` for Postgres and Redis. Docker is
not required.

### Termux (non-root)

```sh
pkg update
pkg install nodejs-lts git
npm install -g pnpm@10
```

PostgreSQL and Redis are installed as ordinary Termux packages, not system services:

```sh
pkg install postgresql redis
```

Do **not** install `proot-distro`, a glibc environment, or Android root. None are needed.

---

## 2. Windows: first run

From the repository root, in PowerShell:

```powershell
Copy-Item .env.windows.example .env

pnpm install
pnpm db:setup        # prisma db push + bootstrap.sql (native schema engine)
pnpm db:check        # SELECT 1 through the Prisma driver adapter
pnpm dev             # api + mcp + worker + web + block studio
```

`pnpm dev` prints the service URLs and stops every child on Ctrl+C. `scripts/dev.ps1` is a
thin wrapper around the same Node script if you prefer PowerShell:

```powershell
.\scripts\dev.ps1 --only=api,web
```

Start services individually when you want separate terminals:

```powershell
pnpm dev:api         # PORT=4000
pnpm dev:mcp         # MCP_PORT=4001
pnpm dev:worker      # no listening port
pnpm dev:web         # WEB_PORT=3002
pnpm dev:studio      # STUDIO_PORT=3003
```

The production web server:

```powershell
pnpm --filter @ai-news/web build
$env:WEB_PORT = "3002"
pnpm start:web       # scripts/start-web.mjs -> standalone server.js, honours PORT/WEB_PORT
```

The portal's API address comes from `NEXT_PUBLIC_API_URL`; server-side rewrites use
`API_INTERNAL_URL` first. `NEXT_PUBLIC_*` values are inlined at build time, so build with the
public API/MCP URLs that the phone will serve.

### PostgreSQL on Windows

Any of these is fine:

- the EnterpriseDB installer (creates a Windows service),
- the `pgvector/pgvector:pg16` image from `docker-compose.yml`,
- a Postgres instance on another host.

Create the database once:

```sql
CREATE DATABASE ai_news;
```

Then put the matching URL in `.env`:

```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_news?schema=public
```

Windows Postgres uses TCP. There is no Unix socket path to configure.

---

## 3. Termux: first run

Use the same repository and lockfile. Clone it (or copy the source **without**
`node_modules`), then:

```sh
cd ~/projects/ai-news-generator
cp .env.termux.example .env
pnpm install --frozen-lockfile
```

What happens during install:

- pnpm reads `onlyBuiltDependencies: [esbuild]` from `pnpm-workspace.yaml`.
- esbuild downloads the `android-arm64` binary used by `tsx`.
- Prisma, nx, msgpackr-extract and other build scripts are **not** run. No native Prisma
  engine is downloaded.
- `libs/database/generated/client` is already in git, so the phone never runs
  `prisma generate`.

The install prints `Ignored build scripts: @prisma/client, @prisma/engines, msgpackr-extract,
nx, prisma`. That is expected — do **not** run `pnpm approve-builds` on the phone.

Start PostgreSQL once (non-root, under `$HOME`):

```sh
mkdir -p ~/.local/share/globalpulse
initdb -D ~/.local/share/globalpulse/pgdata \
  --username=globalpulse --auth=trust --encoding=UTF8
pg_ctl -D ~/.local/share/globalpulse/pgdata \
  -l ~/.local/share/globalpulse/postgres.log \
  -o "-p 5432 -h 127.0.0.1" start

createdb -h 127.0.0.1 -p 5432 -U globalpulse globalpulse
```

Redis:

```sh
mkdir -p ~/.local/share/globalpulse/redis
redis-server --port 6379 --bind 127.0.0.1 \
  --dir ~/.local/share/globalpulse/redis --daemonize yes
```

The database starts empty. Apply the schema from Windows (or another machine that has the
native schema engine) against the phone's `DATABASE_URL`. On the phone you can also point
`DATABASE_URL` at a Postgres addon provided by phleet:

```sh
pnpm db:check
```

This prints `SELECT 1 OK ...` through `@prisma/adapter-pg` and the WASM query compiler.

Run the services (all ports and URLs come from `.env`):

```sh
pnpm --filter @ai-news/api start          # PORT
pnpm --filter @ai-news/mcp-server start   # MCP_PORT
pnpm --filter @ai-news/worker start       # no port
pnpm start:web                            # PORT
```

`PORT=4000 cmd` is shell syntax, not npm script syntax. Put the value in `.env` instead.
The cross-platform stack launcher reads the same file:

```sh
node scripts/dev.mjs
```

> The task description uses Node 20.x. Termux's current `nodejs` package is newer than 20;
> the repository declares `node >=20.9.0 <27` and is verified on the installed Termux Node
> as well as Node 20.19.5 on Windows. The important part is that no glibc-native package is
> required on the phone.

### Termux schema changes

Do **not** run `prisma db push` or `prisma generate` on the phone. They need the native
schema/query engine. Instead:

1. On Windows, edit `libs/database/prisma/schema.prisma`.
2. On Windows, run `pnpm db:generate` (updates `libs/database/generated/client`) and
   `pnpm db:setup --accept-data-loss` against the target database.
3. Commit the schema and generated client.
4. On the phone, `git pull` and restart the services. No generate step runs.

The generated client is checked for platform binaries; the only `.wasm` file is the query
compiler, which runs on both platforms.

---

## 4. Next.js on both platforms

`apps/web/next.config.mjs` sets `output: 'standalone'` and disables Next image optimisation
(`images: { unoptimized: true }`) because the portal does not use `next/image`. That keeps
the native `sharp` optional dependency out of the runtime path on Termux. That gives two
deployment paths:

### Build on Windows (recommended on the phone)

```powershell
pnpm --filter @ai-news/web build
```

The standalone tree lands in `apps/web/.next/standalone`. `pnpm start:web` runs it with
`WEB_PORT` (or `PORT` when `WEB_PORT` is unset), copies `.next/static` and `public` into the
standalone directory if they are missing, and falls back to `next start` when no standalone
build exists.

To ship it to the phone, copy `apps/web/.next/standalone`, `.next/static`, and `public`
(or just run the same `pnpm start:web` after copying the built `.next` directory). Never
copy `node_modules`; the standalone server carries the traced dependencies it needs.

### Build on Termux with WASM SWC

`@next/swc-wasm-nodejs` is an optional dependency in `apps/web/package.json`. Turbopack has
no `android/arm64` native binding and fails immediately, so the phone must use the webpack
pipeline, which can run on the WASM SWC package:

```sh
pnpm --filter @ai-news/web build:webpack
pnpm start:web
```

On the test phone this compiled in about six minutes (plus 83 seconds for Next's TypeScript
step), so it is usable for verification but slower than building on Windows.

If the build is impractically slow, stop and use the Windows-built standalone tree. This is
an accepted deployment path, not a fork.

### Ports

- `pnpm dev:web` uses `WEB_PORT` (default 3002) through `scripts/web-dev.mjs`.
- `scripts/start-web.mjs` uses `WEB_PORT`, then `PORT`, then 3002. A phleet-managed web
  service normally gets only `PORT`, so leave `WEB_PORT` unset there.
- The Block Studio uses `PORT=3003` in development and also honours `PORT` in production.

---

## 5. Database: driver adapter + query compiler

`libs/database/prisma/schema.prisma` generates into the repository:

```prisma
generator client {
  provider        = "prisma-client-js"
  output          = "../generated/client"
  engineType      = "client"
  previewFeatures = ["fullTextSearchPostgres"]
}
```

`engineType = "client"` is the Prisma 6.19 switch that enables the driver-adapter + WASM
query-compiler path. `driverAdapters` / `queryCompiler` are no longer separate preview flags
in 6.19 (Prisma prints deprecation warnings if you add them).

`libs/database/src/client/prisma-client.ts` creates:

```ts
new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString })) });
```

There is no `query_engine-*.node`, `libquery_engine-*`, or `schema-engine-*` in the committed
generated client, and no `postinstall: prisma generate` in `libs/database/package.json`.
`pnpm db:generate` is a developer command; `pnpm db:setup` wraps `prisma db push` and
`bootstrap.sql` for Windows/Linux/Docker.

Verify a connection:

```sh
pnpm db:check
```

### pgvector

The schema declared `extensions = [pgvector(map: "vector")]` but no model used
`Unsupported("vector")` or a vector column, and no query used vector operators. The
declaration was removed, so neither platform needs the extension or superuser rights to
`CREATE EXTENSION`.

If vectors are introduced later:

- Windows: install pgvector into the Windows PostgreSQL (or use the
  `pgvector/pgvector:pg16` image) and add the extension back to the schema.
- Termux: `pkg install postgresql clang make git`, build pgvector against the Termux
  Postgres, and install it with `make install`. Do not require root: it installs into
  `$PREFIX`.

---

## 6. Environment loading and shutdown

- Every long-running app loads `.env` through `libs/shared/src/env.ts`, which searches
  upward from the current package directory. This works for `pnpm --filter ... start`
  (cwd `apps/<app>`) and for `node scripts/dev.mjs` (cwd repo root).
- dotenv does **not** expand `$VAR`, backticks, or `~`. Values are literal. Put real values
  in `.env`; never rely on shell syntax.
- API, MCP and worker handle `SIGINT`, `SIGTERM`, and `SIGBREAK` (Windows Ctrl+Break).
  Ctrl+C sends `SIGINT`. Pools are closed on the way out:
  - API: Fastify/Nest app, Redis cache, in-memory queue Redis, BullMQ, Prisma pool.
  - MCP: HTTP server and Prisma pool.
  - Worker: schedulers, BullMQ, queue Redis, Prisma pool.
- The worker has no listening port. It uses a ref'd keep-alive timer so it stays up in
  memory fallback mode; phleet must use `healthMode: process` for it.

`.env.example` documents every variable; `.env.windows.example` and
`.env.termux.example` are copy-paste starting points.

---

## 7. Scripts and checks

| Command                                                              | Purpose                                                            |
| -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `pnpm dev`                                                           | Cross-platform stack (api, mcp, worker, web, block studio)         |
| `pnpm dev:api` / `dev:mcp` / `dev:worker` / `dev:web` / `dev:studio` | One service                                                        |
| `pnpm db:generate`                                                   | Regenerate the committed Prisma client (Windows/Linux)             |
| `pnpm db:setup`                                                      | `prisma db push` + `bootstrap.sql` (Windows/Linux/Docker)          |
| `pnpm db:check`                                                      | `SELECT 1` through the driver adapter                              |
| `pnpm start:web`                                                     | Standalone/Next production server honouring `PORT`                 |
| `pnpm check:imports`                                                 | Case-sensitive import check (also in CI)                           |
| `pnpm check:portability`                                             | Rejects shell env prefixes, POSIX paths, old `localhost:300x` URLs |
| `pnpm typecheck`                                                     | TypeScript                                                         |
| `pnpm test:unit`                                                     | Unit suite on Windows and Termux                                   |

`scripts/dev.ps1` and `scripts/dev.sh` are one-line wrappers around `scripts/dev.mjs`.
There is no platform-specific logic in either wrapper.

---

## 8. phleet deployment

phleet runs one service per project entry, pinned to a phone. All services can live on one
phone (a single-phone stack) or be split across phones that share the same database and
Redis addons.

For every web-facing service, phleet injects `PORT`. Do not hardcode a port in a start
command. For the `web` service, leave `WEB_PORT` unset so the script uses the injected
`PORT`; only a whole-stack `.env` needs `WEB_PORT` (to keep the web port separate from the
API's `PORT`).

| Service  | Start command                                   | Port                                         | Health                |
| -------- | ----------------------------------------------- | -------------------------------------------- | --------------------- |
| `api`    | `pnpm --filter @ai-news/api start`              | `PORT`                                       | HTTP `/health`        |
| `mcp`    | `pnpm --filter @ai-news/mcp-server start`       | `MCP_PORT` (set to the same value as `PORT`) | HTTP `/health`        |
| `web`    | `pnpm start:web`                                | `PORT`                                       | HTTP `/`              |
| `studio` | `pnpm --filter @ai-news/block-studio-app start` | `PORT`                                       | HTTP `/`              |
| `worker` | `pnpm --filter @ai-news/worker start`           | none                                         | `healthMode: process` |

Environment for managed services:

```dotenv
DATABASE_URL=postgresql://...@127.0.0.1:5432/globalpulse?schema=public
REDIS_URL=redis://127.0.0.1:6379
NEXT_PUBLIC_API_URL=https://<api-public-url>
MCP_BASE_URL=https://<mcp-public-url>/mcp
API_INTERNAL_URL=http://127.0.0.1:<api-port>
NEXT_PUBLIC_WEB_URL=https://<web-public-url>
NEXT_PUBLIC_CMS_URL=https://<web-public-url>
# Only when the portal and studio are sibling subdomains, so one session is
# shared between them. The API sets the cookie for this parent domain.
# COOKIE_DOMAIN=.example.com
# Do not set WEB_PORT for the managed web service; phleet's PORT is used.
DATABASE_ENGINE=prisma
NODE_ENV=production
```

Addons (Postgres and Redis) are Termux-native and listen on `127.0.0.1`; the app only reads
`DATABASE_URL` and `REDIS_URL`. It never assumes a Unix socket or a system service manager.
If the worker is configured without a port, phleet must not probe it over HTTP.

The phone should run `pnpm install --frozen-lockfile` itself (or use a prebuilt checkout
that already has a phone-local `node_modules`). Never upload a Windows `node_modules`.

---

## 9. Verification checklist

Run on both platforms:

```sh
node -v                 # >= 20.9
pnpm -v                 # 10.x
pnpm install --frozen-lockfile
pnpm check:imports
pnpm check:portability
pnpm typecheck
pnpm test:unit
```

`pnpm typecheck` sets a 1.5 GB Node heap and `pnpm test:unit` runs four Vitest workers, so a
3–4 GB phone does not get OOM-killed. If TypeScript still runs out of memory, close other
apps or increase `--max-old-space-size` in the script; do not remove files from the check.

Windows additionally:

```powershell
pnpm db:check
pnpm --filter @ai-news/web build
pnpm dev
```

Termux additionally:

```sh
pnpm db:check
# api, mcp, worker, web are reachable on their configured ports
```

Check the phone has no native Prisma engine:

```sh
find node_modules -type f \( -name '*.node' -o -name '*.so*' -o -name '*.dll' -o -name '*.exe' \) \
  -path '*prisma*' -print
```

It should print nothing. Prisma's `query_engine_bg.*` files are JavaScript/WASM shims, not native
engines. esbuild and the Android-arm64 prebuilds for Rollup, Tailwind oxide and Lightning CSS
are expected — they are bionic binaries, not glibc. If you want to see every native object:

```sh
find node_modules -type f \( -name '*.node' -o -name '*.so*' \) -print
```

There should be no glibc `.so` and no `@img/sharp-*` native package (the portal sets
`images: { unoptimized: true }` and does not use `next/image`).

A practical end-to-end check:

1. Start API, MCP, worker, Redis and Postgres on the phone.
2. `curl -fsS http://127.0.0.1:$PORT/health`
3. Enqueue a job through the API (for example a story media variant or an ingestion job).
4. Watch the worker log `Processing job ...` / `completed successfully`.

---

## 10. Troubleshooting

**`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`** — a `node_modules` directory was created by
a different pnpm major. Delete it and run `pnpm install --frozen-lockfile` on this machine.

**`@prisma/client is not generated` / missing models** — the generated client is committed.
Run `git status libs/database/generated`; if it is missing, run `pnpm db:generate` on
Windows and commit the result. Do not run generate on the phone.

**`prisma db push` fails on the phone** — expected. It needs the native schema engine. Run
it on Windows or from Docker against the phone's `DATABASE_URL` (for example through an SSH
tunnel) and then restart the phone services.

**Next.js cannot find an SWC binary on Termux** — make sure
`@next/swc-wasm-nodejs@<next version>` was installed (`pnpm install` with the same
lockfile), or build on Windows and run the standalone output.

**A route/service works on Windows and 404s or fails on Linux/Termux** — run
`pnpm check:imports`. Windows is case-insensitive; Linux is not.

**`FOO=bar` does nothing on Windows** — that is shell syntax. Put `FOO=bar` in `.env`, or
use `cross-env FOO=bar` in an npm script. Repository scripts must pass
`pnpm check:portability`.

**`CANNOT LINK EXECUTABLE "node": cannot locate symbol ...` on Termux** — Termux packages
are rolling; after a Node upgrade install the matching C++ runtime:

```sh
pkg install libc++
node -v
```

If it still fails, run `pkg upgrade` (Termux only) and reinstall `nodejs-lts`.

**Port already in use** — set `PORT`, `MCP_PORT`, or `WEB_PORT` in `.env` (and update
`NEXT_PUBLIC_API_URL` / `MCP_BASE_URL` if the browser must reach the new port).
