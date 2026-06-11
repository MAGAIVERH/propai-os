import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AI_VISION_RATE_LIMIT_MAX,
  AI_VISION_RATE_LIMIT_WINDOW_SECONDS,
  checkAiVisionRateLimit,
  consumeAiVisionRateLimit,
} from "./ai-vision-rate-limit.js";
import { resetRedisClientCache } from "./redis.js";

const tenantId = "550e8400-e29b-41d4-a716-446655440000";

const mockRedis = {
  get: vi.fn(),
  incr: vi.fn(),
  expire: vi.fn(),
  ttl: vi.fn(),
};

vi.mock("./redis.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./redis.js")>();

  return {
    ...actual,
    requireRedisClient: vi.fn(() => mockRedis),
  };
});

describe("checkAiVisionRateLimit", () => {
  beforeEach(() => {
    resetRedisClientCache();
    vi.clearAllMocks();
    mockRedis.get.mockReset();
    mockRedis.incr.mockReset();
    mockRedis.expire.mockReset();
    mockRedis.ttl.mockReset();
  });

  afterEach(() => {
    resetRedisClientCache();
  });

  it("allows requests under the hourly limit without incrementing", async () => {
    mockRedis.get.mockResolvedValue("5");

    const result = await checkAiVisionRateLimit(tenantId);

    expect(result).toEqual({ allowed: true });
    expect(mockRedis.incr).not.toHaveBeenCalled();
  });

  it("blocks when the counter is already at the limit", async () => {
    mockRedis.get.mockResolvedValue(String(AI_VISION_RATE_LIMIT_MAX));
    mockRedis.ttl.mockResolvedValue(1800);

    const result = await checkAiVisionRateLimit(tenantId);

    expect(result).toEqual({
      allowed: false,
      retryAfterSeconds: 1800,
    });
  });

  it("falls back to the full window when TTL is missing", async () => {
    mockRedis.get.mockResolvedValue(String(AI_VISION_RATE_LIMIT_MAX));
    mockRedis.ttl.mockResolvedValue(-1);

    const result = await checkAiVisionRateLimit(tenantId);

    expect(result).toEqual({
      allowed: false,
      retryAfterSeconds: AI_VISION_RATE_LIMIT_WINDOW_SECONDS,
    });
  });
});

describe("consumeAiVisionRateLimit", () => {
  beforeEach(() => {
    resetRedisClientCache();
    vi.clearAllMocks();
    mockRedis.incr.mockReset();
    mockRedis.expire.mockReset();
  });

  it("increments the counter and sets TTL on first consume", async () => {
    mockRedis.incr.mockResolvedValue(1);

    await consumeAiVisionRateLimit(tenantId);

    expect(mockRedis.incr).toHaveBeenCalledWith(`ai:vision:${tenantId}`);
    expect(mockRedis.expire).toHaveBeenCalledWith(
      `ai:vision:${tenantId}`,
      AI_VISION_RATE_LIMIT_WINDOW_SECONDS,
    );
  });

  it("does not reset TTL after the first consume in the window", async () => {
    mockRedis.incr.mockResolvedValue(11);

    await consumeAiVisionRateLimit(tenantId);

    expect(mockRedis.expire).not.toHaveBeenCalled();
  });
});
