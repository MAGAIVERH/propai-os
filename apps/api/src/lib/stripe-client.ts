import Stripe from "stripe";

let cached: Stripe | null = null;

function readKey(): string | null {
  const value = process.env.STRIPE_SECRET_KEY?.trim();
  return value && value.length > 0 ? value : null;
}

/** Lazy Stripe client from STRIPE_SECRET_KEY. Returns null when unconfigured. */
export function getStripeClient(): Stripe | null {
  const key = readKey();
  if (!key) return null;
  if (!cached) {
    cached = new Stripe(key, { apiVersion: "2025-10-29.clover" });
  }
  return cached;
}

/** True when Stripe checkout/portal can be used (secret key present). */
export function isBillingEnabled(): boolean {
  return readKey() !== null;
}

export function getStripeProPriceId(): string | null {
  const value = process.env.STRIPE_PRO_PRICE_ID?.trim();
  return value && value.length > 0 ? value : null;
}

export function getStripeWebhookSecret(): string | null {
  const value = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  return value && value.length > 0 ? value : null;
}

/** Base URL the dashboard runs on, for Stripe redirect URLs. */
export function getBillingReturnBaseUrl(): string {
  return (
    process.env.WEB_APP_URL?.trim() ||
    process.env.BETTER_AUTH_URL?.trim() ||
    "http://localhost:3000"
  );
}

/** Resets the cached client — for tests. */
export function resetStripeClientCache(): void {
  cached = null;
}
