# Auth POC feedback — Day 11

Validation record for the Better Auth + organization + RLS auth proof-of-concept.

---

## Environment

| Field | Value |
| ----- | ----- |
| **Date** | 2026-06-04 |
| **Validated by** | PropAI OS engineering (automated Vitest + documented manual runbook) |
| **Runtime** | Node.js 22 (local), pnpm 11.5 |
| **Database** | PostgreSQL 16 via Docker Compose (`propai-postgres`, port 5432) |
| **API** | `@propai/api` — `http://localhost:3333` |
| **Auth base** | `BETTER_AUTH_URL=http://localhost:3333` |
| **Migrations** | `pnpm db:migrate` (applied, including `0004_identity_organizations`, `0005_auth_id_defaults`) |
| **Neon** | Not used for this sign-off (local Docker only) |

**References:**

- [ADR 001 — RLS multi-tenancy](./adr/001-rls-multi-tenancy.md)
- [ADR 002 — Identity, organizations, roles](./adr/002-identity-organizations-roles.md)
- [API auth flow (Day 10–11)](./api/auth-flow.md)
- Postman: [`docs/api/propai-api.postman_collection.json`](./api/propai-api.postman_collection.json)

---

## Automated tests (Vitest)

**Command:** `pnpm test:api`  
**Result:** **13 / 13 passed** (2026-06-04, local Docker Postgres)

| Suite | Tests | Maps to manual |
| ----- | ----- | -------------- |
| `auth.integration.test.ts` | 3 | Day 10 sign-up, sign-in, slug `409` |
| `auth-tenant-isolation.integration.test.ts` | 1 | **M1**, **M2** — two orgs, isolated `test-items` |
| `auth-invitation.integration.test.ts` | 3 | **M3**, **M4**, **M5** — invite, accept, tenant scope; owner-only invite `403` |
| `test-items.integration.test.ts` | 6 | **M6** — `401` without auth; RLS bearer isolation |

**Blockers from automation:** None.

---

## Manual scenarios

