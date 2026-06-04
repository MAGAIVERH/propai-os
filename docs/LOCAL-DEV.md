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

## Day 14 checklist

Mirror of the day-by-day guide — tick in order:

- [ ] Clone repository
- [ ] `pnpm install`
- [ ] Copy `.env.example` → `.env` and set `BETTER_AUTH_SECRET` (≥ 32 characters)
- [ ] `pnpm docker:up` — Postgres **healthy** on `:5432`, Redis on `:6379`
- [ ] `pnpm db:migrate`
- [ ] `pnpm dev` — API + dashboard running
- [ ] `curl http://localhost:3333/health` → `status: ok`
- [ ] `curl http://localhost:3333/ready` → HTTP **200** (not 503)
- [ ] `pnpm dev:smoke` → all checks **PASS** (optional but recommended)

**Done when:** fresh clone completes the checklist without ad-hoc steps.

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
| `pnpm dev` | Turbo — API (`:3333`) + dashboard (`:3000`) |
| `pnpm dev:all` | API + dashboard + marketplace (`:3001`) |
| `pnpm dev:smoke` | Smoke: infra + `GET /health` + `GET /ready` (API must be running) |
| `pnpm dev:smoke --spawn-api` | Same, but starts temporary API via `pnpm --filter @propai/api start` |
| `pnpm auth:poc` | Day 11 auth isolation smoke (needs Postgres + migrations) |

`pnpm dev` runs a fast **predev** check: if Postgres is not listening on `localhost:5432`, it prints:

```text
Run: pnpm docker:up && pnpm db:migrate
```

---

## Environment variables (local)

Copy from `.env.example`. Minimum for daily dev:

| Variable | Purpose |
| -------- | ------- |
| `DATABASE_URL` | Migrations / admin (`propai` user locally) |
| `DATABASE_APP_URL` | API runtime with RLS (`propai_app` role) |
| `REDIS_URL` | `redis://localhost:6379` |
| `BETTER_AUTH_SECRET` | Session signing — **min 32 chars** |
| `BETTER_AUTH_URL` | `http://localhost:3333` (must match API origin) |
| `API_URL` | Web → API (`http://localhost:3333`) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |
| `PORT` / `HOST` | API bind (`3333` / `0.0.0.0`) |

Cloud placeholders (Neon, Upstash, R2, Stripe, etc.) can stay empty for local CRM/API work.

---

## Docker Compose

Default (recommended):

```bash
docker compose up -d
# or: pnpm docker:up
```

| Service | Host port | Health |
| ------- | --------- | ------ |
| PostgreSQL 16 | 5432 | `pg_isready` |
| Redis 7 | 6379 | `redis-cli ping` |

Optional API container (most devs run API on the host):

```bash
docker compose --profile api up -d --build
```

Inside the `api` profile, use hostnames `postgres` and `redis` in `.env` (documented in `.env.example`).

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

---

## Related docs

| Doc | Topic |
| --- | ----- |
| [dev-setup.md](./dev-setup.md) | Editor, cloud accounts, API auth tables, CI |
| [api/api-scaffold.md](./api/api-scaffold.md) | Fastify layout, probes |
| [api/auth-flow.md](./api/auth-flow.md) | Better Auth manual flow |
| `.env.example` | Full variable reference |

---

## Optional next steps

- `pnpm db:seed-dev` — sample org + owner user
- `pnpm auth:poc` — dual-org auth smoke
- `pnpm test:api` — Vitest integration suite
- `pnpm dev:all` — include marketplace on `:3001`
