import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  MOCK_PROPERTY_IMAGE_ANALYSIS,
  type AnalyzeImagesJobData,
} from "@propai/shared";

const { mockGetJob, mockGetAnalyzeImagesQueue } = vi.hoisted(() => ({
  mockGetJob: vi.fn(),
  mockGetAnalyzeImagesQueue: vi.fn(),
}));

vi.mock("../queues/analyze-images-queue.js", () => ({
  getAnalyzeImagesQueue: mockGetAnalyzeImagesQueue,
}));

import {
  getJobStatus,
  mapBullMqStateToAiJobStatus,
} from "./get-job-status.js";

const tenantId = "550e8400-e29b-41d4-a716-446655440000";
const otherTenantId = "660e8400-e29b-41d4-a716-446655440001";

const jobData: AnalyzeImagesJobData = {
  tenantId,
  imageUrls: ["https://storage.example/tenant/property/photo.jpg"],
};

function createMockJob(options: {
  id: string;
  data: AnalyzeImagesJobData;
  state: string;
  returnvalue?: unknown;
  failedReason?: string;
}) {
  return {
    id: options.id,
    data: options.data,
    returnvalue: options.returnvalue,
    failedReason: options.failedReason,
    getState: vi.fn().mockResolvedValue(options.state),
  };
}

describe("mapBullMqStateToAiJobStatus", () => {
  it("maps BullMQ states to shared job statuses", () => {
    expect(mapBullMqStateToAiJobStatus("waiting")).toBe("queued");
    expect(mapBullMqStateToAiJobStatus("delayed")).toBe("queued");
    expect(mapBullMqStateToAiJobStatus("active")).toBe("processing");
    expect(mapBullMqStateToAiJobStatus("completed")).toBe("completed");
    expect(mapBullMqStateToAiJobStatus("failed")).toBe("failed");
  });
});

describe("getJobStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetJob.mockReset();
    mockGetAnalyzeImagesQueue.mockReturnValue({
      getJob: mockGetJob,
    });
  });

  it("returns null when the job does not exist", async () => {
    mockGetJob.mockResolvedValue(undefined);

    const result = await getJobStatus(tenantId, "missing-job");

    expect(result).toBeNull();
  });

  it("returns null when the job belongs to another tenant", async () => {
    mockGetJob.mockResolvedValue(
      createMockJob({
        id: "job-123",
        data: { ...jobData, tenantId: otherTenantId },
        state: "waiting",
      }),
    );

    const result = await getJobStatus(tenantId, "job-123");

    expect(result).toBeNull();
  });

  it("returns queued status for waiting jobs", async () => {
    mockGetJob.mockResolvedValue(
      createMockJob({
        id: "job-123",
        data: jobData,
        state: "waiting",
      }),
    );

    const result = await getJobStatus(tenantId, "job-123");

    expect(result).toEqual({
      jobId: "job-123",
      status: "queued",
    });
  });

  it("returns processing status for active jobs", async () => {
    mockGetJob.mockResolvedValue(
      createMockJob({
        id: "job-123",
        data: jobData,
        state: "active",
      }),
    );

    const result = await getJobStatus(tenantId, "job-123");

    expect(result).toEqual({
      jobId: "job-123",
      status: "processing",
    });
  });

  it("returns completed status with parsed result", async () => {
    mockGetJob.mockResolvedValue(
      createMockJob({
        id: "job-123",
        data: jobData,
        state: "completed",
        returnvalue: MOCK_PROPERTY_IMAGE_ANALYSIS,
      }),
    );

    const result = await getJobStatus(tenantId, "job-123");

    expect(result).toEqual({
      jobId: "job-123",
      status: "completed",
      result: MOCK_PROPERTY_IMAGE_ANALYSIS,
    });
  });

  it("returns failed status with failedReason", async () => {
    mockGetJob.mockResolvedValue(
      createMockJob({
        id: "job-123",
        data: jobData,
        state: "failed",
        failedReason: "Gemini timeout",
      }),
    );

    const result = await getJobStatus(tenantId, "job-123");

    expect(result).toEqual({
      jobId: "job-123",
      status: "failed",
      failedReason: "Gemini timeout",
    });
  });
});
