import { requireRedisClient } from "./redis.js";

export const AI_VISION_RATE_LIMIT_MAX = 10;
export const AI_VISION_RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

const AI_VISION_KEY_PREFIX = "ai:vision:";

export type AiVisionRateLimitAllowed = {
  allowed: true;
};

export type AiVisionRateLimitBlocked = {
  allowed: false;
  retryAfterSeconds: number;
};

export type AiVisionRateLimitResult =
  | AiVisionRateLimitAllowed
  | AiVisionRateLimitBlocked;

function buildRateLimitKey(tenantId: string): string {
  return `${AI_VISION_KEY_PREFIX}${tenantId.toLowerCase()}`;
}

async function readCurrentCount(tenantId: string): Promise<number> {
  const redis = requireRedisClient();
  const key = buildRateLimitKey(tenantId);
  const raw = await redis.get(key);

  if (!raw) {
    return 0;
  }

  const parsed = Number.parseInt(raw, 10);

  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Peeks at the fixed-window counter without incrementing.
 * Max 10 AI vision requests per hour per tenant.
 */
export async function checkAiVisionRateLimit(
  tenantId: string,
): Promise<AiVisionRateLimitResult> {
  const redis = requireRedisClient();
  const key = buildRateLimitKey(tenantId);
  const count = await readCurrentCount(tenantId);

  if (count >= AI_VISION_RATE_LIMIT_MAX) {
    const ttl = await redis.ttl(key);
    const retryAfterSeconds =
      ttl > 0 ? ttl : AI_VISION_RATE_LIMIT_WINDOW_SECONDS;

    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true };
}

/** Increments the tenant counter after URL validation, before the LLM call. */
export async function consumeAiVisionRateLimit(tenantId: string): Promise<void> {
  const redis = requireRedisClient();
  const key = buildRateLimitKey(tenantId);
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, AI_VISION_RATE_LIMIT_WINDOW_SECONDS);
  }
}
