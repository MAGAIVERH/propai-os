import { getRedisClient } from "./redis.js";

/** Max public lead submissions per IP per window. */
export const PUBLIC_LEAD_RATE_LIMIT_MAX = 5;
export const PUBLIC_LEAD_RATE_LIMIT_WINDOW_SECONDS = 60 * 10; // 10 minutes

const PUBLIC_LEAD_KEY_PREFIX = "public:lead:rate:";

export type PublicLeadRateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

function buildKey(ip: string): string {
  return `${PUBLIC_LEAD_KEY_PREFIX}${ip}`;
}

/**
 * Fixed-window IP rate limit for the public lead endpoint.
 *
 * Increments the counter and returns whether the request is allowed. Fails
 * **open** when Redis is not configured/unavailable — dropping a genuine
 * inbound lead is worse than letting an occasional extra request through.
 */
export async function consumePublicLeadRateLimit(ip: string): Promise<PublicLeadRateLimitResult> {
  const redis = getRedisClient();

  if (!redis) {
    return { allowed: true };
  }

  const key = buildKey(ip);

  try {
    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, PUBLIC_LEAD_RATE_LIMIT_WINDOW_SECONDS);
    }

    if (count > PUBLIC_LEAD_RATE_LIMIT_MAX) {
      const ttl = await redis.ttl(key);
      return {
        allowed: false,
        retryAfterSeconds: ttl > 0 ? ttl : PUBLIC_LEAD_RATE_LIMIT_WINDOW_SECONDS,
      };
    }

    return { allowed: true };
  } catch {
    // Redis hiccup — never block a real lead on infra.
    return { allowed: true };
  }
}
