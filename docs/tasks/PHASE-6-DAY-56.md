# Phase 6 · Day 56 — Analytics schema and views

> Efficient metrics without crushing the DB: an append-only event stream for
> property views plus three RLS-aware SQL views the API reads from.

## Tasks
- [x] **T1** — `packages/db/src/schema/analytics.ts`: `analytics_events` (id, tenantId, type, propertyId, createdAt) + `analytics_event_type` enum (`property_view`) + indexes.
- [x] **T2** — Migration `0011_analytics_billing.sql`: table + FKs + RLS tenant isolation + `GRANT … TO propai_app`; three views created `WITH (security_invoker = true)` so RLS filters by `app.current_tenant`:
  - `lead_conversion_by_stage` (lead count per stage)
  - `agent_performance` (total/won/lost per `assigned_agent_id`)
  - `avg_days_to_close` (avg `updated_at − created_at` for won leads)
- [x] **T3** — `POST /public/properties/:id/view` beacon records a `property_view` under `runInTenantContext` (best-effort, returns 204). Marketplace fires it from the detail page (`ViewBeacon`).
- [x] **T4** — Exports wired through `schema/index.ts` + db package index.

## Done
Migration applied to the local Docker DB; the three views return correct, tenant-scoped aggregates when queried as `propai_app` with the tenant context set.
