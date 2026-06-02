# ADR 002: Identity, organizations, and brokerage roles

**Status:** Accepted  
**Date:** 2026-06-02  
**Context:** Phase 1 Day 9 — align PropAI OS identity with Better Auth Organizations and brokerage roles.

---

## Decision

PropAI OS uses **Better Auth** for identity and the **organization plugin** for multi-tenant brokerage workspaces.

| Concept | Implementation |
| ------- | -------------- |
| **Tenant (product docs)** | `organization` table — UUID primary key |
| **RLS scope** | `tenant_id` columns reference `organization.id` |
| **Legacy `tenants` table** | Migrated to `organization` (UUIDs preserved) |
| **Member roles** | `member.role` — validated against `@propai/shared` enum |
| **Permissions** | Defined in `@propai/shared` (`ROLE_PERMISSIONS`); enforced in API middleware Day 10+ |

---

## Better Auth vs custom tables

| Table | Owner | Purpose |
| ----- | ----- | ------- |
| `user` | Better Auth | Login identity (email, profile) |
| `session` | Better Auth | Sessions + `active_organization_id` |
| `account` | Better Auth | OAuth / password credentials |
| `verification` | Better Auth | Email verification tokens |
| `organization` | Better Auth plugin | Brokerage tenant root (replaces `tenants`) |
| `member` | Better Auth plugin | User ↔ org membership + `role` |
| `invitation` | Better Auth plugin | Pending invites (flow deferred) |
| `tenant_settings` | PropAI custom | Timezone, currency, logo (FK → `organization`) |
| `test_items` | PropAI POC | RLS demo (`tenant_id` → `organization.id`) |

Auth tables are defined in Drizzle (`packages/db/src/schema/auth.ts`) and passed to `drizzleAdapter` in `apps/api/src/auth/better-auth.ts`.

---

## Organization = tenant mapping

- **Day 8 convention:** `session.activeOrganizationId` mapped 1:1 to tenant UUID.
- **Day 9:** Same UUIDs now live in `organization.id` after migration from `tenants`.
- **RLS:** Unchanged — `app.current_tenant` still set to organization UUID; policies compare `tenant_id`.

```typescript
// resolveTenantId → getOrganizationById(activeOrganizationId)
```

Backward-compatible exports: `tenants` alias → `organization`, `getTenantById` → `getOrganizationById`.

---

## Roles and permissions

Defined in `packages/shared/src/roles/permissions.ts`:

| Role | Permissions |
| ---- | ----------- |
| `owner` | leads:write, properties:write, analytics:read, billing:manage |
| `manager` | leads:write, properties:write, analytics:read |
| `agent` | leads:write, properties:write |
| `viewer` | analytics:read |

Database constraint: `member_role_check` on `member.role`.

API permission middleware (Day 10+) will call `hasPermission(member.role, permission)` — not in scope for Day 9.

---

## Migration plan (executed)

Migration `0004_identity_organizations.sql`:

1. Create `organization`
2. `INSERT INTO organization SELECT … FROM tenants`
3. Repoint `tenant_settings` and `test_items` FKs
4. Drop `tenants`
5. Create Better Auth core + org plugin tables
6. Grant `propai_app` on new tables

---

## Neon / production notes

- Run `pnpm db:migrate` against Neon dev branch with `DATABASE_URL` pointed at Neon.
- Create a **non-superuser** DB role for runtime (same pattern as local `propai_app`).
- Do not run app queries as superuser — RLS is bypassed for superusers.

---

## References

- [ADR 001 — RLS multi-tenancy](./001-rls-multi-tenancy.md)
- `packages/db/src/schema/auth.ts`
- `packages/shared/src/roles/permissions.ts`
- [Better Auth organization plugin](https://www.better-auth.com/docs/plugins/organization)
