# Project status — PropAI OS

**Snapshot of how far the build has progressed against the 90-day development
guide.** Days 1–75 (Phases 0–7) are shipped and merged to `main`; Phase 8
(Days 76–90 — DevOps, tests, launch) has not started.

Latest tag: `ui-v0.1.0`. Milestone tags: `foundation-v0.1.0`, `ai-v0.1.0`, `ui-v0.1.0`.

---

## Per-phase status

| Phase | Days | Theme | Status |
| ----- | ---- | ----- | ------ |
| 0 | 1–5 | Scope, requirements, legal, monorepo + CI | ✅ Complete |
| 1 | 6–15 | Multi-tenancy POC, RLS, Better Auth, Fastify scaffold, audit, Docker | ✅ Complete (`foundation-v0.1.0`) |
| 2 | 16–25 | Properties module — schema, CRUD, uploads, dashboard, list/form, map, photos | ✅ Complete |
| 3 | 26–35 | AI — vision, BullMQ, pgvector embeddings, semantic search, lead scoring, pricing | ✅ Complete (`ai-v0.1.0`) |
| 4 | 36–45 | CRM & pipeline — leads, Kanban + GSAP, WebSocket, visits, emails, notifications | ✅ Complete |
| 5 | 46–55 | Public marketplace — SSR, detail, lead capture, semantic UI, map, ranking, cache, legal | ✅ Complete |
| 6 | 56–65 | Analytics & billing — views, dashboard, CSV, Stripe, gates, onboarding, team, branding | ✅ Complete |
| 7 | 66–75 | Landing & polish — cinematic landing, a11y, i18n, error boundaries, seed, perf | ✅ Complete (`ui-v0.1.0`) |
| 7+ | — | Landing revamp — self-contained pages, buyer accounts, premium auth (post-Day-75) | ✅ Complete (PRs #34, #35) |
| 8 | 76–90 | DevOps, tests, and launch | ☐ Not started |

Per-day delivery notes live in [`docs/tasks/`](tasks/) (`PHASE-X-DAY-NN.md`, Days 1–75).

---

## What actually shipped (by area)

- **Backend (`apps/api`, Fastify).** 16 modules: `ai`, `analytics`, `audit`,
  `auth`, `billing`, `crm`, `health`, `notifications`, `properties`, `public`,
  `realtime` (WebSocket), `search`, `settings`, `tenants`, `test-items`,
  `uploads`. Multi-tenant isolation enforced by PostgreSQL RLS.
- **Database (`packages/db`).** Drizzle schema + 13 migrations (0000–0012);
  RLS policies and `security_invoker` analytics views; pgvector for embeddings.
- **Dashboard (`apps/web`).** Routes: `dashboard`, `properties`, `leads`,
  `visits`, `analytics`, `settings` (general / team / billing), plus error and
  loading boundaries. Real-time Kanban, AI listing generation, analytics charts.
- **Marketplace (`apps/marketplace`, port 3001).** SSR listings, detail pages,
  semantic search, clustered map, lead capture, legal pages.
- **Marketing site (`apps/web` `(marketing)`).** Cinematic landing + self-contained
  `/listings`, `/insights`, `/about`, `/contact`, `/privacy`, `/terms`; buyer +
  agent accounts. See [`PHASE-7-LANDING-REVAMP.md`](tasks/PHASE-7-LANDING-REVAMP.md).
- **AI.** Four feature-flagged capabilities (vision, semantic search, lead
  scoring, pricing) with deterministic mocks when keys are absent.

---

## Notable deviations & additions vs. the guide

The plan held closely; the meaningful differences are:

- **No separate `packages/ui`.** Shared UI lives inside `apps/web` (shadcn/ui
  components) — a lighter structure than the guide's target tree. `packages/`
  ships `config`, `db`, and `shared`.
- **Buyer (end-user) accounts added.** The guide only anticipated brokerage/agent
  auth; a separate **buyer identity** (client-side demo session, `/account/*`)
  was added so end users can stay logged in and request tours in one click,
  distinct from the brokerage login. See [`PHASE-7-LANDING-REVAMP.md`](tasks/PHASE-7-LANDING-REVAMP.md).
- **Landing rebuilt several times.** It went from a 3D gallery → cinematic
  photographic hero → the current **self-contained** marketing site. The earlier
  experiments are recorded in `docs/tasks/PHASE-7-3D-LANDING.md` and the
  `PHASE-7-DAY-66..75` notes.
- **Middleware → proxy.** Adopted the Next.js 16 `proxy.ts` convention (auth gate)
  instead of `middleware.ts`.
- **CI lint hardening.** A lint-only hotfix (PR #32) made the `main` branch's
  `Lint & typecheck` job green across all workspace packages.
- **Extra index migration.** `0012_leads_tenant_agent_idx.sql` (leads query perf).

---

## Phase 8 — remaining (Days 76–90)

Not started. Planned scope (full spec kept alongside this repo):

- [ ] **76** — Multi-stage Docker builds for API + worker.
- [ ] **77** — Deploy API + worker to staging (Neon branch + Upstash).
- [ ] **78** — Deploy web + marketplace to Vercel; update CORS.
- [ ] **79** — Full GitHub Actions CI/CD (lint → build → preview; tag → prod).
- [ ] **80** — Sentry + pino request IDs + uptime monitor.
- [ ] **81** — Security hardening + `docs/SECURITY-TEST.md`.
- [ ] **82** — 20–30 Vitest unit/integration tests (critical paths).
- [ ] **83** — Playwright E2E (signup, AI publish, marketplace lead).
- [ ] **84** — Staff-level README (architecture, live demo, ADRs).
- [ ] **85** — 3-minute demo video + `docs/demo-script.md`.
- [ ] **86** — Production deploy (Neon prod, rotated secrets).
- [ ] **87** — Portfolio + LinkedIn + CV update.
- [ ] **88** — `docs/architecture.md` final + `docs/RUNBOOK.md` + ADRs + API docs.
- [ ] **89** — `docs/E2E-MATRIX.md` (10-row integrated flow).
- [ ] **90** — Tag `v1.0.0` + GitHub Release — **launch**.

---

*Last updated: 2026-07-06.*
