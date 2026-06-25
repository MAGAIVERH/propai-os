# Phase 7 · Day 73 — Seed script with US demo data

**Objective:** A recruiter/demo login lands on a rich, realistic dashboard.

## What was built

- `apps/api/scripts/seed-demo.ts` + scripts `pnpm db:seed` (root) /
  `pnpm --filter @propai/api seed:demo`.
- Seeds the demo entirely through the **real API endpoints** via `app.inject()`
  (brokerage sign-up, invite/accept, properties, leads, activities, visits) — the
  exact code paths the product uses, so the demo owner can actually sign in and
  RLS / pipeline seeding / notifications behave like production.

## Seeded tenant — Summit Realty Group (Denver, CO)

- **Owner:** Sarah Chen — `demo@propai.io`
- **Agent:** John Martinez — `john.martinez@summit-realty.demo`
- **6 properties** (Boulder bungalow $625k, Denver condo, Wash Park townhome,
  East Austin rental $2,100/mo, Capitol Hill duplex, Golden ranch). Only **4 are
  `active`** to respect the Free plan's 5-active-listing gate; the rest are
  `under_contract` / `sold`.
- **12 leads** spread across New → Contacted → Visit Scheduled → Negotiation →
  Won → Lost, assigned between owner and agent, several linked to properties.
- **5 activity notes** and **3 scheduled visits**.

## Verified

- `pnpm db:seed` → exit 0, prints a summary.
- `POST /api/auth/brokerage-sign-in` with the demo creds → **200** + session with
  `activeOrganizationId`.
- With that session: `/v1/properties` → 6, `/v1/leads` → 12,
  `/v1/analytics/overview` → totalLeads 12, conversion 16.7%, activeListings 4,
  visitsThisWeek 3.

## Notes

- Idempotent: re-running skips if the demo org already exists (reset the DB to
  re-seed). The script force-exits because `buildApp()` keeps Redis/WS handles open.
- Visit confirmation emails are best-effort: if BullMQ/Redis isn't configured the
  visit is still created and a warning is logged (no failure).
- Credentials/password are **not committed**; override with `DEMO_EMAIL` /
  `DEMO_PASSWORD` env vars.
