import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BullMqRedisUnavailableError,
  buildBullMqRedisOptions,
  closeBullMqConnections,
  getBullMqConnection,
  getBullMqDuplicateConnection,
  requireBullMqConnection,
  resetBullMqConnectionCache,
} from "./redis-bullmq.js";

const REDIS_BULLMQ_URL_ENV = "REDIS_BULLMQ_URL";

describe("buildBullMqRedisOptions", () => {
  it("sets BullMQ worker options for plain redis URLs", () => {
    expect(buildBullMqRedisOptions("redis://localhost:6379")).toEqual({
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });
  });

  it("enables TLS for Upstash rediss URLs", () => {
    expect(
      buildBullMqRedisOptions(
        "rediss://default:token@us1-example.upstash.io:6379",
      ),
    ).toEqual({
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      tls: {},
    });
  });
});

describe("getBullMqConnection", () => {
  const originalRedisUrl = process.env[REDIS_BULLMQ_URL_ENV];

  beforeEach(() => {
    resetBullMqConnectionCache();
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    await closeBullMqConnections();
    resetBullMqConnectionCache();

    if (originalRedisUrl === undefined) {
      delete process.env[REDIS_BULLMQ_URL_ENV];
    } else {
      process.env[REDIS_BULLMQ_URL_ENV] = originalRedisUrl;
    }
  });

  it("returns null when REDIS_BULLMQ_URL is unset", () => {
    delete process.env[REDIS_BULLMQ_URL_ENV];

    expect(getBullMqConnection()).toBeNull();
  });

  it("returns a lazy singleton when REDIS_BULLMQ_URL is set", () => {
    process.env[REDIS_BULLMQ_URL_ENV] = "redis://localhost:6379";

    const first = getBullMqConnection();
    const second = getBullMqConnection();

    expect(first).not.toBeNull();
    expect(second).toBe(first);
    expect(first?.options.maxRetriesPerRequest).toBeNull();
    expect(first?.options.lazyConnect).toBe(true);
  });

  it("creates a duplicate connection for BullMQ workers", () => {
    process.env[REDIS_BULLMQ_URL_ENV] = "redis://localhost:6379";

    const primary = getBullMqConnection();
    const duplicate = getBullMqDuplicateConnection();
    const duplicateAgain = getBullMqDuplicateConnection();

    expect(primary).not.toBeNull();
    expect(duplicate).not.toBeNull();
    expect(duplicate).not.toBe(primary);
    expect(duplicateAgain).toBe(duplicate);
    expect(duplicate?.options.maxRetriesPerRequest).toBeNull();
  });

  it("throws BullMqRedisUnavailableError from requireBullMqConnection when unset", () => {
    delete process.env[REDIS_BULLMQ_URL_ENV];

    expect(() => requireBullMqConnection()).toThrow(BullMqRedisUnavailableError);
  });
});
