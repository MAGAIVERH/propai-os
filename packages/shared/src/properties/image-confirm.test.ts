import { describe, expect, it } from "vitest";

import { UPLOAD_MAX_BYTES } from "../uploads/presign.js";
import {
  imageConfirmRequestSchema,
  imageConfirmResponseSchema,
  propertyImageResponseSchema,
} from "./image-confirm.js";

const validPropertyId = "550e8400-e29b-41d4-a716-446655440000";
const validImageId = "660e8400-e29b-41d4-a716-446655440001";
const validTenantId = "770e8400-e29b-41d4-a716-446655440002";

const validObjectKey = `tenant/${validTenantId}/property/${validPropertyId}/${validImageId}.jpg`;

const validConfirmRequest = {
  objectKey: validObjectKey,
  mimeType: "image/jpeg",
  sizeBytes: 12_345,
};

describe("imageConfirmRequestSchema", () => {
  it("accepts a valid confirm request", () => {
    const result = imageConfirmRequestSchema.safeParse(validConfirmRequest);

    expect(result.success).toBe(true);
  });

  it("accepts optional sortOrder", () => {
    const result = imageConfirmRequestSchema.safeParse({
      ...validConfirmRequest,
      sortOrder: 2,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sortOrder).toBe(2);
    }
  });

  it("rejects empty objectKey", () => {
    const result = imageConfirmRequestSchema.safeParse({
      ...validConfirmRequest,
      objectKey: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects objectKey longer than 512 characters", () => {
    const result = imageConfirmRequestSchema.safeParse({
      ...validConfirmRequest,
      objectKey: `tenant/${validTenantId}/property/${validPropertyId}/${"a".repeat(500)}.jpg`,
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-image mimeType", () => {
    const result = imageConfirmRequestSchema.safeParse({
      ...validConfirmRequest,
      mimeType: "application/pdf",
    });

    expect(result.success).toBe(false);
  });

  it("rejects zero sizeBytes", () => {
    const result = imageConfirmRequestSchema.safeParse({
      ...validConfirmRequest,
      sizeBytes: 0,
    });

    expect(result.success).toBe(false);
  });

  it("rejects sizeBytes over 10MB", () => {
    const result = imageConfirmRequestSchema.safeParse({
      ...validConfirmRequest,
      sizeBytes: UPLOAD_MAX_BYTES + 1,
    });

    expect(result.success).toBe(false);
  });

  it("accepts sizeBytes at exactly 10MB", () => {
    const result = imageConfirmRequestSchema.safeParse({
      ...validConfirmRequest,
      sizeBytes: UPLOAD_MAX_BYTES,
    });

    expect(result.success).toBe(true);
  });

  it("rejects negative sortOrder", () => {
    const result = imageConfirmRequestSchema.safeParse({
      ...validConfirmRequest,
      sortOrder: -1,
    });

    expect(result.success).toBe(false);
  });
});

describe("propertyImageResponseSchema", () => {
  it("accepts a valid property image response", () => {
    const result = propertyImageResponseSchema.safeParse({
      id: validImageId,
      propertyId: validPropertyId,
      storageKey: validObjectKey,
      sortOrder: 0,
      isPrimary: false,
      createdAt: "2026-06-05T12:15:00.000Z",
    });

    expect(result.success).toBe(true);
  });
});

describe("imageConfirmResponseSchema", () => {
  it("accepts a valid confirm response", () => {
    const result = imageConfirmResponseSchema.safeParse({
      image: {
        id: validImageId,
        propertyId: validPropertyId,
        storageKey: validObjectKey,
        sortOrder: 1,
        isPrimary: false,
        createdAt: "2026-06-05T12:15:00.000Z",
      },
    });

    expect(result.success).toBe(true);
  });
});
