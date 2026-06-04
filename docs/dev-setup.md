# Development setup

> **Onboarding:** For a fresh clone (Docker, migrate, `pnpm dev`, health checks, troubleshooting), use **[LOCAL-DEV.md](./LOCAL-DEV.md)** first.

## Prerequisites

| Tool    | Version            | Check            |
| ------- | ------------------ | ---------------- |
| Node.js | 20 LTS (22 OK)     | `node -v`        |
| pnpm    | 9+ (11 in repo)    | `pnpm -v`        |
| Docker  | Desktop running    | `docker -v`      |
| GitHub  | `gh` authenticated | `gh auth status` |

Verify Docker: `docker run --rm hello-world`

## Fresh clone (Day 14)

See **[LOCAL-DEV.md](./LOCAL-DEV.md)** — full walkthrough, troubleshooting, and manual validation.

### Day 14 — delivered in repo

| Item | Status |
| ---- | ------ |
| `docker-compose.yml` — Postgres 16 + Redis (+ optional `api` profile) | Done |
| `.env.example` (EN), `DATABASE_APP_URL` documented | Done |
| `pnpm dev` — API + web (not marketplace) | Done |
| `docs/LOCAL-DEV.md` | Done |
| `pnpm setup:local` + `pnpm dev:smoke` | Done |
| `predev` — fast Postgres `:5432` check before `pnpm dev` | Done |
| `docker/postgres/init` — `propai_app` role on first volume boot | Done |

**Done criterion:** clone → `docker compose up` → `pnpm dev` → `curl /health` ok.

```bash
pnpm setup:local
pnpm dev
curl -s http://localhost:3333/health
curl -s http://localhost:3333/ready
```

## Install (incremental)

```bash
pnpm install
cp .env.example .env
pnpm docker:up    # PostgreSQL + Redis (local)
pnpm db:migrate
```

## Scripts

| Command             | Description                                       |
| ------------------- | ------------------------------------------------- |
| `pnpm setup:local`  | `.env` + Docker up + wait + `db:migrate`          |
| `pnpm dev`          | Turbo — **API** (`:3333`) + **dashboard** (`:3000`); runs `predev` (Postgres `:5432`) |
| `pnpm dev:all`      | Turbo — API + dashboard + marketplace (`:3001`)   |
| `pnpm dev:smoke`    | Stack smoke — `/health`, `/ready`, Redis PING     |
| `pnpm predev:check` | Manual infra probe (same as automatic `predev`)     |
| `pnpm docker:up`    | Start Postgres + Redis via Docker Compose         |
| `pnpm docker:down`  | Stop local containers                             |
| `pnpm db:generate`  | Generate SQL migrations from Drizzle schema       |
| `pnpm db:migrate`   | Apply migrations (`DATABASE_URL` in root `.env`)  |
| `pnpm db:studio`    | Open Drizzle Studio                               |
| `pnpm db:rls-test`  | Run RLS isolation POC (`propai_app` role)       |
| `pnpm db:seed-dev`    | Seed dev org + owner user + settings            |
| `pnpm test:api`       | API integration tests (Vitest; Postgres required) |
| `pnpm test:shared`    | Shared package unit tests (`hasPermission`, roles) |
| `pnpm auth:poc`       | Day 11 auth smoke (dual org isolation + invite) — needs Postgres + migrations |
| `pnpm build`        | Production build                                  |
| `pnpm lint`         | ESLint (all workspace packages)                   |
| `pnpm typecheck`    | TypeScript strict check (Turbo)                   |
| `pnpm lint:fix`     | ESLint with auto-fix                              |
| `pnpm format`       | Prettier write                                    |
| `pnpm format:check` | Prettier check (CI)                               |

## Editor (VS Code / Cursor)

Recommended extensions (see `.vscode/extensions.json`):

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Docker

**Tasks** (`Terminal → Run Task…` or `.vscode/tasks.json`):

| Task | Command |
| ---- | ------- |
| Docker: up | `pnpm docker:up` |
| DB: migrate | `pnpm db:migrate` |
| Setup: local | `pnpm setup:local` |
| Dev: API+Web | `pnpm dev` |
| Dev: smoke | `pnpm dev:smoke` |

**Debug API:** Run and Debug → **Debug API (@propai/api)** (`.vscode/launch.json`).

