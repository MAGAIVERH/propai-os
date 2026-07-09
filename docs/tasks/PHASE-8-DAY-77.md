# Phase 8 · Day 77 — Deploy config for staging (Railway + Neon + Upstash)

## Goal

Make the containerized API + worker (Day 76) **deployable to staging without
touching application code** — everything is config + documentation. Actual
deploy is deferred until cloud accounts/credentials are ready.

## What was added

| File | Purpose |
|------|---------|
| `railway.api.json` | Railway config for the **API** service. Builds `docker/api/Dockerfile`, runs migrations via `preDeployCommand`, health-checks `/health`. |
| `railway.worker.json` | Railway config for the **worker** service. Same image, `startCommand` overridden to `src/worker.ts`, no HTTP health check. |
| `.env.staging.example` | Documented list of every variable the cloud needs (Neon, Upstash, secrets, public URLs). |
| `docs/tasks/PHASE-8-DAY-77-MANUAL.md` | Click-by-click runbook for deploy day. |
| `apps/api/scripts/ping-upstash.mjs` | Throwaway connectivity check for the Upstash Redis instance (`PING` + SET/GET). |

## Deploy architecture

```
                 ┌─────────────────────────────┐
   Neon  ────────┤ DATABASE_URL (owner, migrate)│
 (Postgres)      │ DATABASE_APP_URL (RLS role)  │
                 └──────────────┬──────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                        │
   Railway: API            Railway: worker          Upstash (Redis)
   tsx src/index.ts        tsx src/worker.ts        REDIS_BULLMQ_URL
   :3333  /health          BullMQ consumer          (rediss:// TLS)
   preDeploy = migrate
```

- **One image, two services.** Both Railway services build the *same*
  `docker/api/Dockerfile`; the worker just overrides the start command. This
  mirrors `docker-compose.prod.yml`.
- **Migrations run automatically** as the API service's `preDeployCommand`
  before new traffic is served. If a migration fails, the deploy is blocked
  (desired). The command calls the drizzle-kit binary directly because the
  runtime image has **no pnpm** (`cd /app/packages/db && node_modules/.bin/drizzle-kit migrate`).
- **Runtime uses `DATABASE_APP_URL`** (the RLS-enforced `propai_app` role);
  migrations use `DATABASE_URL` (owner). Keep them distinct.

## Key gotchas (documented in the MANUAL)

1. **Neon database name must be `propai`.** Migration `0002_propai_app_role.sql`
   runs `GRANT CONNECT ON DATABASE propai ...` (hardcoded name). Using Neon's
   default `neondb` makes that migration fail. Create a `propai` database.
2. **Upstash URL must be `rediss://`** (native protocol), not the REST `https://`
   url. TLS is auto-detected from the `rediss://` scheme.
3. **`REDIS_BULLMQ_URL`, not `REDIS_URL`,** drives BullMQ (Day 76 fix).

## Status

- [x] Configs + env template + runbook written and committed.
- [x] Upstash staging Redis provisioned and verified (`ping-upstash.mjs` → PONG).
- [ ] Neon `propai` staging database created (deploy day).
- [ ] Railway project + services created and deployed (deploy day).

## Verify (local, no cloud)

```bash
# Upstash reachability (reads REDIS_BULLMQ_URL_UPSTASH from .env):
node apps/api/scripts/ping-upstash.mjs   # -> PING -> PONG

# Railway config files are valid JSON:
node -e "JSON.parse(require('fs').readFileSync('railway.api.json'));JSON.parse(require('fs').readFileSync('railway.worker.json'));console.log('ok')"
```