Runbook: [auth-flow.md — Day 11](./api/auth-flow.md#day-11--manual-validation-runbook).  
Postman folder: **Day 11 — Manual POC**.

| ID | Scenario | Expected | Result | Notes |
| -- | -------- | -------- | ------ | ----- |
| **M1** | Owner A sign-up + item | `201` + cookie; item on org A | **PASS** | Vitest parity (`auth-tenant-isolation`); Postman scripts assert `201` + `tenantId` |
| **M2** | Owner B sign-up + item; no A data | B list ≠ A | **PASS** | Vitest: two tenants never cross-read; Postman M2 tests exclude `alpha-only-item` |
| **M3** | A invites agent | `invitation` pending | **PASS** | Vitest `auth-invitation`; dev log `[PropAI invite]` with `invitationId` |
| **M4** | Agent accepts | `member` in A; `activeOrganizationId` = A | **PASS** | Vitest accept + `get-session` |
| **M5** | Agent lists test-items | Only tenant A | **PASS** | Vitest: sees org A item, not other org |
| **M6** | No cookie / bad login | `401` on `/v1/test-items` | **PASS** | `test-items.integration` `401`; Postman M6 no-auth request |

**Human re-run (optional):** Import Postman collection, execute M1→M6 with fresh emails. Required for external audit; engineering sign-off uses Vitest + runbook equivalence above.

---

## Issues found

| ID | Severity | Description | Status |
| -- | -------- | ----------- | ------ |
| CI-01 | Low | GitHub Actions used Node 20; pnpm 11.5 requires Node 22 | **Fixed** — `ci.yml` → Node 22 (`dc8fbfc`) |
| — | — | No auth/RLS regressions in Day 11 scope | — |

**Out of scope (Day 11):** Production deploy, Resend email, Neon sign-off, permission middleware on CRM routes.

---

## Security notes (cross-tenant, cookies, RLS)

| Topic | Observation |
| ----- | ----------- |
| **Cross-tenant reads** | `GET /v1/test-items` returns only rows for `session.activeOrganizationId` → `organization.id` via `runInTenantContext` + RLS (`propai_app` role). Two-org Vitest proves no leakage. |
| **Cross-tenant writes** | `POST /v1/test-items` binds `tenantId` from session; other tenant cannot inject foreign `tenantId` in body. |
| **Cookies** | HttpOnly, SameSite=Lax; `Secure` in production. Session token name: `better-auth.session_token`. |
| **Invite authorization** | Only `owner` may call `POST /api/auth/brokerage-invite`; Better Auth AC denies `invitation:create` for manager/agent/viewer. |
| **Invitation accept** | Email on session must match invitation; `requireEmailVerificationOnInvitation: false` for POC (dev/test accept without SMTP). |
| **BETTER_AUTH_URL** | Must match request host (see failure checklist in auth-flow.md). |

---

## Decision

### **GO**

Auth POC meets Day 11 exit criteria:

- Two independent org sign-ups with isolated tenant data (**M1**, **M2**)
- Owner invite + agent accept with correct org membership and session (**M3**–**M5**)
- Protected routes reject unauthenticated callers (**M6**)
- Automated suite green (13/13)
- Manual runbook + importable Postman collection published

**Signed off:** 2026-06-04 — **Environment: local Docker Postgres** (not Neon production).

**GO with fixes:** N/A — no blocking fixes required for Day 12 planning.

---

## Foundation follow-up (Days 12–15) — completed

| Item | Status | Notes |
| ---- | ------ | ----- |
| Fastify API scaffold (`/health`, `/ready`, modules, plugins) | **Done** | Day 12 — [api-scaffold.md](./api/api-scaffold.md) |
| Permission hooks (`hasPermission` / `require-member-role`) | **Done** | Day 13+ on `/v1/audit-logs`; extend in Phase 2 |
| Tenant-scoped audit logs | **Done** | Day 13 — [ADR 003](./adr/003-audit-logs.md) |
| Local Docker dev + smoke | **Done** | Day 14 — [LOCAL-DEV.md](./LOCAL-DEV.md) |
| CI `pnpm test:api` on PRs | **Done** | `.github/workflows/ci.yml` — required job (Foundation v0.1) |
| Foundation tag + docs | **Done** | `foundation-v0.1.0` — [releases/foundation-v0.1.0.md](./releases/foundation-v0.1.0.md) |

## Dashboard login (Day 19) — done

| Item | Status | Notes |
| ---- | ------ | ----- |
| Web auth client (`signIn`, `signUpBrokerage`, `getSession`, `signOut`) | **Done** | `apps/web/src/lib/auth-client.ts` — credentialed fetch to API `:3333` |
| Login / signup pages + middleware | **Done** | `/login`, `/signup`, `/dashboard` — [web/dashboard-auth.md](./web/dashboard-auth.md) |
| Sidebar + org profile | **Done** | `GET /v1/organization/me` in dashboard shell |
| Manual QA runbook | **Done** | Local + staging `API_URL` checklist in dashboard-auth doc |

**Validated:** 2026-06-05 — implementation complete on branch `feat/phase-2-properties`; human QA per [dashboard-auth.md](./web/dashboard-auth.md).

---

## Next steps (Phase 2+)

1. **Properties domain** — schema, RLS, CRUD API — [PHASE-2-PLAN.md](./PHASE-2-PLAN.md) (Days 16–25).
2. ~~Wire dashboard (`apps/web`) to Better Auth session cookies + `activeOrganizationId`~~ — **Done (Day 19)** — [web/dashboard-auth.md](./web/dashboard-auth.md).
3. Extend `require-member-role` to properties and CRM routes as they ship.
4. Configure Resend (or equivalent) for `sendInvitationEmail` in staging/production.
5. Neon branch validation when staging URL is available (repeat Vitest + manual M1–M6).
6. Defer production deploy until full project completion (per team agreement).
