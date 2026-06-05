import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import {
  getStorageConfig,
  type StorageConfig,
} from "./storage-config.js";

type PresignedPutUrlInput = {
  key: string;
  contentType: string;
  contentLength: number;
  expiresIn?: number;
};

type PresignedGetUrlInput = {
  key: string;
  expiresIn?: number;
};

let cachedClient: S3Client | null = null;
let cachedClientKey: string | null = null;

function buildClientCacheKey(config: StorageConfig): string {
  return [
    config.endpoint,
    config.region,
    config.bucket,
    config.accessKeyId,
  ].join("|");
}

export function getS3Client(config: StorageConfig): S3Client {
  const cacheKey = buildClientCacheKey(config);

  if (cachedClient && cachedClientKey === cacheKey) {
    return cachedClient;
  }

  cachedClient = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true,
  });
  cachedClientKey = cacheKey;

  return cachedClient;
}

/** Clears the lazy singleton — for tests only. */
export function resetS3ClientCache(): void {
  cachedClient = null;
  cachedClientKey = null;
}

function resolveConfig(config?: StorageConfig): StorageConfig | null {
  return config ?? getStorageConfig();
}

export async function createPresignedPutUrl(
  input: PresignedPutUrlInput,
  config?: StorageConfig,
): Promise<string | null> {
  const storageConfig = resolveConfig(config);

  if (!storageConfig) {
    return null;
  }

  const client = getS3Client(storageConfig);
  const command = new PutObjectCommand({
    Bucket: storageConfig.bucket,
    Key: input.key,
    ContentType: input.contentType,
    ContentLength: input.contentLength,
  });

  return getSignedUrl(client, command, {
    expiresIn: input.expiresIn ?? storageConfig.presignExpiresSeconds,
  });
}

export async function createPresignedGetUrl(
  input: PresignedGetUrlInput,
  config?: StorageConfig,
): Promise<string | null> {
  const storageConfig = resolveConfig(config);

  if (!storageConfig) {
    return null;
  }

  const client = getS3Client(storageConfig);
  const command = new GetObjectCommand({
    Bucket: storageConfig.bucket,
    Key: input.key,
  });

  return getSignedUrl(client, command, {
    expiresIn: input.expiresIn ?? storageConfig.presignExpiresSeconds,
  });
}
