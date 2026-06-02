# @propai/db

Drizzle ORM schema, migrations, and database client for PropAI OS.

Row-Level Security (RLS) POC validated in Day 7 — see `docs/adr/001-rls-multi-tenancy.md`.

## Schema (Day 6–7)

| Table | Purpose |
| ----- | ------- |
| `tenants` | Brokerage tenant root (`id`, `name`, `slug`, `created_at`) |
| `tenant_settings` | Per-tenant settings (`timezone`, `currency`, `logo_url`) |
| `test_items` | RLS POC (`tenant_id`, `name`) — pattern for future business tables |

Product docs refer to `organization_id`; this package uses `tenants` until Better Auth organizations are wired.

## Roles (local Docker)

| Role | URL var | Purpose |
| ---- | ------- | ------- |
| `propai` | `DATABASE_URL` | Admin, migrations, seed |
| `propai_app` | `DATABASE_APP_URL` (optional) | App runtime + RLS tests (non-superuser) |

Default app URL: `postgresql://propai_app:propai_app@localhost:5432/propai`

## Commands (from repo root)

```bash
cp .env.example .env
pnpm docker:up
pnpm db:generate   # after schema changes
pnpm db:migrate    # apply migrations (local Docker or Neon dev)
pnpm db:studio     # Drizzle Studio
pnpm db:rls-test   # RLS isolation POC (Day 7)
```

Set `DATABASE_URL` in root `.env`:

- **Local:** `postgresql://propai:propai@localhost:5432/propai`
- **Neon dev:** connection string with `?sslmode=require`

## Usage

```typescript
import { getDb, tenants } from "@propai/db";

const db = getDb();
const rows = await db.select().from(tenants);
```
