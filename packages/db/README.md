# @propai/db

Drizzle ORM schema, migrations, and database client for PropAI OS.

See `docs/adr/001-rls-multi-tenancy.md` (RLS) and `docs/adr/002-identity-organizations-roles.md` (identity).

## Schema

| Table | Purpose |
| ----- | ------- |
| `organization` | Brokerage tenant root (Better Auth org plugin; replaces legacy `tenants`) |
| `user`, `session`, `account`, `verification` | Better Auth core |
| `member`, `invitation` | Better Auth organization plugin |
| `tenant_settings` | Per-org settings (FK → `organization.id`) |
| `test_items` | RLS POC (`tenant_id` → `organization.id`) |
| `audit_logs` | Immutable audit trail (`tenant_id` → `organization.id`; Day 13) |

**RLS:** `tenant_id` columns reference `organization.id`. Session scope uses `app.current_tenant`. See `docs/adr/003-audit-logs.md`.

## Roles (local Docker)

| Role | URL var | Purpose |
| ---- | ------- | ------- |
| `propai` | `DATABASE_URL` | Admin, migrations, seed |
| `propai_app` | `DATABASE_APP_URL` | App runtime + RLS tests (non-superuser) |

Default app URL: `postgresql://propai_app:propai_app@localhost:5432/propai`

## Commands (from repo root)

```bash
cp .env.example .env
pnpm docker:up
pnpm db:migrate
pnpm db:seed-dev      # optional: 1 org + owner user + settings
pnpm db:rls-test
pnpm test:api
```

## Usage

```typescript
import {
  getOrganizationById,
  runInTenantContext,
  organization,
  testItems,
} from "@propai/db";

const orgId = await getOrganizationById(activeOrganizationId);

const items = await runInTenantContext(orgId!, async (tx) => {
  return tx.select().from(testItems);
});
```

### API helpers

| Export | Purpose |
| ------ | ------- |
| `runInTenantContext(tenantId, fn)` | Tenant-scoped queries via `getAppDb()` + RLS |
| `logAuditEvent` / `auditLog` | Append tenant-scoped audit row (Day 13) |
| `getOrganizationById` / `getTenantById` | Resolve org UUID (alias) |
| `getInitialOrganizationIdForUser` | Session bootstrap (first membership) |
| `isOrganizationSlugTaken` | Brokerage sign-up slug check |
| `authSchema` | Better Auth Drizzle adapter table map |
| `seedDevIdentity()` | Dev seed: org + owner member + settings |

`pnpm db:rls-test` validates RLS for **`test_items`** and **`audit_logs`** (tenant A/B isolation, no context, cross-tenant filter).
