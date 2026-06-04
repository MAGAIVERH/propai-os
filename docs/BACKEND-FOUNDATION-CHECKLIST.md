# Backend Foundation Checklist — Phase 1 (Days 6–15)

**Scope:** Multi-tenancy foundation (Drizzle, RLS, Better Auth organizations, Fastify API scaffold, audit logs, local dev).  
**Release target:** Git tag `foundation-v0.1.0` on GitHub.  
**Phase 2 kickoff:** [PHASE-2-PLAN.md](./PHASE-2-PLAN.md)

Use this checklist to sign off Foundation v0.1. Each item includes a **verification** command or doc link. Mark `[x]` only after the verification passes on a clean local Docker Postgres setup (`pnpm docker:up`, `pnpm db:migrate`).

---

## Day 6 — Database package & tenant settings

| # | Deliverable | Status | Verification |
| - | ----------- | ------ | ------------ |
| 6.1 | `@propai/db` package with Drizzle config | [x] | `packages/db/drizzle.config.ts`, `packages/db/package.json` |
| 6.2 | Initial migrations (`0000` tenants + `tenant_settings`) | [x] | `packages/db/drizzle/0000_violet_king_bedlam.sql` |
| 6.3 | `tenant_settings` schema (timezone, currency, logo) | [x] | `packages/db/src/schema/tenant-settings.ts` |
| 6.4 | Admin + app DB clients (`getDb`, `getAppDb`) | [x] | `packages/db/src/client.ts`, `.env.example` (`DATABASE_URL`, `DATABASE_APP_URL`) |
| 6.5 | Root scripts `db:generate`, `db:migrate`, `db:studio` | [x] | `pnpm db:migrate` (from repo root) |

**Docs:** [packages/db/README.md](../packages/db/README.md)

---

## Day 7 — RLS POC (`test_items`)

| # | Deliverable | Status | Verification |
| - | ----------- | ------ | ------------ |
| 7.1 | `test_items` table with `tenant_id` → `organization.id` | [x] | `packages/db/src/schema/test-items.ts`, migration `0001` |
| 7.2 | RLS policies + `app.current_tenant` session variable | [x] | `packages/db/drizzle/0001_thick_goblin_queen.sql`, `0003_rls_policy_null_safe.sql` |
| 7.3 | `propai_app` non-superuser role | [x] | `packages/db/drizzle/0002_propai_app_role.sql`, `docker/postgres/init/01-roles.sql` |
| 7.4 | RLS POC script | [x] | `pnpm db:rls-test` → all checks **PASS** |
| 7.5 | ADR 001 accepted | [x] | [adr/001-rls-multi-tenancy.md](./adr/001-rls-multi-tenancy.md) |

---

## Day 8 — Tenant context in API

| # | Deliverable | Status | Verification |
| - | ----------- | ------ | ------------ |
| 8.1 | `setTenantContext` / `withTenantContext` / `runInTenantContext` | [x] | `packages/db/src/tenant-context.ts` |
| 8.2 | `resolveTenantId` — `activeOrganizationId` → `organization.id` | [x] | `apps/api/src/modules/auth/resolve-tenant-id.ts` |
| 8.3 | Fastify `tenant-context` plugin on `/v1/*` | [x] | `apps/api/src/plugins/tenant-context.ts` |
| 8.4 | `GET`/`POST /v1/test-items` scoped to session tenant | [x] | `apps/api/src/modules/test-items/routes.ts` |
| 8.5 | Integration tests (401, 403, isolation) | [x] | `pnpm test:api` → `test-items.integration.test.ts` **PASS** |

