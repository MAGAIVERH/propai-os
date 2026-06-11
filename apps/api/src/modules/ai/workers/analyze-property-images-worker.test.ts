import type { AnalyzeImagesJobData } from "@propai/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAnalyzePropertyImages,
  mockWorkerClose,
  mockGetBullMqDuplicateConnection,
  MockWorker,
  mockWorkerConstructor,
} = vi.hoisted(() => {
  const mockAnalyzePropertyImages = vi.fn();
  const mockWorkerClose = vi.fn();
  const mockGetBullMqDuplicateConnection = vi.fn();
  const mockWorkerConstructor = vi.fn();

  class MockWorker {
    close = mockWorkerClose;

    constructor(
      queueName: string,
      processor: unknown,
      options: {
        connection: unknown;
        concurrency: number;
      },
    ) {
      mockWorkerConstructor(queueName, processor, options);
    }
  }

  return {
    mockAnalyzePropertyImages,
    mockWorkerClose,
    mockGetBullMqDuplicateConnection,
    MockWorker,
    mockWorkerConstructor,
  };
});

vi.mock("bullmq", () => ({
  Worker: MockWorker,
}));

vi.mock("../../../lib/redis-bullmq.js", () => ({
  BullMqRedisUnavailableError: class BullMqRedisUnavailableError extends Error {
    constructor(message = "BullMQ Redis is not configured or unavailable.") {
      super(message);
      this.name = "BullMqRedisUnavailableError";
    }
  },
  getBullMqDuplicateConnection: mockGetBullMqDuplicateConnection,
}));

vi.mock("../analyze-property-images-service.js", () => ({
  analyzePropertyImages: mockAnalyzePropertyImages,
}));

import {
  AI_ANALYZE_IMAGES_QUEUE_NAME,
} from "@propai/shared";
import {
  ANALYZE_PROPERTY_IMAGES_WORKER_CONCURRENCY,
  closeAnalyzePropertyImagesWorker,
  createAnalyzePropertyImagesWorker,
  processAnalyzePropertyImagesJob,
  resetAnalyzePropertyImagesWorkerCache,
} from "./analyze-property-images-worker.js";

const tenantId = "550e8400-e29b-41d4-a716-446655440000";

const jobData: AnalyzeImagesJobData = {
  tenantId,
  imageUrls: ["https://storage.example/tenant/property/photo.jpg"],
};

describe("processAnalyzePropertyImagesJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAnalyzePropertyImages.mockReset();
    mockAnalyzePropertyImages.mockResolvedValue({ bedrooms: 3 });
  });

  it("calls analyzePropertyImages with validated image URLs", async () => {
    const analysis = { bedrooms: 4, bathrooms: 2, sqFt: 1800 };
    mockAnalyzePropertyImages.mockResolvedValue(analysis);

    const result = await processAnalyzePropertyImagesJob({
      data: jobData,
    } as Parameters<typeof processAnalyzePropertyImagesJob>[0]);

    expect(mockAnalyzePropertyImages).toHaveBeenCalledWith(jobData.imageUrls);
    expect(result).toEqual(analysis);
  });
});

describe("createAnalyzePropertyImagesWorker", () => {
  beforeEach(() => {
    resetAnalyzePropertyImagesWorkerCache();
    vi.clearAllMocks();
    mockWorkerClose.mockReset();
    mockWorkerConstructor.mockClear();
    mockGetBullMqDuplicateConnection.mockReset();
  });

  afterEach(async () => {
    await closeAnalyzePropertyImagesWorker();
    resetAnalyzePropertyImagesWorkerCache();
  });

  it("throws when BullMQ Redis is not configured", () => {
    mockGetBullMqDuplicateConnection.mockReturnValue(null);

    expect(() => createAnalyzePropertyImagesWorker()).toThrow(
      "BullMQ Redis is not configured or unavailable.",
    );
  });

  it("creates a worker on the analyze-images queue", () => {
    const connection = { id: "duplicate-connection" };
    mockGetBullMqDuplicateConnection.mockReturnValue(connection);

    const first = createAnalyzePropertyImagesWorker();
    const second = createAnalyzePropertyImagesWorker();

    expect(first).toBe(second);
    expect(mockWorkerConstructor).toHaveBeenCalledTimes(1);
    expect(mockWorkerConstructor).toHaveBeenCalledWith(
      AI_ANALYZE_IMAGES_QUEUE_NAME,
      processAnalyzePropertyImagesJob,
      {
        connection,
        concurrency: ANALYZE_PROPERTY_IMAGES_WORKER_CONCURRENCY,
      },
    );
  });
});
