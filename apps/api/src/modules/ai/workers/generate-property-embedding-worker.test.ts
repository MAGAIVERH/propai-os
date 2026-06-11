import type { GenerateEmbeddingJobData } from "@propai/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGeneratePropertyEmbedding,
  mockRunInTenantContext,
  mockWorkerClose,
  mockGetBullMqDuplicateConnection,
  MockWorker,
  mockWorkerConstructor,
} = vi.hoisted(() => {
  const mockGeneratePropertyEmbedding = vi.fn();
  const mockRunInTenantContext = vi.fn();
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
    mockGeneratePropertyEmbedding,
    mockRunInTenantContext,
    mockWorkerClose,
    mockGetBullMqDuplicateConnection,
    MockWorker,
    mockWorkerConstructor,
  };
});

vi.mock("bullmq", () => ({
  Worker: MockWorker,
}));

vi.mock("@propai/db", () => ({
  properties: {
    id: "id",
    title: "title",
    description: "description",
    status: "status",
    softDeletedAt: "softDeletedAt",
    embedding: "embedding",
    embeddingUpdatedAt: "embeddingUpdatedAt",
  },
  propertyFeatures: {
    featureKey: "featureKey",
    featureValue: "featureValue",
    propertyId: "propertyId",
  },
  runInTenantContext: mockRunInTenantContext,
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

vi.mock("../generate-property-embedding.js", () => ({
  generatePropertyEmbedding: mockGeneratePropertyEmbedding,
}));

import { AI_GENERATE_EMBEDDING_QUEUE_NAME } from "@propai/shared";
import {
  closeGeneratePropertyEmbeddingWorker,
  createGeneratePropertyEmbeddingWorker,
  GENERATE_PROPERTY_EMBEDDING_WORKER_CONCURRENCY,
  loadPropertyEmbeddingSource,
  persistPropertyEmbedding,
  processGeneratePropertyEmbeddingJob,
  resetGeneratePropertyEmbeddingWorkerCache,
} from "./generate-property-embedding-worker.js";

const tenantId = "550e8400-e29b-41d4-a716-446655440000";
const propertyId = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

const jobData: GenerateEmbeddingJobData = {
  tenantId,
  propertyId,
};

const embedding = Array.from({ length: 1536 }, (_, index) => index / 1536);

describe("loadPropertyEmbeddingSource", () => {
  beforeEach(() => {
    mockRunInTenantContext.mockReset();
  });

  it("returns null when property is not active", async () => {
    mockRunInTenantContext.mockImplementation(async (_tenantId, fn) => {
      const tx = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  title: "Draft Home",
                  description: null,
                  status: "draft",
                  softDeletedAt: null,
                },
              ]),
            }),
          }),
        }),
      };

      return fn(tx);
    });

    const result = await loadPropertyEmbeddingSource(tenantId, propertyId);

    expect(result).toBeNull();
  });
});

describe("processGeneratePropertyEmbeddingJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGeneratePropertyEmbedding.mockReset();
    mockGeneratePropertyEmbedding.mockResolvedValue(embedding);
    mockRunInTenantContext.mockReset();
  });

  it("skips when property is not indexable", async () => {
    mockRunInTenantContext.mockResolvedValueOnce(null);

    await processGeneratePropertyEmbeddingJob({
      data: jobData,
    } as Parameters<typeof processGeneratePropertyEmbeddingJob>[0]);

    expect(mockGeneratePropertyEmbedding).not.toHaveBeenCalled();
    expect(mockRunInTenantContext).toHaveBeenCalledTimes(1);
  });

  it("generates and persists embedding for active property", async () => {
    const source = {
      title: "Spacious Ranch",
      description: "Updated kitchen.",
      features: [{ featureKey: "pool", featureValue: "true" }],
    };

    mockRunInTenantContext
      .mockResolvedValueOnce(source)
      .mockResolvedValueOnce(undefined);

    await processGeneratePropertyEmbeddingJob({
      data: jobData,
    } as Parameters<typeof processGeneratePropertyEmbeddingJob>[0]);

    expect(mockGeneratePropertyEmbedding).toHaveBeenCalledWith(
      "Spacious Ranch\nUpdated kitchen.\npool: true",
    );
    expect(mockRunInTenantContext).toHaveBeenCalledTimes(2);
  });
});

describe("persistPropertyEmbedding", () => {
  beforeEach(() => {
    mockRunInTenantContext.mockReset();
    mockRunInTenantContext.mockResolvedValue(undefined);
  });

  it("updates embedding columns in tenant context", async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });
    const tx = { update: mockUpdate };

    mockRunInTenantContext.mockImplementation(async (_tenantId, fn) => fn(tx));

    await persistPropertyEmbedding(tenantId, propertyId, embedding);

    expect(mockRunInTenantContext).toHaveBeenCalledWith(
      tenantId,
      expect.any(Function),
    );
    expect(mockUpdate).toHaveBeenCalled();
  });
});

describe("createGeneratePropertyEmbeddingWorker", () => {
  beforeEach(() => {
    resetGeneratePropertyEmbeddingWorkerCache();
    vi.clearAllMocks();
    mockWorkerClose.mockReset();
    mockWorkerConstructor.mockClear();
    mockGetBullMqDuplicateConnection.mockReset();
  });

  afterEach(async () => {
    await closeGeneratePropertyEmbeddingWorker();
    resetGeneratePropertyEmbeddingWorkerCache();
  });

  it("throws when BullMQ Redis is not configured", () => {
    mockGetBullMqDuplicateConnection.mockReturnValue(null);

    expect(() => createGeneratePropertyEmbeddingWorker()).toThrow(
      "BullMQ Redis is not configured or unavailable.",
    );
  });

  it("creates a worker on the generate-embedding queue", () => {
    const connection = { id: "duplicate-connection" };
    mockGetBullMqDuplicateConnection.mockReturnValue(connection);

    const first = createGeneratePropertyEmbeddingWorker();
    const second = createGeneratePropertyEmbeddingWorker();

    expect(first).toBe(second);
    expect(mockWorkerConstructor).toHaveBeenCalledTimes(1);
    expect(mockWorkerConstructor).toHaveBeenCalledWith(
      AI_GENERATE_EMBEDDING_QUEUE_NAME,
      processGeneratePropertyEmbeddingJob,
      {
        connection,
        concurrency: GENERATE_PROPERTY_EMBEDDING_WORKER_CONCURRENCY,
      },
    );
  });
});
