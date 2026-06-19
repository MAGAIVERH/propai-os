import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  VISITS_SEND_CONFIRMATION_JOB_NAME,
  VISITS_SEND_CONFIRMATION_QUEUE_NAME,
  type SendVisitConfirmationJobData,
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

    constructor(name: string, options: unknown) {
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
  closeSendVisitConfirmationQueue,
  enqueueSendVisitConfirmationJob,
  getSendVisitConfirmationQueue,
  resetSendVisitConfirmationQueueCache,
  VISITS_SEND_CONFIRMATION_JOB_ATTEMPTS,
  VISITS_SEND_CONFIRMATION_JOB_BACKOFF_DELAY_MS,
} from "./send-visit-confirmation-queue.js";

const jobData: SendVisitConfirmationJobData = {
  tenantId: "550e8400-e29b-41d4-a716-446655440000",
  leadId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  propertyId: "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
  scheduledAt: "2026-07-01T20:00:00.000Z",
  timezone: "America/Chicago",
};

describe("getSendVisitConfirmationQueue", () => {
  beforeEach(() => {
    resetSendVisitConfirmationQueueCache();
    vi.clearAllMocks();
    mockQueueAdd.mockReset();
    mockQueueClose.mockReset();
    mockQueueConstructor.mockClear();
  });

  afterEach(async () => {
    await closeSendVisitConfirmationQueue();
    resetSendVisitConfirmationQueueCache();
  });

  it("returns null when BullMQ Redis is not configured", () => {
    mockGetBullMqConnection.mockReturnValue(null);

    expect(getSendVisitConfirmationQueue()).toBeNull();
    expect(mockQueueConstructor).not.toHaveBeenCalled();
  });

  it("creates the visits-send-confirmation queue with retry + backoff (singleton)", () => {
    const connection = { id: "redis-connection" };
    mockGetBullMqConnection.mockReturnValue(connection);

    const first = getSendVisitConfirmationQueue();
    const second = getSendVisitConfirmationQueue();

    expect(first).not.toBeNull();
    expect(second).toBe(first);
    expect(mockQueueConstructor).toHaveBeenCalledTimes(1);
    expect(mockQueueConstructor).toHaveBeenCalledWith(
      VISITS_SEND_CONFIRMATION_QUEUE_NAME,
      {
        connection,
        defaultJobOptions: {
          attempts: VISITS_SEND_CONFIRMATION_JOB_ATTEMPTS,
          backoff: {
            type: "exponential",
            delay: VISITS_SEND_CONFIRMATION_JOB_BACKOFF_DELAY_MS,
          },
          removeOnComplete: true,
        },
      },
    );
  });
});

describe("enqueueSendVisitConfirmationJob", () => {
  beforeEach(() => {
    resetSendVisitConfirmationQueueCache();
    vi.clearAllMocks();
    mockQueueAdd.mockReset();
    mockGetBullMqConnection.mockReturnValue({});
    mockQueueAdd.mockResolvedValue({ id: "visit-job-1" });
  });

  afterEach(async () => {
    await closeSendVisitConfirmationQueue();
    resetSendVisitConfirmationQueueCache();
  });

  it("enqueues validated job data and returns the job id", async () => {
    const jobId = await enqueueSendVisitConfirmationJob(jobData);

    expect(jobId).toBe("visit-job-1");
    expect(mockQueueAdd).toHaveBeenCalledWith(
      VISITS_SEND_CONFIRMATION_JOB_NAME,
      jobData,
    );
  });
});
