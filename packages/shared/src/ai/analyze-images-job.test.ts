import { describe, expect, it } from "vitest";

import { MOCK_PROPERTY_IMAGE_ANALYSIS } from "./property-image-analysis.js";
import {
  AI_ANALYZE_IMAGES_QUEUE_NAME,
  AI_JOB_STATUSES,
  aiJobStatusSchema,
  analyzeImagesJobDataSchema,
  analyzeImagesJobStatusResponseSchema,
  enqueueAnalyzeImagesJobResponseSchema,
} from "./analyze-images-job.js";

const tenantId = "550e8400-e29b-41d4-a716-446655440000";

describe("AI_ANALYZE_IMAGES_QUEUE_NAME", () => {
  it("uses the ai:analyze-images queue name", () => {
    expect(AI_ANALYZE_IMAGES_QUEUE_NAME).toBe("ai:analyze-images");
  });
});

describe("aiJobStatusSchema", () => {
  it("accepts all job lifecycle statuses", () => {
    for (const status of AI_JOB_STATUSES) {
      expect(aiJobStatusSchema.parse(status)).toBe(status);
    }
  });

  it("rejects unknown statuses", () => {
    const result = aiJobStatusSchema.safeParse("pending");

    expect(result.success).toBe(false);
  });
});

describe("analyzeImagesJobDataSchema", () => {
  it("accepts tenant-scoped image URLs", () => {
    const result = analyzeImagesJobDataSchema.parse({
      tenantId,
      imageUrls: ["https://storage.example/tenant/property/photo.jpg"],
    });

    expect(result.tenantId).toBe(tenantId);
    expect(result.imageUrls).toHaveLength(1);
  });

  it("rejects more than ten image URLs", () => {
    const imageUrls = Array.from(
      { length: 11 },
      (_, index) => `https://storage.example/photo-${index}.jpg`,
    );

    const result = analyzeImagesJobDataSchema.safeParse({ tenantId, imageUrls });

    expect(result.success).toBe(false);
  });
});

describe("enqueueAnalyzeImagesJobResponseSchema", () => {
  it("requires a non-empty jobId", () => {
    const result = enqueueAnalyzeImagesJobResponseSchema.parse({
      jobId: "job-123",
    });

    expect(result.jobId).toBe("job-123");
  });
});

describe("analyzeImagesJobStatusResponseSchema", () => {
  it("validates a completed job with result", () => {
    const result = analyzeImagesJobStatusResponseSchema.parse({
      jobId: "job-123",
      status: "completed",
      result: MOCK_PROPERTY_IMAGE_ANALYSIS,
    });

    expect(result.status).toBe("completed");
    expect(result.result?.bedrooms).toBe(MOCK_PROPERTY_IMAGE_ANALYSIS.bedrooms);
  });

  it("validates a failed job with failedReason", () => {
    const result = analyzeImagesJobStatusResponseSchema.parse({
      jobId: "job-123",
      status: "failed",
      failedReason: "Gemini timeout",
    });

    expect(result.status).toBe("failed");
    expect(result.failedReason).toBe("Gemini timeout");
  });
});
