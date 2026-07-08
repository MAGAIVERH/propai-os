import { describe, expect, it } from "vitest";

import {
  AI_GENERATE_EMBEDDING_QUEUE_NAME,
  generateEmbeddingJobDataSchema,
} from "./generate-embedding-job.js";

const tenantId = "550e8400-e29b-41d4-a716-446655440000";
const propertyId = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

describe("AI_GENERATE_EMBEDDING_QUEUE_NAME", () => {
  it("uses a colon-free BullMQ queue name", () => {
    expect(AI_GENERATE_EMBEDDING_QUEUE_NAME).toBe("ai-generate-embedding");
    expect(AI_GENERATE_EMBEDDING_QUEUE_NAME).not.toContain(":");
  });
});

describe("generateEmbeddingJobDataSchema", () => {
  it("accepts tenant-scoped property id", () => {
    const result = generateEmbeddingJobDataSchema.parse({
      tenantId,
      propertyId,
    });

    expect(result.tenantId).toBe(tenantId);
    expect(result.propertyId).toBe(propertyId);
  });

  it("rejects invalid property id", () => {
    const result = generateEmbeddingJobDataSchema.safeParse({
      tenantId,
      propertyId: "not-a-uuid",
    });

    expect(result.success).toBe(false);
  });
});
