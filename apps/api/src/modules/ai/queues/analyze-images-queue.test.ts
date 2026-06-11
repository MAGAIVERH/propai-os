import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AI_ANALYZE_IMAGES_QUEUE_NAME,
  type AnalyzeImagesJobData,
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
  AI_ANALYZE_IMAGES_JOB_ATTEMPTS,
  AI_ANALYZE_IMAGES_JOB_BACKOFF_DELAY_MS,
  AI_ANALYZE_IMAGES_JOB_NAME,
  closeAnalyzeImagesQueue,
  enqueueAnalyzeImagesJob,
  getAnalyzeImagesQueue,
  resetAnalyzeImagesQueueCache,
} from "./analyze-images-queue.js";

const tenantId = "550e8400-e29b-41d4-a716-446655440000";

const jobData: AnalyzeImagesJobData = {
  tenantId,
  imageUrls: ["https://storage.example/tenant/property/photo.jpg"],
};

describe("getAnalyzeImagesQueue", () => {
  beforeEach(() => {
    resetAnalyzeImagesQueueCache();
    vi.clearAllMocks();
    mockQueueAdd.mockReset();
    mockQueueClose.mockReset();
    mockQueueConstructor.mockClear();
  });

  afterEach(async () => {
    await closeAnalyzeImagesQueue();
    resetAnalyzeImagesQueueCache();
  });

  it("returns null when BullMQ Redis is not configured", () => {
    mockGetBullMqConnection.mockReturnValue(null);

    expect(getAnalyzeImagesQueue()).toBeNull();
    expect(mockQueueConstructor).not.toHaveBeenCalled();
  });

  it("creates the ai:analyze-images queue with retry and exponential backoff", () => {
    const connection = { id: "redis-connection" };
    mockGetBullMqConnection.mockReturnValue(connection);

    const first = getAnalyzeImagesQueue();
    const second = getAnalyzeImagesQueue();

    expect(first).not.toBeNull();
    expect(second).toBe(first);
    expect(mockQueueConstructor).toHaveBeenCalledTimes(1);
    expect(mockQueueConstructor).toHaveBeenCalledWith(
      AI_ANALYZE_IMAGES_QUEUE_NAME,
      {
        connection,
        defaultJobOptions: {
          attempts: AI_ANALYZE_IMAGES_JOB_ATTEMPTS,
          backoff: {
            type: "exponential",
            delay: AI_ANALYZE_IMAGES_JOB_BACKOFF_DELAY_MS,
          },
        },
      },
    );
  });
});

describe("enqueueAnalyzeImagesJob", () => {
  beforeEach(() => {
    resetAnalyzeImagesQueueCache();
    vi.clearAllMocks();
    mockQueueAdd.mockReset();
    mockQueueClose.mockReset();
    mockGetBullMqConnection.mockReturnValue({});
    mockQueueAdd.mockResolvedValue({ id: "job-123" });
  });

  afterEach(async () => {
    await closeAnalyzeImagesQueue();
    resetAnalyzeImagesQueueCache();
  });

  it("enqueues validated job data and returns the job id", async () => {
    const jobId = await enqueueAnalyzeImagesJob(jobData);

    expect(jobId).toBe("job-123");
    expect(mockQueueAdd).toHaveBeenCalledWith(AI_ANALYZE_IMAGES_JOB_NAME, jobData);
  });
});
