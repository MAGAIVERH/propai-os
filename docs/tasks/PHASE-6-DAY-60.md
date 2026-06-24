# Phase 6 · Day 60 — Stripe integration

> The SaaS monetization story: Free vs Pro, checkout, webhook, and feature gates.

## Tasks
- [x] **T1** — `packages/shared/src/billing/billing.ts`: plans, `PLAN_LIMITS` (Free: 5 listings / 2 agents; Pro: unlimited), `BillingStatus`, checkout/portal schemas.
- [x] **T2** — DB: billing columns on `tenant_settings` (plan, subscription_status, stripe_customer_id, stripe_subscription_id) + `stripe_events` table (idempotency) — migration `0011`.
- [x] **T3** — `apps/api/src/lib/stripe-client.ts`: lazy Stripe client from `STRIPE_SECRET_KEY` (null when unset → routes return 503).
- [x] **T4** — `modules/billing/routes.ts` (gated `billing:manage`, owner): `GET /v1/billing` (plan + usage + limits), `POST /v1/billing/checkout` (Checkout Session), `POST /v1/billing/portal` (Customer Portal; lazily creates the Stripe customer).
- [x] **T5** — `modules/billing/webhook-routes.ts`: `POST /webhooks/stripe` — **raw-body** parser, signature verification, idempotency via `stripe_events`, handles `checkout.session.completed` + `customer.subscription.{created,updated,deleted}` → updates plan/status. Registered public (before tenant context).
- [x] **T6** — Feature gates (`modules/billing/feature-gate.ts`): `checkListingLimit` blocks publishing over the Free listing cap (402) in `POST/PATCH /v1/properties`; `checkAgentLimit` blocks invites over the agent cap (402) in `brokerage-invite`.

## Done
Free tenants are capped at 5 active listings / 2 members; Stripe test-mode checkout activates Pro via the webhook. Verified in `billing.integration.test.ts` (status + 402 gate). See `PHASE-6-DAY-60-MANUAL.md` for live Stripe testing.
