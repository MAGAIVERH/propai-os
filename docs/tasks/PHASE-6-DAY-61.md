# Phase 6 · Day 61 — Billing UI

> The owner manages their subscription.

## Tasks
- [x] **T1** — `modules/settings/components/billing-panel.tsx`: current plan badge, usage bars (active listings, team members) with over-limit highlighting, Pro feature list ($49/mo).
- [x] **T2** — Upgrade button → `POST /v1/billing/checkout` → redirect to Stripe; "Manage billing" → `POST /v1/billing/portal` → Customer Portal.
- [x] **T3** — Over-limit banner shown on the Free plan when listings/agents are maxed.
- [x] **T4** — Graceful: when billing isn't configured (`billingEnabled=false`), the upgrade/portal buttons are disabled with an explanatory note.
- [x] **T5** — `/settings/billing` page + settings sub-nav (General / Team / Billing).

## Done
A Free tenant sees usage, an upgrade prompt, and an over-limit banner at the listing limit; checkout/portal redirect to Stripe when configured.
