# foundation-v0.1.0

**Tag:** [`foundation-v0.1.0`](https://github.com/MAGAIVERH/propai-os/releases/tag/foundation-v0.1.0)  
**Date:** 2026-06-04  
**Phase:** 1 — Multi-tenancy foundation (Days 6–15)

---

## Summary

First frozen backend foundation for PropAI OS. Delivers PostgreSQL + Drizzle schema, Row-Level Security for tenant business data, Better Auth organizations (sign-up, invite, session), Fastify API scaffold with tenant middleware, tenant-scoped audit logs, and a reproducible Docker local dev stack.

**Breaking changes:** None (greenfield foundation; no prior public API contract).

**Pre-tag verification:** [BACKEND-FOUNDATION-CHECKLIST.md](../BACKEND-FOUNDATION-CHECKLIST.md#pre-tag-verification-t15-4-release-gate) — all gates **GREEN** on 2026-06-04.

---

## What's included

| Area | Deliverable |
| ---- | ----------- |
| **RLS** | `test_items`, `audit_logs`; `app.current_tenant`; `propai_app` role; `pnpm db:rls-test` |
| **Auth** | Better Auth + organization plugin; brokerage sign-up / invite; [AUTH-POC-FEEDBACK](../AUTH-POC-FEEDBACK.md) **GO** |
| **API** | `/health`, `/ready`, `/v1/test-items`, `/v1/audit-logs`, `/v1/organization/me` |
| **Audit** | Append-only `audit_logs` + RBAC (`audit:read` owner/manager) |
| **Shared** | Brokerage roles + permissions (`@propai/shared`) |
| **Local dev** | Docker Compose, `pnpm setup:local`, `pnpm dev`, `pnpm dev:smoke` |

---

## Architecture Decision Records

| ADR | Topic |
| --- | ----- |
| [001](../adr/001-rls-multi-tenancy.md) | Row-Level Security multi-tenancy |
| [002](../adr/002-identity-organizations-roles.md) | Identity, organizations, roles |
| [003](../adr/003-audit-logs.md) | Tenant-scoped audit logs |

**Diagrams:** [architecture.md — Multi-tenancy & RLS](../architecture.md#multi-tenancy--row-level-security-foundation-v01)

---

## Run locally

Prerequisites: Node 20+, pnpm 9+, Docker Desktop.

```bash
git clone https://github.com/MAGAIVERH/propai-os.git
cd propai-os
git checkout foundation-v0.1.0   # or stay on main at/after this tag
pnpm install
cp .env.example .env
# Set BETTER_AUTH_SECRET (min 32 characters)
pnpm setup:local
pnpm dev
```

Verify:

```bash
pnpm typecheck
pnpm db:rls-test
pnpm test:api
pnpm dev:smoke --spawn-api
```

Full guide: [LOCAL-DEV.md](../LOCAL-DEV.md)

---

## Not included (Phase 2+)

- Properties CRUD, R2 photo uploads, properties UI
- CRM, pipeline, marketplace lead sync, AI workers
- Production Neon deploy, Resend email, Stripe billing

**Next:** [PHASE-2-PLAN.md](../PHASE-2-PLAN.md) (Days 16–25)

---

## Maintainer — publish tag

Annotated tag `foundation-v0.1.0` on `main` (resolve commit: `git rev-parse foundation-v0.1.0^{commit}`):

```bash
git tag -l 'foundation-v0.1.0'
git push origin foundation-v0.1.0
```

Optional GitHub Release:

```bash
gh release create foundation-v0.1.0 \
  --title "Foundation v0.1.0 — Multi-tenancy" \
  --notes-file docs/releases/foundation-v0.1.0.md
```
