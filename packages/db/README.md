# @propai/db

Drizzle ORM schema, migrations, and database client for PropAI OS.

## Schema (Day 6)

| Table | Purpose |
| ----- | ------- |
| `tenants` | Brokerage tenant root (`id`, `name`, `slug`, `created_at`) |
| `tenant_settings` | Per-tenant settings (`timezone`, `currency`, `logo_url`) |

Row-Level Security (RLS) lands in Day 7+. Product docs refer to `organization_id`; this package uses `tenants` until Better Auth organizations are wired.

## Commands (from repo root)

```bash
cp .env.example .env
pnpm docker:up
pnpm db:generate   # after schema changes
pnpm db:migrate    # apply migrations (local Docker or Neon dev)
pnpm db:studio     # Drizzle Studio
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
