import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createPresignedGetUrl,
  createPresignedPutUrl,
  getS3Client,
  resetS3ClientCache,
} from "./s3-client.js";
import {
  ALLOWED_CONTENT_TYPE_PREFIX,
  DEFAULT_PRESIGN_EXPIRES_SECONDS,
  getStorageConfig,
  isAllowedImageContentType,
  UPLOAD_MAX_BYTES,
  type StorageConfig,
} from "./storage-config.js";

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(),
}));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(function MockS3Client(this: S3Client, config: unknown) {
    Object.assign(this, { config });
  }),
  PutObjectCommand: vi.fn(function MockPutObjectCommand(input: unknown) {
    return { input, type: "PutObjectCommand" };
  }),
  GetObjectCommand: vi.fn(function MockGetObjectCommand(input: unknown) {
    return { input, type: "GetObjectCommand" };
  }),
}));

const testConfig: StorageConfig = {
  endpoint: "http://localhost:9000",
  region: "us-east-1",
  bucket: "propai-uploads",
  accessKeyId: "minioadmin",
  secretAccessKey: "minioadmin",
  presignExpiresSeconds: 900,
};

const originalEnv = { ...process.env };

function setCompleteStorageEnv(overrides: Record<string, string | undefined> = {}) {
  process.env.S3_ENDPOINT = "http://localhost:9000";
  process.env.S3_REGION = "us-east-1";
  process.env.S3_BUCKET = "propai-uploads";
  process.env.S3_ACCESS_KEY_ID = "minioadmin";
  process.env.S3_SECRET_ACCESS_KEY = "minioadmin";
  process.env.S3_PRESIGN_EXPIRES_SECONDS = "900";

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

describe("storage-config", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("exports upload limits", () => {
    expect(UPLOAD_MAX_BYTES).toBe(10 * 1024 * 1024);
    expect(ALLOWED_CONTENT_TYPE_PREFIX).toBe("image/");
  });

  it("allows image/* content types", () => {
    expect(isAllowedImageContentType("image/jpeg")).toBe(true);
    expect(isAllowedImageContentType("image/png")).toBe(true);
    expect(isAllowedImageContentType("image/webp")).toBe(true);
    expect(isAllowedImageContentType("IMAGE/JPEG")).toBe(true);
  });

  it("rejects non-image content types", () => {
    expect(isAllowedImageContentType("application/pdf")).toBe(false);
    expect(isAllowedImageContentType("text/plain")).toBe(false);
    expect(isAllowedImageContentType("image")).toBe(false);
  });

  it("returns null when required S3 env vars are missing", () => {
    delete process.env.S3_ENDPOINT;
    delete process.env.S3_ACCESS_KEY_ID;

    expect(getStorageConfig()).toBeNull();
  });

  it("parses complete storage config from env", () => {
    setCompleteStorageEnv();

    expect(getStorageConfig()).toEqual({
      endpoint: "http://localhost:9000",
      region: "us-east-1",
      bucket: "propai-uploads",
      accessKeyId: "minioadmin",
      secretAccessKey: "minioadmin",
      presignExpiresSeconds: 900,
    });
  });

  it("falls back to default presign TTL when env is invalid", () => {
    setCompleteStorageEnv({ S3_PRESIGN_EXPIRES_SECONDS: "not-a-number" });

    expect(getStorageConfig()?.presignExpiresSeconds).toBe(
      DEFAULT_PRESIGN_EXPIRES_SECONDS,
    );
  });
});

describe("s3-client", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    resetS3ClientCache();
    vi.mocked(getSignedUrl).mockReset();
    vi.mocked(S3Client).mockClear();
    vi.mocked(PutObjectCommand).mockClear();
    vi.mocked(GetObjectCommand).mockClear();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetS3ClientCache();
  });

  it("reuses lazy S3Client singleton for the same config", () => {
    const first = getS3Client(testConfig);
    const second = getS3Client(testConfig);

    expect(first).toBe(second);
    expect(S3Client).toHaveBeenCalledTimes(1);
    expect(S3Client).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: testConfig.endpoint,
        region: testConfig.region,
        forcePathStyle: true,
        credentials: {
          accessKeyId: testConfig.accessKeyId,
          secretAccessKey: testConfig.secretAccessKey,
        },
      }),
    );
  });

  it("returns null for presigned PUT when storage is not configured", async () => {
    delete process.env.S3_ENDPOINT;

    const url = await createPresignedPutUrl({
      key: "tenant/a/property/b/c.jpg",
      contentType: "image/jpeg",
      contentLength: 1024,
    });

    expect(url).toBeNull();
    expect(getSignedUrl).not.toHaveBeenCalled();
  });

  it("creates presigned PUT URL with ContentType bound in command", async () => {
    vi.mocked(getSignedUrl).mockResolvedValue("https://storage.example/upload");

    const url = await createPresignedPutUrl(
      {
        key: "tenant/t1/property/p1/file.jpg",
        contentType: "image/jpeg",
        contentLength: 12_345,
        expiresIn: 600,
      },
      testConfig,
    );

    expect(url).toBe("https://storage.example/upload");
    expect(PutObjectCommand).toHaveBeenCalledWith({
      Bucket: testConfig.bucket,
      Key: "tenant/t1/property/p1/file.jpg",
      ContentType: "image/jpeg",
      ContentLength: 12_345,
    });
    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: "PutObjectCommand" }),
      { expiresIn: 600 },
    );
  });

  it("returns null for presigned GET when storage is not configured", async () => {
    delete process.env.S3_BUCKET;

    const url = await createPresignedGetUrl({
      key: "tenant/a/property/b/c.jpg",
    });

    expect(url).toBeNull();
    expect(getSignedUrl).not.toHaveBeenCalled();
  });

  it("creates presigned GET URL for object key", async () => {
    vi.mocked(getSignedUrl).mockResolvedValue("https://storage.example/download");

    const url = await createPresignedGetUrl(
      {
        key: "tenant/t1/property/p1/file.jpg",
      },
      testConfig,
    );

    expect(url).toBe("https://storage.example/download");
    expect(GetObjectCommand).toHaveBeenCalledWith({
      Bucket: testConfig.bucket,
      Key: "tenant/t1/property/p1/file.jpg",
    });
    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: "GetObjectCommand" }),
      { expiresIn: testConfig.presignExpiresSeconds },
    );
  });
});
