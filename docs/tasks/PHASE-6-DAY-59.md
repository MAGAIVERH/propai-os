# Phase 6 · Day 59 — Export CSV

> The B2B feature brokerages actually ask for.

## Tasks
- [x] **T1** — `apps/api/src/modules/analytics/export-routes.ts`:
  - `GET /v1/analytics/export/leads?format=csv`
  - `GET /v1/analytics/export/properties?format=csv`
- [x] **T2** — RFC-4180 field escaping + leading UTF-8 BOM (so Excel detects UTF-8); `Content-Type: text/csv` + `Content-Disposition: attachment`.
- [x] **T3** — Respects RBAC: gated by `analytics:read`; `agent` role exports only their own leads (`assigned_agent_id`) / properties (`created_by`).
- [x] **T4** — Web: `downloadCsv()` (credentialed fetch → blob → anchor download) wired to the dashboard buttons.

## Done
CSV opens correctly in Excel/Google Sheets with headers and proper escaping. Verified in `analytics.integration.test.ts`.
