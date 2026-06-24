# Phase 6 · Day 57 — Analytics API

> Data for the dashboard charts, with a date-range filter and role-aware scoping.

## Tasks
- [x] **T1** — `packages/shared/src/analytics/analytics.ts`: range schema (`7d|30d|90d`), overview/funnel/agents/views response schemas.
- [x] **T2** — `apps/api/src/modules/analytics/queries/analytics-queries.ts`: `getOverview`, `getFunnel`, `getAgents`, `getViewsSeries` — raw SQL inside `runInTenantContext`; agent names resolved via members.
- [x] **T3** — `apps/api/src/modules/analytics/routes.ts`:
  - `GET /v1/analytics/overview?range=` — total/new leads, conversion rate, active listings, visits this week, property views, avg days to close
  - `GET /v1/analytics/funnel`
  - `GET /v1/analytics/agents`
  - `GET /v1/analytics/views?range=` — daily series for the line chart
- [x] **T4** — Gated by `analytics:read`. **RBAC**: `agent` role is scoped to `assigned_agent_id = self`; managers/owners/viewers see the whole tenant. `analytics:read` granted to `agent` (shared permissions) for self-scoped access.
- [x] **T5** — Registered under `/v1` in `app.ts`.

## Done
`GET /v1/analytics/overview` and friends return correct aggregates for Recharts consumption; agents get a self-scoped view. Verified in `analytics.integration.test.ts`.
