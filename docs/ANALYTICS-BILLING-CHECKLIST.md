# Analytics & Billing Checklist (Phase 6 · Days 56–65)

Sign-off for the analytics, billing, onboarding, team, and branding work. Status: **100%**.

## Analytics schema & events (Day 56)
- [x] `analytics_events` table + `analytics_event_type` enum + RLS tenant isolation
- [x] `POST /public/properties/:id/view` beacon records `property_view`
- [x] SQL views (security_invoker): `lead_conversion_by_stage`, `agent_performance`, `avg_days_to_close`
- [x] Migration `0011_analytics_billing.sql` applied; views verified under RLS

## Analytics API (Day 57)
- [x] `GET /v1/analytics/overview?range=7d|30d|90d` — KPIs (leads, conversion, active listings, visits this week, views, avg days to close)
- [x] `GET /v1/analytics/funnel` — count per pipeline stage
- [x] `GET /v1/analytics/agents` — per-agent metrics (with names)
- [x] `GET /v1/analytics/views?range=` — daily property-view series
- [x] Gated by `analytics:read`; agents are scoped to their own leads

## Analytics dashboard (Day 58)
- [x] `/analytics` — KPI cards, funnel BarChart, agent leaderboard, property-views area chart (Recharts)
- [x] GSAP mount animation on KPI cards; Lenis smooth scroll
- [x] Range selector (7/30/90 days)

## CSV export (Day 59)
- [x] `GET /v1/analytics/export/leads?format=csv`
- [x] `GET /v1/analytics/export/properties?format=csv`
- [x] RFC-4180 escaping + UTF-8 BOM (opens in Excel/Sheets); RBAC + agent scoping
- [x] Dashboard download buttons

## Stripe & feature gates (Day 60)
- [x] Free (5 listings / 2 agents) vs Pro ($49/mo, unlimited) plans
- [x] `POST /v1/billing/checkout` — Stripe Checkout Session
- [x] `POST /v1/billing/portal` — Stripe Customer Portal
- [x] `POST /webhooks/stripe` — raw-body signature verify, handles subscription events
- [x] Publish blocked over the Free listing limit (402); invite blocked over the agent limit (402)
- [x] Graceful 503 when Stripe keys are unset

## Billing UI (Day 61)
- [x] `/settings/billing` — current plan, usage bars, upgrade button, manage-billing (portal) link
- [x] Over-limit banner on the Free plan

## Onboarding (Day 62)
- [x] `GET /v1/onboarding` step status + `POST /v1/onboarding/complete`
- [x] Dashboard "Complete your setup" checklist widget (agency → invite → property)
- [x] US timezone selector (default America/New_York)

## Team management (Day 63)
- [x] `/settings/team` — members, roles, pending invitations
- [x] Invite by email (Better Auth invitation) with role
- [x] Change role / remove member (owner only)

## Tenant settings & branding (Day 64)
- [x] `/settings/general` — agency name, timezone, brand color, logo URL, marketplace slug
- [x] `GET /public/branding` + marketplace applies agency name, logo, and brand color

## Buffer & signoff (Day 65)
- [x] Stripe webhook idempotency via `stripe_events`
- [x] Analytics RBAC: agents see only their metrics; managers/owners see all
- [x] This checklist at 100%
- [x] Integration tests: analytics, billing/feature-gate, settings/team/onboarding (all green in isolation)

## Notes
- Stripe is optional in dev: set `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` to enable checkout/portal. Without them, billing status still reports usage/limits and feature gates still enforce Free limits.
- API integration tests must run against the local Docker DB (see PHASE-6-DAY-65.md for the env override).
