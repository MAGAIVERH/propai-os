# Release notes — foundation-v0.1.0

**Tag:** `foundation-v0.1.0`  
**Date:** 2026-06-04  
**Scope:** Phase 1 — Multi-tenancy foundation (Days 6–15)

---

## Summary

First frozen backend foundation for PropAI OS: PostgreSQL + Drizzle, Row-Level Security POC and production pattern, Better Auth organizations, Fastify API scaffold with tenant middleware, tenant-scoped audit logs, and Docker-based local development.

This tag marks **documentation and verification complete** for Phase 1. Phase 2 (Properties) starts per [PHASE-2-PLAN.md](./PHASE-2-PLAN.md).

---

## Included

- **`@propai/db`** — migrations `0000`–`0006`, `organization` tenant root, `test_items` + `audit_logs` with RLS, `propai_app` role
- **`@propai/shared`** — brokerage roles and permissions
- **`@propai/api`** — `/health`, `/ready`, `/v1/test-items`, `/v1/audit-logs`, brokerage auth + invite
- **ADRs** — [001](./adr/001-rls-multi-tenancy.md), [002](./adr/002-identity-organizations-roles.md), [003](./adr/003-audit-logs.md)
- **Auth POC** — [AUTH-POC-FEEDBACK.md](./AUTH-POC-FEEDBACK.md) (**GO**, local Docker)
- **Local dev** — [LOCAL-DEV.md](./LOCAL-DEV.md), `pnpm setup:local`, `pnpm dev`, `pnpm dev:smoke`
- **Sign-off** — [BACKEND-FOUNDATION-CHECKLIST.md](./BACKEND-FOUNDATION-CHECKLIST.md)

---

## Verification (at tag time)

```bash
pnpm docker:up
pnpm db:migrate
pnpm db:rls-test    # 8/8 PASS
pnpm test:api       # 30/30 PASS
```

---

## Not included

- Properties CRUD, R2 uploads, dashboard property UI (Phase 2)
- Production Neon deploy, Resend email, Stripe billing
- CRM, pipeline, marketplace, AI workers

---

## Create tag (maintainer)

```bash
git tag -a foundation-v0.1.0 -m "Phase 1: multi-tenancy foundation v0.1"
git push origin foundation-v0.1.0
```
