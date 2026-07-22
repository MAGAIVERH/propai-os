# Project status — PropAI OS

**Snapshot of how far the build has progressed against the 90-day development
guide.** Days 1–75 (Phases 0–7) are shipped and merged to `main`; **Phase 8
(Days 76–90 — DevOps, tests, launch) is in progress** — Docker image build in CI,
staging deploy config, security hardening, unit tests, and a mobile-responsive
pass on the landing site (with the unused `apps/marketplace` app removed).

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
| 8 | 76–90 | DevOps, tests, and launch | 🔄 In progress (Days 76–83 shipped) |

Per-day delivery notes live in [`docs/tasks/`](tasks/) (`PHASE-X-DAY-NN.md`).

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
- **Public site (`apps/web` `(marketing)`).** Cinematic landing + self-contained
  `/listings`, `/insights`, `/about`, `/contact`, `/privacy`, `/terms`; buyer +
  agent accounts; mobile-responsive (Day 83). See
  [`PHASE-7-LANDING-REVAMP.md`](tasks/PHASE-7-LANDING-REVAMP.md). The separate
  `apps/marketplace` SEO app (SSR listings, semantic search, clustered map) was
  built in Phase 5 and **removed in Phase 8 (Day 83)** — its public browsing lives
  in `apps/web`; the `/public/*` + `/search/semantic` API routes are unchanged.
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

## Phase 8 — progress (Days 76–90)

In progress. Actual delivery has diverged slightly from the original day plan:

- [x] **76** — Multi-stage Docker build for API + worker (`docker/api/Dockerfile`).
- [~] **77** — Staging deploy **config** prepped (Railway/Neon/Upstash, `.env.staging.example`) — not yet deployed.
- [ ] **78** — Deploy web to Vercel; update CORS. *(marketplace app removed — web only)*
- [x] **79** — CI docker-build job (Buildx + gha cache + runtime smoke) on top of lint/typecheck/test CI (PR #49).
- [ ] **80** — Sentry + pino request IDs + uptime monitor.
- [x] **81** — Security hardening (env-driven trusted origins, log redaction, rate limit, trustProxy) (PR #50).
- [x] **82** — Vitest unit tests for core pure logic (PR #51).
- [x] **83** — Removed unused `apps/marketplace` app + mobile-responsive landing pass (PRs #52, #53).
- [x] **84** — Mobile-responsive + premium pass across the **whole dashboard** (shell, Overview, Leads/Kanban, Properties, Visits, Analytics, Settings, Profile, forms + detail pages) + post-login redirect fix (soft nav → hard nav) and a KPI-card entrance-animation fix. See [`PHASE-8-DAY-84.md`](tasks/PHASE-8-DAY-84.md).
- [ ] **—** — Playwright E2E (signup, AI publish, public lead).
- [ ] **—** — Staff-level README (architecture, live demo, ADRs).
- [ ] **85** — 3-minute demo video + `docs/demo-script.md`.
- [ ] **86** — Production deploy (Neon prod, rotated secrets).
- [ ] **87** — Portfolio + LinkedIn + CV update.
- [ ] **88** — `docs/architecture.md` final + `docs/RUNBOOK.md` + ADRs + API docs.
- [ ] **89** — `docs/E2E-MATRIX.md` (10-row integrated flow).
- [ ] **90** — Tag `v1.0.0` + GitHub Release — **launch**.

---

*Last updated: 2026-07-22.*
