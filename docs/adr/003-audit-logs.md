# ADR 003: Audit logs (tenant-scoped)

**Status:** Accepted  
**Date:** 2026-06-04  
**Context:** Day 13 — trace who did what per brokerage tenant.

---

## Decision

- Table `audit_logs` with `tenant_id` → `organization.id`, same RLS pattern as `test_items` (`audit_logs_tenant_isolation`, `nullif` on `app.current_tenant`).
- Runtime writes via `logAuditEvent` / `auditLog` in `@propai/db`, always inside `runInTenantContext`.
- API list (later): `GET /v1/audit-logs`, RBAC **owner** and **manager** only (not `analytics:read` alone).

---

## References

- `packages/db/drizzle/0006_audit_logs.sql`
- `packages/db/src/schema/audit-logs.ts`
- `packages/db/src/audit/audit-log.ts`
- [ADR 001 — RLS multi-tenancy](./001-rls-multi-tenancy.md)
