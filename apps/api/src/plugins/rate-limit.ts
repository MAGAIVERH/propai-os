import rateLimit from "@fastify/rate-limit";
import fp from "fastify-plugin";

/**
 * Global IP rate limit (baseline DoS / abuse protection). Individual routes can
 * tighten this via `config.rateLimit` (see the auth routes for a strict bucket
 * against credential brute-force).
 *
 * Enabled in production/staging (NODE_ENV=production) only — opt in elsewhere
 * with RATE_LIMIT_ENABLED=true. Off by default in dev and tests: the suite runs
 * single-process (fileParallelism: false) with a shared in-memory store, so an
 * always-on limiter would reject requests once the suite crosses the budget.
 * In-memory store is fine per-instance for staging; swap for the Redis store
 * when running multiple replicas that must share a budget.
 */
export const GLOBAL_RATE_LIMIT_MAX = 200;
export const GLOBAL_RATE_LIMIT_WINDOW = "1 minute";

export function isRateLimitEnabled(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.RATE_LIMIT_ENABLED === "true"
  );
}

export const rateLimitPlugin = fp(async (app) => {
  if (!isRateLimitEnabled()) {
    return;
  }

  await app.register(rateLimit, {
    global: true,
    max: GLOBAL_RATE_LIMIT_MAX,
    timeWindow: GLOBAL_RATE_LIMIT_WINDOW,
    // Don't reject genuine traffic if the limiter itself errors.
    skipOnError: true,
  });
});

/** Strict per-IP bucket for credential endpoints (brute-force defense). */
export const AUTH_RATE_LIMIT = {
  max: 10,
  timeWindow: "1 minute",
} as const;
