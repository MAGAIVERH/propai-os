# Phase 6 · Day 65 — Phase 6 buffer

> Fix analytics and billing debt; demo-ready brokerage admin flow.

## Tasks
- [x] **T1** — Stripe webhook idempotency: every event id is recorded in `stripe_events` with `onConflictDoNothing`; duplicates return `200 {duplicate:true}` without re-processing.
- [x] **T2** — Analytics RBAC: agents see only their own metrics (self-scoped queries + CSV exports); managers/owners/viewers see the whole tenant. `analytics:read` granted to `agent`.
- [x] **T3** — `docs/ANALYTICS-BILLING-CHECKLIST.md` at 100%.
- [x] **T4** — Verification:
  - `pnpm --filter @propai/shared build` ✅; `pnpm typecheck` (all packages) ✅; `pnpm lint` (all packages) ✅
  - New integration tests pass in isolation: `analytics`, `billing` (status + 402 feature gate), `settings` (team/branding/onboarding).
  - **CI lint hotfix** (PR #32) landed first to make `main` green.

## Notes
- **Running the API integration suite locally:** the suite must point at the local Docker DB, not a remote `DATABASE_URL` in your shell:
  ```bash
  DATABASE_URL=postgresql://propai:propai@localhost:5432/propai \
  DATABASE_APP_URL=postgresql://propai_app:propai_app@localhost:5432/propai \
  REDIS_URL=redis://localhost:6379 \
  pnpm --filter @propai/api test
  ```
- Pre-existing full-suite flakiness: a few `*.integration.test.ts` intermittently fail on sign-up under the full local run (every file passes in isolation). This predates Phase 6 (baseline 197/200, then 230/2) and is environmental — CI's fresh Linux Postgres runs the suite green.
- Stripe is optional in dev (set `STRIPE_*` keys to enable checkout/portal). See `PHASE-6-DAY-60-MANUAL.md`.
