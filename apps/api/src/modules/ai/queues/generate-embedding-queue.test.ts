import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AI_GENERATE_EMBEDDING_QUEUE_NAME,
  type GenerateEmbeddingJobData,
} from "@propai/shared";

const {
  mockQueueAdd,
  mockQueueClose,
  mockQueueConstructor,
  mockGetBullMqConnection,
  MockQueue,
} = vi.hoisted(() => {
  const mockQueueAdd = vi.fn();
  const mockQueueClose = vi.fn();
  const mockGetBullMqConnection = vi.fn();
  const mockQueueConstructor = vi.fn();

  class MockQueue {
    add = mockQueueAdd;
    close = mockQueueClose;

    constructor(
      name: string,
      options: {
        connection: unknown;
        defaultJobOptions: {
          attempts: number;
          backoff: { type: string; delay: number };
        };
      },
    ) {
      mockQueueConstructor(name, options);
    }
  }

  return {
    mockQueueAdd,
    mockQueueClose,
    mockQueueConstructor,
    mockGetBullMqConnection,
    MockQueue,
  };
});

vi.mock("bullmq", () => ({
  Queue: MockQueue,
}));

vi.mock("../../../lib/redis-bullmq.js", () => ({
  BullMqRedisUnavailableError: class BullMqRedisUnavailableError extends Error {
    constructor(message = "BullMQ Redis is not configured or unavailable.") {
      super(message);
      this.name = "BullMqRedisUnavailableError";
    }
  },
  getBullMqConnection: mockGetBullMqConnection,
}));

import {
  AI_GENERATE_EMBEDDING_JOB_ATTEMPTS,
  AI_GENERATE_EMBEDDING_JOB_BACKOFF_DELAY_MS,
  AI_GENERATE_EMBEDDING_JOB_NAME,
  closeGenerateEmbeddingQueue,
  enqueueGenerateEmbeddingJob,
  getGenerateEmbeddingQueue,
  resetGenerateEmbeddingQueueCache,
} from "./generate-embedding-queue.js";

const tenantId = "550e8400-e29b-41d4-a716-446655440000";
const propertyId = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

const jobData: GenerateEmbeddingJobData = {
  tenantId,
  propertyId,
};

describe("getGenerateEmbeddingQueue", () => {
  beforeEach(() => {
    resetGenerateEmbeddingQueueCache();
    vi.clearAllMocks();
    mockQueueAdd.mockReset();
    mockQueueClose.mockReset();
    mockQueueConstructor.mockClear();
  });

  afterEach(async () => {
    await closeGenerateEmbeddingQueue();
    resetGenerateEmbeddingQueueCache();
  });

  it("returns null when BullMQ Redis is not configured", () => {
    mockGetBullMqConnection.mockReturnValue(null);

    expect(getGenerateEmbeddingQueue()).toBeNull();
    expect(mockQueueConstructor).not.toHaveBeenCalled();
  });

  it("creates the ai:generate-embedding queue with retry and exponential backoff", () => {
    const connection = { id: "redis-connection" };
    mockGetBullMqConnection.mockReturnValue(connection);

    const first = getGenerateEmbeddingQueue();
    const second = getGenerateEmbeddingQueue();

    expect(first).not.toBeNull();
    expect(second).toBe(first);
    expect(mockQueueConstructor).toHaveBeenCalledTimes(1);
    expect(mockQueueConstructor).toHaveBeenCalledWith(
      AI_GENERATE_EMBEDDING_QUEUE_NAME,
      {
        connection,
        defaultJobOptions: {
          attempts: AI_GENERATE_EMBEDDING_JOB_ATTEMPTS,
          backoff: {
            type: "exponential",
            delay: AI_GENERATE_EMBEDDING_JOB_BACKOFF_DELAY_MS,
          },
        },
      },
    );
  });
});

describe("enqueueGenerateEmbeddingJob", () => {
  beforeEach(() => {
    resetGenerateEmbeddingQueueCache();
    vi.clearAllMocks();
    mockQueueAdd.mockReset();
    mockQueueClose.mockReset();
    mockGetBullMqConnection.mockReturnValue({});
    mockQueueAdd.mockResolvedValue({ id: "job-456" });
  });

  afterEach(async () => {
    await closeGenerateEmbeddingQueue();
    resetGenerateEmbeddingQueueCache();
  });

  it("enqueues validated job data and returns the job id", async () => {
    const jobId = await enqueueGenerateEmbeddingJob(jobData);

    expect(jobId).toBe("job-456");
    expect(mockQueueAdd).toHaveBeenCalledWith(
      AI_GENERATE_EMBEDDING_JOB_NAME,
      jobData,
    );
  });
});
