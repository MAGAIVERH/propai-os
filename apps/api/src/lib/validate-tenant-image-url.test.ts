import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  assertTenantImageUrls,
  extractObjectKeyFromPresignedUrl,
} from "./validate-tenant-image-url.js";
import { type StorageConfig } from "./storage-config.js";

const tenantId = "550e8400-e29b-41d4-a716-446655440000";
const otherTenantId = "11111111-1111-4111-8111-111111111111";
const propertyId = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const fileId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

const storageConfig: StorageConfig = {
  endpoint: "http://localhost:9000",
  region: "us-east-1",
  bucket: "propai-uploads",
  accessKeyId: "minioadmin",
  secretAccessKey: "minioadmin",
  presignExpiresSeconds: 900,
};

const objectKey = `tenant/${tenantId}/property/${propertyId}/${fileId}.jpg`;

function buildPresignedUrl(key: string, query = "X-Amz-Signature=abc"): string {
  return `http://localhost:9000/${storageConfig.bucket}/${key}?${query}`;
}

const originalEnv = { ...process.env };

function setStorageEnv(): void {
  process.env.S3_ENDPOINT = storageConfig.endpoint;
  process.env.S3_REGION = storageConfig.region;
  process.env.S3_BUCKET = storageConfig.bucket;
  process.env.S3_ACCESS_KEY_ID = storageConfig.accessKeyId;
  process.env.S3_SECRET_ACCESS_KEY = storageConfig.secretAccessKey;
}

describe("extractObjectKeyFromPresignedUrl", () => {
  it("extracts the object key from a path-style MinIO presigned URL", () => {
    const key = extractObjectKeyFromPresignedUrl(
      buildPresignedUrl(objectKey),
      storageConfig,
    );

    expect(key).toBe(objectKey);
  });

  it("returns null for an external host", () => {
    const key = extractObjectKeyFromPresignedUrl(
      `https://example.com/${storageConfig.bucket}/${objectKey}`,
      storageConfig,
    );

    expect(key).toBeNull();
  });

  it("returns null for malformed URLs", () => {
    expect(
      extractObjectKeyFromPresignedUrl("not-a-url", storageConfig),
    ).toBeNull();
  });
});

describe("assertTenantImageUrls", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    setStorageEnv();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("accepts valid tenant-scoped presigned download URLs", () => {
    const result = assertTenantImageUrls(tenantId, [
      buildPresignedUrl(objectKey),
      buildPresignedUrl(
        `tenant/${tenantId}/property/${propertyId}/22222222-2222-4222-8222-222222222222.png`,
      ),
    ]);

    expect(result).toEqual({ ok: true });
  });

  it("rejects external URLs", () => {
    const result = assertTenantImageUrls(tenantId, [
      "https://example.com/photo.jpg",
    ]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("presigned download URL");
    }
  });

  it("rejects URLs for another tenant's object key", () => {
    const foreignKey = `tenant/${otherTenantId}/property/${propertyId}/${fileId}.jpg`;

    const result = assertTenantImageUrls(tenantId, [
      buildPresignedUrl(foreignKey),
    ]);

    expect(result).toEqual({
      ok: false,
      message: "Image URL does not belong to the active organization.",
    });
  });

  it("rejects URLs when object storage is not configured", () => {
    delete process.env.S3_ENDPOINT;

    const result = assertTenantImageUrls(tenantId, [
      buildPresignedUrl(objectKey),
    ]);

    expect(result).toEqual({
      ok: false,
      message: "Object storage is not configured.",
    });
  });
});
