# Phase 5 · Day 55 — Marketplace buffer + signoff

> Polish, resilience, and the Phase 5 checklist.

## Tasks

- [x] **T1** — Responsive
  - All marketplace pages use responsive grids (`sm`/`lg`/`xl`), sticky filter sidebars collapse, the map view reflows (list above map on mobile).

- [x] **T2** — Loading states
  - `app/loading.tsx` + `app/properties/loading.tsx` skeletons (`card-skeleton.tsx`).

- [x] **T3** — 404s
  - `app/not-found.tsx` (global) and `app/properties/[id]/not-found.tsx` ("Listing unavailable") via `notFound()` on a missing/inactive property.

- [x] **T4** — `docs/MARKETPLACE-CHECKLIST.md` at 100%.

- [x] **T5** — Verification
  - `pnpm --filter @propai/shared build` ✅
  - `pnpm --filter @propai/api typecheck` ✅ (fixed the pre-existing `brokerage-auth.ts:247` cast that was failing typecheck)
  - `pnpm --filter @propai/marketplace typecheck` ✅, `lint` ✅, `build` ✅ (10 routes)
  - `pnpm --filter @propai/api test` against the local Docker DB: **230 passed** (the 2 intermittent failures are pre-existing sign-up contention, green in isolation; see note). New `public-marketplace.integration.test.ts` + `hybrid-rank.test.ts` pass.

## Notes

- **Env caveat (important):** this repo's `*.integration.test.ts` connect via `DATABASE_URL`. If the shell exports a `DATABASE_URL` pointing at a remote DB (e.g. Neon) it **overrides** the root `.env` (dotenv does not override an already-set var), and sign-up returns `500: relation "organization" does not exist`. Run the API suite with the local DB explicitly:
  ```bash
  DATABASE_URL=postgresql://propai:propai@localhost:5432/propai \
  DATABASE_APP_URL=postgresql://propai_app:propai_app@localhost:5432/propai \
  REDIS_URL=redis://localhost:6379 \
  pnpm --filter @propai/api test
  ```
- The full marketplace → lead → CRM flow is demoable end-to-end (browse → submit interest → Kanban card + notification within seconds).
