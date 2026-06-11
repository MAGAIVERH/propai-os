import Redis from "ioredis";

let cachedClient: Redis | null = null;

export class RedisUnavailableError extends Error {
  constructor(message = "Redis is not configured or unavailable.") {
    super(message);
    this.name = "RedisUnavailableError";
  }
}

function readRedisUrl(): string | null {
  const value = process.env.REDIS_URL?.trim();

  if (!value) {
    return null;
  }

  return value;
}

/** Lazy singleton Redis client from REDIS_URL. Returns null when unset. */
export function getRedisClient(): Redis | null {
  const redisUrl = readRedisUrl();

  if (!redisUrl) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
  }

  return cachedClient;
}

/** Closes the singleton — for tests and graceful shutdown. */
export async function closeRedisClient(): Promise<void> {
  if (!cachedClient) {
    return;
  }

  await cachedClient.quit();
  cachedClient = null;
}

/** Resets the in-memory singleton without connecting — for tests only. */
export function resetRedisClientCache(): void {
  cachedClient = null;
}

export function requireRedisClient(): Redis {
  const client = getRedisClient();

  if (!client) {
    throw new RedisUnavailableError();
  }

  return client;
}
