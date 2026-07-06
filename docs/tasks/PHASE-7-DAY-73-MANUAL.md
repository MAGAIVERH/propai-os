# Phase 7 · Day 73 — Demo seed (manual steps)

The demo seed runs the real API in-process, so it needs the same environment as
the API: a reachable Postgres and the Better Auth secret.

## Prerequisites

1. Docker stack up (Postgres required; Redis optional, used only for visit
   confirmation emails):
   ```bash
   pnpm docker:up
   ```
2. Migrations applied:
   ```bash
   pnpm db:migrate
   ```
3. `.env` at the repo root with at least:
   - `DATABASE_URL=postgresql://propai:propai@localhost:5432/propai`
   - `BETTER_AUTH_SECRET=<min 32 chars>`
   - `BETTER_AUTH_URL=http://localhost:3333`

## Run

```bash
pnpm db:seed
# or with custom credentials (recommended for anything shared):
DEMO_EMAIL=demo@propai.io DEMO_PASSWORD='your-strong-password' pnpm db:seed
```

Expected tail:

```
Demo seed complete — Summit Realty Group
  Owner login:  demo@propai.io / DemoPass123!
  Agent login:  john.martinez@summit-realty.demo / DemoPass123!
  Properties:   6
  Leads:        12
  Activities:   5
  Visits:       3
```

## Notes & troubleshooting

- **Already seeded (HTTP 409):** the demo org/users already exist. Reset the
  database (or drop the `summit-realty-group` org) and re-run.
- **"BullMQ Redis is not configured":** harmless — visits are still created, only
  the confirmation-email enqueue is skipped. Set `REDIS_URL` and run the worker
  (`pnpm --filter @propai/api worker:dev`) if you want the emails queued.
- **Sign-up 500 locally:** ensure your shell isn't overriding `DATABASE_URL` with a
  remote (e.g. Neon) connection; the seed should target the local Postgres.
- The seed force-exits on completion because the in-process API keeps Redis and
  WebSocket handles open.
