# Local development — fresh clone guide

English-only doc for onboarding. Goal: **clone → Docker up → migrate → `pnpm dev` → health OK** without guessing.

| Platform | Notes |
| -------- | ----- |
| **Windows** | Docker Desktop (WSL2 backend recommended). Use PowerShell or Git Bash for commands below. |
| **macOS** | Docker Desktop for Mac (Apple Silicon or Intel). Same commands as Linux shells. |

---

## Prerequisites

| Tool | Version | Verify |
| ---- | ------- | ------ |
| Node.js | 20 LTS (22 OK) | `node -v` |
| pnpm | 9+ (repo pins 11) | `pnpm -v` — enable via `corepack enable` if needed |
| Docker Desktop | Latest stable | `docker -v` then `docker run --rm hello-world` |
| Git | Any recent | `git --version` |

Optional: [GitHub CLI](https://cli.github.com/) (`gh`) for PRs — not required to run the stack.

---

## Day 14 — Docker Compose local dev

### Your checklist (tick when validating a fresh machine)

- [ ] Clone repository
- [ ] `pnpm install`
- [ ] Copy `.env.example` → `.env` and set `BETTER_AUTH_SECRET` (≥ 32 characters)
- [ ] `pnpm docker:up` — Postgres **healthy** on `:5432`, Redis on `:6379`
- [ ] `pnpm db:migrate`
- [ ] `pnpm dev` — API + dashboard running
- [ ] `curl http://localhost:3333/health` → `status: ok`
- [ ] `curl http://localhost:3333/ready` → HTTP **200** (not 503)
- [ ] `curl` / browser — http://localhost:3000 responds (200 or 307)
- [ ] `pnpm dev:smoke` → all checks **PASS** (recommended)
- [ ] `pnpm web-build-smoke` → typecheck + `@propai/web` build **PASS** (Day 19 regression)
- [ ] Day 19 dashboard auth — see [web/dashboard-auth.md](./web/dashboard-auth.md) QA checklist

**Done when:** clone → compose up → `pnpm dev` → `/health` ok.

### Shipped in this repo

- [x] `docker-compose.yml` — Postgres 16 + Redis (+ optional `api` profile)
- [x] `.env.example` (EN), `DATABASE_APP_URL` documented
- [x] `pnpm dev` — `@propai/api` + `@propai/web` (use `pnpm dev:all` for marketplace)
- [x] `@propai/shared` — compiled to `dist/` before dev (Turbo `dev` → `^build`; required by Next.js/Turbopack)
- [x] `docs/LOCAL-DEV.md` — this guide
- [x] `pnpm setup:local` + `pnpm dev:smoke`
- [x] `predev` — TCP check on Postgres `:5432` before `pnpm dev`
- [x] `docker/postgres/init/01-roles.sql` — `propai_app` role on first volume boot (migrations still required)

### Manual validation (close-out)

New folder or **new Docker volume** (`docker compose down -v` then `docker compose up -d`):

```bash
git clone https://github.com/MAGAIVERH/propai-os.git
cd propai-os
pnpm install
cp .env.example .env
pnpm docker:up
pnpm db:migrate
pnpm dev
```

Second terminal:

```bash
curl -s http://localhost:3333/health
curl -s http://localhost:3333/ready
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
pnpm dev:smoke
```

Optional regression: `pnpm auth:poc` (Days 11–13).

---

## Day 19 — Dashboard auth verification

After `pnpm dev` (API `:3333` + web `:3000`), confirm the auth shell. Full runbook: **[web/dashboard-auth.md](./web/dashboard-auth.md)**.

**Required `.env` for web auth** (all four must match `.env.example` for local dev):

| Variable | Local value | Common mistake |
| -------- | ----------- | -------------- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3333` | Missing — browser auth calls fail in dev |
| `API_URL` | `http://localhost:3333` | — |
| `BETTER_AUTH_URL` | `http://localhost:3333` | Set to `:3000` (dashboard) instead of API |
| `BETTER_AUTH_SECRET` | ≥ 32 characters | Too short — regenerate with `openssl rand -base64 32` |

Restart `pnpm dev` after changing any `NEXT_PUBLIC_*` or auth variable.

**Manual QA (tick when validated):**

- [ ] http://localhost:3000/signup — create brokerage → lands on `/dashboard` with sidebar + org name
- [ ] Hard refresh `/dashboard` — session persists
- [ ] Incognito `/dashboard` → redirects to `/login`
- [ ] Login with same credentials → `/dashboard`
- [ ] Sign out → `/login`; protected routes blocked again
- [ ] `/login` while authenticated → redirects to `/dashboard`

**Staging API from local web:** set `NEXT_PUBLIC_API_URL` and `API_URL` to the staging API URL; add your web origin to API trusted origins. See [dashboard-auth.md — staging QA](./web/dashboard-auth.md#manual-qa--staging-api).

---

## Day 28 — AI vision worker (async queue)

When `ENABLE_AI_VISION=true`, `POST /v1/ai/analyze-property-images` **enqueues** a BullMQ job and returns **202 + jobId**. A separate **worker process** must consume the queue and call Gemini.

### Two terminals (recommended)

```bash
# Terminal 1 — API + dashboard (or API only)
pnpm dev

# Terminal 2 — analyze-property-images worker
pnpm --filter @propai/api worker:dev
```

One-shot worker (no file watch): `pnpm --filter @propai/api worker`.

### Required `.env` (in addition to object storage for real photos)

| Variable | Local value |
| -------- | ----------- |
| `ENABLE_AI_VISION` | `true` |
| `GEMINI_API_KEY` | Your Google AI key |
| `REDIS_URL` | `redis://localhost:6379` — AI vision rate limit |
| `REDIS_BULLMQ_URL` | `redis://localhost:6379` — BullMQ (same Redis in Compose) |

Both Redis URLs can point at the same local instance. In production, BullMQ typically uses a dedicated Upstash URL (`rediss://...`) — see `.env.example`.

### Async flow

1. **POST** `/v1/ai/analyze-property-images` with presigned image URLs → **202** `{ "jobId": "..." }`
2. **GET** `/v1/ai/jobs/:jobId` → poll until `status` is `completed` or `failed`
3. When `completed`, read `result` (same schema as sync Day 27 response)

With `ENABLE_AI_VISION=false`, POST still returns **200** mock JSON immediately (no worker required).

**Manual QA checklist:** [tasks/PHASE-3-DAY-28-MANUAL.md](./tasks/PHASE-3-DAY-28-MANUAL.md)

### VS Code / Cursor — worker task

`Terminal → Run Task…` → **Dev: AI worker** (see `.vscode/tasks.json`). Run alongside **Dev: API+Web**.

---

## Quick start (recommended)

```bash
git clone https://github.com/MAGAIVERH/propai-os.git
cd propai-os
pnpm install
pnpm setup:local          # .env + docker compose up -d + db:migrate
# Edit .env — set BETTER_AUTH_SECRET (min 32 chars) if you use auth endpoints
pnpm dev                  # terminal 1 — API + dashboard
pnpm dev:smoke            # terminal 2 — stack smoke (API must be running)
```

One-liner smoke (starts a **temporary** API, then exits):

```bash
pnpm setup:local
pnpm dev:smoke --spawn-api
```

---

## Manual setup (same result as `setup:local`)

```bash
git clone https://github.com/MAGAIVERH/propai-os.git
cd propai-os
pnpm install
cp .env.example .env
# Required: BETTER_AUTH_SECRET — at least 32 characters (see .env.example)
pnpm docker:up
pnpm db:migrate
pnpm dev
```

---

## Application URLs

| App | Package | URL | Start command |
| --- | ------- | --- | ------------- |
| Dashboard | `@propai/web` | http://localhost:3000 | included in `pnpm dev` |
| API | `@propai/api` | http://localhost:3333 | included in `pnpm dev` |
| Marketplace | `@propai/marketplace` | http://localhost:3001 | `pnpm dev:all` |

### Health probes (API)

```bash
curl -s http://localhost:3333/health
curl -s http://localhost:3333/ready
```

| Endpoint | Meaning |
| -------- | ------- |
| `GET /health` | Liveness — always OK if the process is up |
| `GET /ready` | Readiness — **200** when Postgres answers `SELECT 1`; **503** if DB is down |

---

## Root scripts

| Command | Description |
| ------- | ----------- |
| `pnpm setup:local` | Create `.env` (if missing), `docker compose up -d`, wait for ports, `db:migrate` |
| `pnpm docker:up` | Start Postgres + Redis only |
| `pnpm docker:down` | Stop containers |
| `pnpm db:migrate` | Apply Drizzle migrations (`DATABASE_URL` in `.env`) |
| `pnpm dev` | Turbo — builds workspace deps (`@propai/shared` → `dist/`), then API (`:3333`) + dashboard (`:3000`) |
| `pnpm dev:all` | Same prebuild, then API + dashboard + marketplace (`:3001`) |
| `pnpm dev:smoke` | Smoke: infra + `GET /health` + `GET /ready` (API must be running) |
| `pnpm dev:smoke --spawn-api` | Same, but starts temporary API via `pnpm --filter @propai/api start` |
| `pnpm build:web` | Build `@propai/shared` → `dist/` then `@propai/web` (Turbo `^build`) |
| `pnpm web-build-smoke` | Typecheck + shared build + web build — regression guard for Day 19 hotfix |
| `pnpm auth:poc` | Day 11 auth isolation smoke (needs Postgres + migrations) |
| `pnpm --filter @propai/api worker:dev` | BullMQ worker for async AI vision (Day 28 — run beside API) |

`pnpm dev` runs a fast **predev** check (~1.5s max on Windows if Postgres is down): TCP probe on `localhost:5432`. If it fails:

```text
Run: pnpm docker:up && pnpm db:migrate
```

Skip when using a remote database: `SKIP_PREDEV=1 pnpm dev`.

**`@propai/shared`:** Turbo runs `build` on workspace dependencies before starting dev servers. Next.js apps consume compiled `packages/shared/dist/` (not raw TypeScript). After editing shared source, restart `pnpm dev` or run `pnpm --filter @propai/shared build` in another terminal.

### VS Code / Cursor tasks

`Terminal → Run Task…` — see `.vscode/tasks.json`:

- **Docker: up**, **DB: migrate**, **Setup: local**, **Dev: API+Web**, **Dev: smoke**
- **Debug API** — Run and Debug panel (`.vscode/launch.json`)

---

## Environment variables (local)

Copy from `.env.example`. Minimum for daily dev:

| Variable | Purpose |
| -------- | ------- |
| `DATABASE_URL` | Migrations / admin (`propai` user locally) |
| `DATABASE_APP_URL` | API runtime with RLS (`propai_app` role) |
| `REDIS_URL` | `redis://localhost:6379` — rate limit / cache |
| `REDIS_BULLMQ_URL` | `redis://localhost:6379` — BullMQ queue (same Redis locally; Upstash `rediss://` in prod) |
| `BETTER_AUTH_SECRET` | Session signing — **min 32 chars** |
| `BETTER_AUTH_URL` | `http://localhost:3333` (must match API origin) |
| `API_URL` | Server/middleware → API (`http://localhost:3333`) |
| `NEXT_PUBLIC_API_URL` | Browser fetch → API (`http://localhost:3333`) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |
| `PORT` / `HOST` | API bind (`3333` / `0.0.0.0`) |

Cloud placeholders (Neon, Upstash, R2, Stripe, etc.) can stay empty for local CRM/API work.

### Object storage (optional — Day 18+ uploads)

Property photo uploads use a **private** S3-compatible bucket (R2 in cloud, MinIO locally). Leave `S3_*` empty until you work on upload features — the API returns **503** when storage is unset.

**Full runbook:** [infra/object-storage.md](./infra/object-storage.md)

| Variable | Local MinIO (`--profile storage`) |
| -------- | --------------------------------- |
| `S3_ENDPOINT` | `http://localhost:9000` |
| `S3_REGION` | `us-east-1` |
| `S3_BUCKET` | `propai-uploads` |
| `S3_ACCESS_KEY_ID` | `minioadmin` |
| `S3_SECRET_ACCESS_KEY` | `minioadmin` |
| `S3_PRESIGN_EXPIRES_SECONDS` | `900` (optional) |

```bash
docker compose --profile storage up -d   # MinIO :9000 (API) / :9001 (console)
```

---

## Docker Compose

Default (recommended):

```bash
docker compose up -d
# or: pnpm docker:up
```

| Service | Host port | Health | Profile |
| ------- | --------- | ------ | ------- |
| PostgreSQL 16 | 5432 | `pg_isready` | default |
| Redis 7 | 6379 | `redis-cli ping` | default |
| MinIO (S3 API) | 9000 | HTTP `/minio/health/live` | `storage` |
| MinIO Console | 9001 | — | `storage` |

On a **brand-new Postgres volume**, `docker/postgres/init/01-roles.sql` creates the `propai_app` login role before you run migrations. Schemas, tables, grants, and RLS still require `pnpm db:migrate` (Drizzle migrations, including `0002_propai_app_role.sql`).

Optional API container (most devs run API on the host):

```bash
docker compose --profile api up -d --build
```

Inside the `api` profile, use hostnames `postgres` and `redis` in `.env` (documented in `.env.example`).

Optional MinIO (local uploads — Day 18):

```bash
docker compose --profile storage up -d
```

Bucket `propai-uploads` is created automatically (private + CORS for `http://localhost:3000`). Console: http://localhost:9001 (`minioadmin` / `minioadmin`).

---

## Troubleshooting

### Port 5432 already in use

Another Postgres instance (local install, old container, or different project) is bound to **5432**.

1. Find the process: `docker ps` / Windows: `netstat -ano | findstr :5432`
2. Stop the conflicting service, or run `pnpm docker:down` for PropAI containers
3. Retry `pnpm docker:up`

### `GET /ready` returns 503 (`database: down`)

| Cause | Fix |
| ----- | --- |
| Docker not running | Start Docker Desktop, then `pnpm docker:up` |
| Migrations not applied | `pnpm db:migrate` |
| Wrong `DATABASE_URL` in `.env` | Use `postgresql://propai:propai@localhost:5432/propai` for local Compose |

`/health` can still be OK while `/ready` is 503 — that only means the DB probe failed.

### `pnpm dev:smoke` — API not reachable

Start the API first:

```bash
pnpm dev
# other terminal:
pnpm dev:smoke
```

Or use `pnpm dev:smoke --spawn-api` after `pnpm setup:local` (no second terminal).

### CORS or auth cookie issues

| Check | Expected local value |
| ----- | -------------------- |
| `BETTER_AUTH_URL` | `http://localhost:3333` |
| `API_URL` | `http://localhost:3333` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3333` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |

Better Auth validates the request **Origin** against the API base URL. Do not point the dashboard at a different host/port than configured in `.env` without updating these variables.

### `BETTER_AUTH_SECRET` too short

Generate a secret (32+ characters):

```bash
openssl rand -base64 32
```

Paste into `.env` — never commit real secrets.

### `predev` fails but Docker “looks fine”

Wait until `docker compose ps` shows Postgres **healthy**, then run `pnpm db:migrate`. The predev check only tests TCP on `localhost:5432` (fast on Windows/macOS).

### Redis smoke fails

Ensure the `propai-redis` container is running: `docker compose ps`. Run `pnpm docker:up`.

### Next.js — `Can't resolve './…​.js'` from `@propai/shared`

The dashboard imports compiled output from `packages/shared/dist/`. Turbo builds shared automatically when you run `pnpm dev` or `pnpm dev:all`.

| Symptom | Fix |
| ------- | --- |
| Error on `/login` or first page using `@propai/shared` | Run `pnpm --filter @propai/shared build`, then restart `pnpm dev` |
| After editing `packages/shared/src/**` | Re-run `pnpm --filter @propai/shared build` or restart dev (Turbo rebuilds deps on start) |
| CI / smoke without dev | `pnpm --filter @propai/shared build && pnpm --filter @propai/web build` |

---

## Related docs

| Doc | Topic |
| --- | ----- |
| [dev-setup.md](./dev-setup.md) | Editor, cloud accounts, API auth tables, CI |
| [web/dashboard-auth.md](./web/dashboard-auth.md) | Dashboard login/signup, cookies, middleware, QA |
| [infra/object-storage.md](./infra/object-storage.md) | R2 / MinIO private bucket, CORS, `S3_*` env |
| [api/upload-confirm.md](./api/upload-confirm.md) | Presign → PUT → confirm `property_images` (Day 21) |
| [tasks/PHASE-3-DAY-28-MANUAL.md](./tasks/PHASE-3-DAY-28-MANUAL.md) | Async AI vision queue + worker manual QA (Day 28) |
| [web/properties-module.md](./web/properties-module.md) | Dashboard properties list (Day 22) |
| [api/api-scaffold.md](./api/api-scaffold.md) | Fastify layout, probes |
| [api/auth-flow.md](./api/auth-flow.md) | Better Auth manual flow |
| `.env.example` | Full variable reference |

---

## Optional next steps

- `pnpm db:seed-dev` — sample org + owner user
- `pnpm auth:poc` — dual-org auth smoke
- `pnpm test:api` — Vitest integration suite
- `pnpm --filter @propai/api worker:dev` — AI vision BullMQ worker (with `ENABLE_AI_VISION=true`)
- `pnpm dev:all` — include marketplace on `:3001`
