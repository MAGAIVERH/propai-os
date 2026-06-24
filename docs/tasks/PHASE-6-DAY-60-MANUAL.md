# Day 60 — Manual: Stripe test-mode billing

Billing degrades gracefully without Stripe keys (status + feature gates still
work; checkout/portal return 503). To exercise the full flow:

## Env (repo root `.env`)
```
STRIPE_SECRET_KEY=sk_test_...            # from the Stripe test dashboard
STRIPE_PRO_PRICE_ID=price_...            # a recurring $49/mo test Price
STRIPE_WEBHOOK_SECRET=whsec_...          # from `stripe listen` (below)
WEB_APP_URL=http://localhost:3000        # dashboard origin for redirects
```
Create a Product "Pro" with a $49/month recurring Price in the Stripe test
dashboard and copy its `price_…` id.

## Webhook (Stripe CLI)
```bash
stripe login
stripe listen --forward-to http://localhost:3333/webhooks/stripe
# copy the printed whsec_... into STRIPE_WEBHOOK_SECRET and restart the API
```

## Steps
1. Sign in as an owner → `/settings/billing` shows the **Free** plan with usage bars.
2. Click **Upgrade to Pro** → redirected to Stripe Checkout. Pay with the test
   card `4242 4242 4242 4242`, any future expiry/CVC.
3. Stripe fires `checkout.session.completed` + `customer.subscription.created`
   → the webhook flips the tenant to **Pro / active**. Return to `/settings/billing`
   → now **Pro**, limits show ∞.
4. **Manage billing** opens the Stripe Customer Portal (cancel/update).
5. Cancel in the portal → `customer.subscription.deleted` → tenant back to **Free**.

## Feature gate (no Stripe needed)
On the Free plan, publish 5 active listings, then try a 6th → `402 Payment Required`.
Invite a 3rd member → `402`. Drafts are always allowed.

## Idempotency
Re-deliver an event from the Stripe CLI (`stripe events resend <id>`): the second
delivery returns `200 {duplicate:true}` and changes nothing (`stripe_events` table).