**Docs:** ADR 001 — [API integration (Day 8)](./adr/001-rls-multi-tenancy.md#api-integration-day-8)

---

## Day 9 — Identity schema & shared roles

| # | Deliverable | Status | Verification |
| - | ----------- | ------ | ------------ |
| 9.1 | `organization`, `member`, `invitation`, Better Auth tables | [x] | `packages/db/src/schema/auth.ts`, migration `0004` |
| 9.2 | `tenants` → `organization` migration (UUIDs preserved) | [x] | `packages/db/drizzle/0004_identity_organizations.sql` |
| 9.3 | Brokerage roles + permissions in `@propai/shared` | [x] | `packages/shared/src/roles/permissions.ts` |
| 9.4 | Role permission unit tests | [x] | `pnpm test:shared` |
| 9.5 | ADR 002 accepted | [x] | [adr/002-identity-organizations-roles.md](./adr/002-identity-organizations-roles.md) |

---

## Days 10–11 — Better Auth brokerage flows & GO

| # | Deliverable | Status | Verification |
| - | ----------- | ------ | ------------ |
| 10.1 | Better Auth + organization plugin configured | [x] | `apps/api/src/modules/auth/better-auth.ts` |
| 10.2 | Brokerage sign-up (`POST` brokerage routes) | [x] | `apps/api/src/modules/auth/routes/brokerage-auth.ts` |
| 10.3 | Owner invite flow | [x] | `apps/api/src/modules/auth/routes/brokerage-invite.ts` |
| 10.4 | Auth integration tests (sign-up, sign-in, slug conflict) | [x] | `auth.integration.test.ts` in `pnpm test:api` |
| 11.1 | Two-org tenant isolation test | [x] | `auth-tenant-isolation.integration.test.ts` **PASS** |
| 11.2 | Invitation accept + scoped test-items | [x] | `auth-invitation.integration.test.ts` **PASS** |
| 11.3 | Auth POC feedback — **GO** | [x] | [AUTH-POC-FEEDBACK.md](./AUTH-POC-FEEDBACK.md) |
| 11.4 | Manual runbook + Postman collection | [x] | [api/auth-flow.md](./api/auth-flow.md), [api/propai-api.postman_collection.json](./api/propai-api.postman_collection.json) |
| 11.5 | `pnpm auth:poc` smoke script | [x] | `pnpm auth:poc` (optional; same stack as Vitest) |

---

## Day 12 — Fastify API scaffold

| # | Deliverable | Status | Verification |
| - | ----------- | ------ | ------------ |
| 12.1 | `apps/api` module layout (`modules/`, `plugins/`, `lib/`) | [x] | [api/api-scaffold.md](./api/api-scaffold.md) |
| 12.2 | `GET /health` (liveness, no DB) | [x] | `pnpm test:api` → `health.integration.test.ts`, `health.test.ts` |
| 12.3 | `GET /ready` (Postgres `SELECT 1`) | [x] | Same; live: `curl http://localhost:3333/ready` while `pnpm dev` |
| 12.4 | Plugins: CORS, Helmet, Zod, error handler, auth, tenant-context | [x] | `apps/api/src/app.ts` |
| 12.5 | `GET /v1/organization/me` | [x] | `tenants.integration.test.ts` in `pnpm test:api` |

---

## Day 13 — Audit logs

| # | Deliverable | Status | Verification |
| - | ----------- | ------ | ------------ |
| 13.1 | `audit_logs` table + RLS | [x] | `packages/db/drizzle/0006_audit_logs.sql`, `packages/db/src/schema/audit-logs.ts` |
| 13.2 | `logAuditEvent` / write helpers | [x] | `packages/db/src/audit/audit-log.ts`, `apps/api/src/lib/write-audit-event.ts` |
| 13.3 | `GET /v1/audit-logs` (cursor, RBAC) | [x] | `apps/api/src/modules/audit/routes.ts` |
| 13.4 | `audit:read` — owner/manager only | [x] | `audit.integration.test.ts` in `pnpm test:api` |
| 13.5 | RLS POC includes `audit_logs` | [x] | `pnpm db:rls-test` (audit rows) |
| 13.6 | ADR 003 accepted | [x] | [adr/003-audit-logs.md](./adr/003-audit-logs.md) |

---

## Day 14 — Local development

| # | Deliverable | Status | Verification |
| - | ----------- | ------ | ------------ |
| 14.1 | `docker-compose.yml` (Postgres 16 + Redis) | [x] | `pnpm docker:up` → services **healthy** |
| 14.2 | `.env.example` with `DATABASE_APP_URL`, auth vars | [x] | Copy to `.env`, set `BETTER_AUTH_SECRET` (≥ 32 chars) |
| 14.3 | `pnpm setup:local` | [x] | `pnpm setup:local` |
| 14.4 | `pnpm dev` — API `:3333` + web `:3000` | [x] | `pnpm dev`; `curl http://localhost:3333/health` |
| 14.5 | `pnpm dev:smoke` regression | [x] | `pnpm dev:smoke` (with stack running) |
| 14.6 | `predev` Postgres TCP check | [x] | `pnpm predev:check` |
| 14.7 | Onboarding guide | [x] | [LOCAL-DEV.md](./LOCAL-DEV.md) |

---

## Day 15 — Foundation freeze & documentation

| # | Deliverable | Status | Verification |
| - | ----------- | ------ | ------------ |
| 15.1 | This checklist (100% complete) | [x] | All sections above `[x]` |
| 15.2 | `architecture.md` — RLS section + Mermaid diagrams | [x] | [architecture.md](./architecture.md#multi-tenancy--row-level-security-foundation-v01) |
| 15.3 | Phase 2 plan (Days 16–25) | [x] | [PHASE-2-PLAN.md](./PHASE-2-PLAN.md) |
| 15.4 | Verification gate (tests + smoke) | [x] | See [T15-4 sign-off](#t15-4-verification-gate) below |
| 15.5 | Git tag `foundation-v0.1.0` + release notes | [x] | `git tag -a foundation-v0.1.0` — [FOUNDATION-v0.1.0-RELEASE.md](./FOUNDATION-v0.1.0-RELEASE.md) |

---

## T15-4 verification gate

Run on **2026-06-04** (local Docker Postgres, migrations applied):

| Check | Command | Result |
| ----- | ------- | ------ |
| RLS POC (test_items + audit_logs) | `pnpm db:rls-test` | **PASS** (8/8) |
| API integration suite | `pnpm test:api` | **PASS** (30/30) |
| Shared role tests | `pnpm test:shared` | **PASS** (8/8) |
| `/health` + `/ready` | `pnpm test:api` (`health.integration.test.ts`) | **PASS** |
| Live probes (optional) | `pnpm dev` then `curl` `/health`, `/ready` | Manual while stack up |
| Stack smoke (optional) | `pnpm dev:smoke` | With `pnpm dev` running |

**Architecture alignment:** Tenant root is `organization.id`; business tables use `tenant_id` FK to `organization.id`. Auth tables (`user`, `session`, `member`, …) have **no RLS** — isolation is session + app middleware + RLS on business tables.

**Related architecture doc:** [Multi-tenancy & RLS (Foundation v0.1)](./architecture.md#multi-tenancy--row-level-security-foundation-v01)

---

## Foundation sign-off

| Field | Value |
| ----- | ----- |
| **Foundation sign-off date** | 2026-06-04 |
| **Signed off by** | PropAI OS engineering (automated verification + doc review) |
| **Git tag** | `foundation-v0.1.0` (annotated, pushed to GitHub) |
| **Environment** | Local Docker Postgres (not Neon production) |
| **Next phase** | [PHASE-2-PLAN.md](./PHASE-2-PLAN.md) — Properties (Days 16–25) |

---

## Quick reference — commands

```bash
pnpm docker:up
pnpm db:migrate
pnpm db:rls-test
pnpm test:api
pnpm test:shared
pnpm dev
curl -s http://localhost:3333/health
curl -s http://localhost:3333/ready
pnpm dev:smoke
```
