# Phase 8 · Day 77 — MANUAL runbook (deploy day)

> Do this only when you actually want staging live. Steps 1–2 (accounts) can be
> done anytime; the deploy itself is Steps 3–5. Nothing here runs automatically.

Prereqs you provide: a Neon account, an Upstash account (done ✅), a Railway
account, and a GitHub repo Railway can read.

---

## 1. Neon — staging database

1. In your Neon project, **create a database named `propai`** (Dashboard →
   Databases → New Database → name `propai`).
   ⚠️ **Do not use the default `neondb`** — migration `0002` runs
   `GRANT CONNECT ON DATABASE propai`, which fails on any other name.
2. Copy the **pooled** connection string. This is your `DATABASE_URL` (owner):
   ```
   postgresql://neondb_owner:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/propai?sslmode=require
   ```
3. `DATABASE_APP_URL` = same host/db but with the `propai_app` role. That role
   is created by migration `0002` with password `propai_app`. After the first
   deploy runs migrations, rotate it:
   ```sql
   ALTER ROLE propai_app WITH PASSWORD '<strong-random>';
   ```
   Then set `DATABASE_APP_URL` to use `propai_app:<strong-random>`.
   (Chicken-and-egg: for the very first deploy you may temporarily point
   `DATABASE_APP_URL` at the owner role, deploy so migrations create `propai_app`,
   then switch it. See "First deploy order" below.)

## 2. Upstash — Redis  ✅ (already done)

- Database `propai-staging` created, `us-east-1`, TLS on.
- Connection string (`rediss://…`) is parked in `.env` as
  `REDIS_BULLMQ_URL_UPSTASH` and verified with `node apps/api/scripts/ping-upstash.mjs`.
- On deploy, use that value for **both** `REDIS_BULLMQ_URL` and `REDIS_URL`.

## 3. Railway — project + two services

1. **New Project → Deploy from GitHub repo** → pick `propai-os`.
2. This creates one service. Open it → **Settings**:
   - **Config-as-code file:** `railway.api.json`
   - Rename the service to `propai-api`.
3. **New Service → GitHub repo** (same repo) for the worker:
   - **Config-as-code file:** `railway.worker.json`
   - Rename to `propai-worker`.
4. Both services now build `docker/api/Dockerfile`; only the start command differs.

## 4. Environment variables

1. Open **Project → Variables** (shared across services) and add every value
   from `.env.staging.example` (fill the real Neon/Upstash/secret values).
   - Generate the auth secret: `openssl rand -base64 32` → `BETTER_AUTH_SECRET`.
   - `BETTER_AUTH_URL`, `API_URL`, `NEXT_PUBLIC_API_URL` = the API service's
     public Railway domain (Settings → Networking → Generate Domain first).
2. Both `propai-api` and `propai-worker` inherit these shared variables.

## 5. First deploy order

Migrations run automatically as the API's `preDeployCommand`. On a brand-new
database the `propai_app` role doesn't exist yet, so:

1. **First deploy:** temporarily set `DATABASE_APP_URL` = the **owner** string
   (same as `DATABASE_URL`). Deploy `propai-api`. Its `preDeployCommand` runs
   all migrations, which creates the `propai_app` role.
2. **Rotate + switch:** run the `ALTER ROLE propai_app …` SQL (Step 1.3), then
   update `DATABASE_APP_URL` to the `propai_app` role and redeploy.
3. **Deploy the worker** (`propai-worker`) — it reuses the migrated DB + Upstash.

### Smoke test after deploy

```bash
curl https://<api-domain>/health          # -> 200
# Worker logs in Railway should show 3 BullMQ queues "ready".
```

---

## Rollback

Railway keeps previous deployments — use **Deployments → … → Rollback** on the
service. Migrations are additive; avoid destructive `DROP` migrations in staging.

## Cost note

Neon free branch + Upstash free tier + Railway trial cover light staging.
Railway sleeps/charges by usage; keep an eye on the usage tab.
