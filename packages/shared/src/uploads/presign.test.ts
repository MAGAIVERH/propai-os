import { describe, expect, it } from "vitest";

import {
  isImageContentType,
  presignDownloadQuerySchema,
  presignDownloadResponseSchema,
  presignUploadRequestSchema,
  presignUploadResponseSchema,
  UPLOAD_MAX_BYTES,
} from "./presign.js";

const validPropertyId = "550e8400-e29b-41d4-a716-446655440000";

const validUploadRequest = {
  propertyId: validPropertyId,
  contentType: "image/jpeg",
  contentLength: 12_345,
};

describe("isImageContentType", () => {
  it("accepts image/* types", () => {
    expect(isImageContentType("image/jpeg")).toBe(true);
    expect(isImageContentType("image/png")).toBe(true);
    expect(isImageContentType("IMAGE/WEBP")).toBe(true);
  });

  it("rejects non-image types", () => {
    expect(isImageContentType("application/pdf")).toBe(false);
    expect(isImageContentType("text/plain")).toBe(false);
  });
});

describe("presignUploadRequestSchema", () => {
  it("accepts a valid upload request", () => {
    const result = presignUploadRequestSchema.safeParse(validUploadRequest);

    expect(result.success).toBe(true);
  });

  it("rejects invalid propertyId uuid", () => {
    const result = presignUploadRequestSchema.safeParse({
      ...validUploadRequest,
      propertyId: "not-a-uuid",
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-image contentType", () => {
    const result = presignUploadRequestSchema.safeParse({
      ...validUploadRequest,
      contentType: "application/pdf",
    });

    expect(result.success).toBe(false);
  });

  it("rejects contentLength over 10MB", () => {
    const result = presignUploadRequestSchema.safeParse({
      ...validUploadRequest,
      contentLength: UPLOAD_MAX_BYTES + 1,
    });

    expect(result.success).toBe(false);
  });

  it("rejects zero contentLength", () => {
    const result = presignUploadRequestSchema.safeParse({
      ...validUploadRequest,
      contentLength: 0,
    });

    expect(result.success).toBe(false);
  });

  it("accepts contentLength at exactly 10MB", () => {
    const result = presignUploadRequestSchema.safeParse({
      ...validUploadRequest,
      contentLength: UPLOAD_MAX_BYTES,
    });

    expect(result.success).toBe(true);
  });
});

describe("presignUploadResponseSchema", () => {
  it("accepts a valid upload response", () => {
    const result = presignUploadResponseSchema.safeParse({
      uploadUrl: "https://storage.example/upload?sig=abc",
      key: "tenant/t1/property/p1/file.jpg",
      expiresAt: "2026-06-05T12:15:00.000Z",
      headers: { "Content-Type": "image/jpeg" },
    });

    expect(result.success).toBe(true);
  });
});

describe("presignDownloadQuerySchema", () => {
  it("accepts a valid object key", () => {
    const result = presignDownloadQuerySchema.safeParse({
      key: "tenant/t1/property/p1/file.jpg",
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty key", () => {
    const result = presignDownloadQuerySchema.safeParse({ key: "" });

    expect(result.success).toBe(false);
  });

  it("rejects key longer than 512 characters", () => {
    const result = presignDownloadQuerySchema.safeParse({
      key: "a".repeat(513),
    });

    expect(result.success).toBe(false);
  });
});

describe("presignDownloadResponseSchema", () => {
  it("accepts a valid download response", () => {
    const result = presignDownloadResponseSchema.safeParse({
      downloadUrl: "https://storage.example/download?sig=xyz",
      expiresAt: "2026-06-05T12:15:00.000Z",
    });

    expect(result.success).toBe(true);
  });
});
