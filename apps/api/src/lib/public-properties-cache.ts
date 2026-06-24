import { getRedisClient } from "./redis.js";

/** Cached public listing responses live for 5 minutes (Day 53). */
export const PUBLIC_PROPERTIES_CACHE_TTL_SECONDS = 60 * 5;

const KEY_PREFIX = "public:properties:";

export type CacheStatus = "HIT" | "MISS" | "BYPASS";

/**
 * Builds a stable cache key for a list query. The variant string should be a
 * deterministic serialization of the filter/pagination params (excluding the
 * tenantId, which is the namespace).
 */
export function buildPublicPropertiesCacheKey(tenantId: string, variant: string): string {
  return `${KEY_PREFIX}${tenantId}:${variant}`;
}

/** Deterministic variant key from the parsed query (sorted entries). */
export function serializeListVariant(query: Record<string, unknown>): string {
  const entries = Object.entries(query)
    .filter(([key, value]) => key !== "tenantId" && value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${String(value)}`);

  return entries.length > 0 ? entries.join("&") : "all";
}

export async function readPublicPropertiesCache<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();

  if (!redis) {
    return null;
  }

  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function writePublicPropertiesCache(key: string, value: unknown): Promise<void> {
  const redis = getRedisClient();

  if (!redis) {
    return;
  }

  try {
    await redis.set(key, JSON.stringify(value), "EX", PUBLIC_PROPERTIES_CACHE_TTL_SECONDS);
  } catch {
    // Cache writes are best-effort.
  }
}

/**
 * Invalidates every cached list page for a tenant. Called when a property is
 * created, updated, published, or removed so the public grid never serves
 * stale inventory.
 */
export async function invalidatePublicPropertiesCache(tenantId: string): Promise<void> {
  const redis = getRedisClient();

  if (!redis) {
    return;
  }

  const matchPattern = `${KEY_PREFIX}${tenantId}:*`;

  try {
    const stream = redis.scanStream({ match: matchPattern, count: 100 });
    const pipeline = redis.pipeline();
    let hasKeys = false;

    for await (const keys of stream) {
      for (const key of keys as string[]) {
        pipeline.del(key);
        hasKeys = true;
      }
    }

    if (hasKeys) {
      await pipeline.exec();
    }
  } catch {
    // Best-effort — a stale entry expires within the TTL window anyway.
  }
}
