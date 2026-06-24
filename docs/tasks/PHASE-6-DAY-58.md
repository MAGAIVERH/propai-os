# Phase 6 · Day 58 — Analytics dashboard UI

> The manager's view of business performance — animated charts from real API data.

## Tasks
- [x] **T1** — Web data layer: `modules/analytics/queries/get-analytics.ts` (typed fetch + `downloadCsv`), `hooks/use-analytics.ts` (React Query hooks per range).
- [x] **T2** — `modules/analytics/components/analytics-dashboard.tsx`: KPI cards, range tabs (7/30/90), CSV export buttons.
- [x] **T3** — Charts (Recharts): `funnel-chart.tsx` (vertical BarChart, won=green/lost=red), `views-chart.tsx` (AreaChart), `agent-leaderboard.tsx` (table).
- [x] **T4** — GSAP: KPI cards animate in on mount (`useGSAP`, staggered), skipped under `prefers-reduced-motion`.
- [x] **T5** — Lenis smooth scroll on the page (dynamic import, disabled under reduced motion).
- [x] **T6** — `/analytics` page renders `<AnalyticsDashboard>`.

## Done
The dashboard loads with animated charts and live KPIs; the range selector re-fetches; CSV buttons download leads/properties.

> Note: `lenis` added to `apps/web`. The Next.js web build runs in CI (Linux); a pre-existing Windows-local prerender quirk on `/properties/new` is unrelated.