Format on save is enabled in `.vscode/settings.json`.

Skip infra check before dev (remote DB): `SKIP_PREDEV=1 pnpm dev`.

## UI stack

- **shadcn/ui** (base-nova) — components in `src/components/ui`
- **Dark mode only** — `class="dark"` on `<html>`, `forcedTheme="dark"`
- **Toasts** — Sonner via `@/components/ui/sonner`
- **Validation** — Zod
- **Charts** — Recharts (for dashboard modules)

Add components:

```bash
pnpm dlx shadcn@latest add <component> -y
```

## Cloud accounts (manual)

Create projects and copy keys into `.env` (never commit `.env`):

- Vercel, Neon, Upstash, R2/S3, Resend, Stripe (test), OpenAI/Anthropic, Sentry

See `.env.example` for variable names.

## API auth (Day 10)

Start the API (included in `pnpm dev`):

```bash
pnpm dev
# or only API:
pnpm --filter @propai/api dev
```

Auth endpoints (Better Auth + brokerage sign-up):

| Endpoint | Method | Purpose |
| -------- | ------ | ------- |
| `/api/auth/brokerage-sign-up` | POST | Create user + org + owner + settings |
| `/api/auth/sign-in/email` | POST | Email/password login |
| `/api/auth/get-session` | GET | Current session + `activeOrganizationId` |
| `/v1/test-items` | GET | Protected route (requires session cookie) |
| `/v1/organization/me` | GET | Active organization `{ id, name, slug }` (session) |
| `/v1/audit-logs` | GET | Audit trail (owner/manager; session cookie) |

Postman collection: `docs/api/propai-api.postman_collection.json`  
Step-by-step: `docs/api/auth-flow.md`

Required env: `BETTER_AUTH_URL=http://localhost:3333`, `BETTER_AUTH_SECRET` (32+ chars).

## API health & readiness (Day 12)

| Endpoint   | Method | Purpose |
| ---------- | ------ | ------- |
| `/health`  | GET    | Liveness — always `{ "status": "ok" }` (+ app metadata) |
| `/ready`   | GET    | Readiness — `200` if Postgres answers `SELECT 1`, else `503` |

```bash
pnpm docker:up
pnpm db:migrate
pnpm --filter @propai/api dev

curl -s http://localhost:3333/health
curl -s http://localhost:3333/ready
```

If Postgres is stopped (`pnpm docker:down`), `/ready` returns `503` with:

```json
{ "status": "degraded", "checks": { "database": "down" } }
```

Scaffold reference: [docs/api/api-scaffold.md](./api/api-scaffold.md) (K8s/Docker probe YAML, folder layout).

### Day 12 — API Fastify scaffold (checklist)

- [x] Structure `modules/` + `plugins/` (auth, tenants, health, audit stub)
- [x] Plugins: CORS, Helmet, Zod validator, Pino logger
- [x] Plugins: `tenant-context`, `auth`, `error-handler`
- [x] `GET /health` → `{ "status": "ok" }`
- [x] `GET /ready` → DB connection check
- [x] `server.ts` + `app.ts` (bootstrap split)

**Done when:** `curl` on `/health` and `/ready` return OK with DB up (see commands above).

### Day 11 quick re-validation

```bash
pnpm docker:up
pnpm db:migrate
pnpm auth:poc          # PASS/FAIL smoke (no Vitest runner)
pnpm test:api          # full integration suite (includes Day 13 audit.integration.test.ts)
pnpm test:shared       # role permission unit tests
pnpm db:rls-test       # RLS POC: test_items + audit_logs isolation
```

**Day 13 quick check:** brokerage sign-up → `GET /v1/audit-logs` with owner cookie → `organization.created` in `items`. Postman folder “Day 13 — Audit logs”. ADR: `docs/adr/003-audit-logs.md`.

Sign-off template: `docs/AUTH-POC-FEEDBACK.md` · Manual steps: `docs/api/auth-flow.md` (Day 11).

## CI — API tests with Postgres (optional job)

GitHub Actions runs `test-api` with a Postgres 16 service container (`continue-on-error: true` so flaky integration tests do not block merge). Locally mirror CI:

```bash
pnpm docker:up
pnpm db:migrate
pnpm test:api
```
