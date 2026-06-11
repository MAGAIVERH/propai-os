import Redis, { type RedisOptions } from "ioredis";

let cachedConnection: Redis | null = null;
let cachedDuplicateConnection: Redis | null = null;

export class BullMqRedisUnavailableError extends Error {
  constructor(message = "BullMQ Redis is not configured or unavailable.") {
    super(message);
    this.name = "BullMqRedisUnavailableError";
  }
}

function readBullMqRedisUrl(): string | null {
  const value = process.env.REDIS_BULLMQ_URL?.trim();

  if (!value) {
    return null;
  }

  return value;
}

function isTlsRedisUrl(redisUrl: string): boolean {
  return redisUrl.startsWith("rediss://");
}

/** ioredis options required by BullMQ workers (blocking commands) and Upstash TLS. */
export function buildBullMqRedisOptions(redisUrl: string): RedisOptions {
  const options: RedisOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  };

  if (isTlsRedisUrl(redisUrl)) {
    options.tls = {};
  }

  return options;
}

function createBullMqRedisClient(redisUrl: string): Redis {
  return new Redis(redisUrl, buildBullMqRedisOptions(redisUrl));
}

/**
 * Lazy singleton Redis connection for BullMQ producers and workers.
 * Uses REDIS_BULLMQ_URL (Upstash `rediss://` in production).
 */
export function getBullMqConnection(): Redis | null {
  const redisUrl = readBullMqRedisUrl();

  if (!redisUrl) {
    return null;
  }

  if (!cachedConnection) {
    cachedConnection = createBullMqRedisClient(redisUrl);
  }

  return cachedConnection;
}

/**
 * Duplicate connection for BullMQ workers/events (blocking client).
 * BullMQ requires a separate ioredis instance from the queue producer connection.
 */
export function getBullMqDuplicateConnection(): Redis | null {
  const primary = getBullMqConnection();

  if (!primary) {
    return null;
  }

  if (!cachedDuplicateConnection) {
    cachedDuplicateConnection = primary.duplicate();
  }

  return cachedDuplicateConnection;
}

export function requireBullMqConnection(): Redis {
  const client = getBullMqConnection();

  if (!client) {
    throw new BullMqRedisUnavailableError();
  }

  return client;
}

/** Closes BullMQ Redis singletons — for tests and graceful shutdown. */
export async function closeBullMqConnections(): Promise<void> {
  const duplicate = cachedDuplicateConnection;
  const primary = cachedConnection;

  cachedDuplicateConnection = null;
  cachedConnection = null;

  if (duplicate) {
    await duplicate.quit();
  }

  if (primary) {
    await primary.quit();
  }
}

/** Resets in-memory singletons without connecting — for tests only. */
export function resetBullMqConnectionCache(): void {
  cachedDuplicateConnection = null;
  cachedConnection = null;
}
