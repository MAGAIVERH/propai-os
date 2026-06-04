# ADR 003: Tenant-scoped audit logs

**Status:** Accepted  
**Date:** 2026-06-04  
**Context:** Day 13 — record who did what inside each brokerage tenant.

---

## Decision

PropAI OS stores an **append-only** audit trail in PostgreSQL table `audit_logs`, isolated with the same Row-Level Security (RLS) pattern as `test_items` (see [ADR 001](./001-rls-multi-tenancy.md)).

| Concern | Choice |
| ------- | ------ |
| Persistence | `audit_logs` with `tenant_id` → `organization.id` |
| Writes | `logAuditEvent` / `auditLog` in `@propai/db`, always via `runInTenantContext` |
| Reads | `GET /v1/audit-logs` (cursor pagination, `createdAt` + `id`) |
| RBAC | Permission `audit:read` — **owner** and **manager** only (not `analytics:read`; viewers are denied) |

---

## Schema (v1)

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | `uuid` PK | `gen_random_uuid()` |
| `tenant_id` | `uuid` FK | → `organization.id`, `ON DELETE CASCADE` |
| `actor_id` | `text` FK nullable | → `user.id`, `ON DELETE SET NULL` (system events may be null) |
| `action` | `text` | Controlled vocabulary (see below) |
| `entity_type` | `text` | e.g. `organization`, `test_item`, `invitation` |
| `entity_id` | `text` | Target entity id (UUID as string is fine) |
| `metadata` | `jsonb` | Default `{}`; non-sensitive context only |
| `ip` | `text` nullable | Request IP when available |
| `created_at` | `timestamptz` | Immutable timestamp |

**Indexes:** `(tenant_id, created_at DESC)`, `(tenant_id, entity_type, entity_id)`.

Migration: `packages/db/drizzle/0006_audit_logs.sql`.

---

## RLS

```sql
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_tenant_isolation ON audit_logs
  FOR ALL TO PUBLIC
  USING (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid);
```

Runtime role: `propai_app` (`GRANT` on `audit_logs`). App code sets `app.current_tenant` per transaction (`runInTenantContext`).

**Regression:** `pnpm db:rls-test` validates `test_items` and `audit_logs` tenant isolation.

---

## Actions (v1)

Defined in `@propai/shared` as `AUDIT_ACTIONS`:

| Action | Trigger (v1) |
| ------ | ------------- |
| `organization.created` | `POST /api/auth/brokerage-sign-up` (201) |
| `test_item.created` | `POST /v1/test-items` (201) |
| `invitation.sent` | `POST /api/auth/brokerage-invite` (201) |
| `invitation.accepted` | `POST /api/auth/organization/accept-invitation` (200) |

Audit write failures are logged with `console.error` and **must not** fail the primary mutation.

---

## API RBAC

- `GET /v1/audit-logs` — requires session + tenant context (`401` / `403` from tenant plugin).
- `audit:read` checked via `resolveMemberAccess` + `hasPermission` (`403` for agent/viewer).
- Query: `limit` (default 20, max 100), optional `cursor` (`ISO8601|uuid`).

---

## Consequences

### Positive

- Day 13 “done” criterion: brokerage sign-up creates an `organization.created` row listable by the owner.
- Reusable permission and hooks for future CRM/listing mutations.

### Follow-ups

- Dashboard UI for audit timeline (out of scope Day 13).
- Platform-admin cross-tenant audit (separate table or break-glass role).
- Retention / archival policy.

---

## References

- `packages/db/src/schema/audit-logs.ts`
- `packages/db/src/audit/audit-log.ts`
- `apps/api/src/modules/audit/routes.ts`
- `apps/api/src/lib/member-access.ts`
- [ADR 001 — RLS multi-tenancy](./001-rls-multi-tenancy.md)
- [API scaffold](../api/api-scaffold.md)
