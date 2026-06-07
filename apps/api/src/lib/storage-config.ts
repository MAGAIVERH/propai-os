export const UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

export const ALLOWED_CONTENT_TYPE_PREFIX = "image/";

export const DEFAULT_PRESIGN_EXPIRES_SECONDS = 900;

export type StorageConfig = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  presignExpiresSeconds: number;
};

function readRequiredEnv(name: string): string | null {
  const value = process.env[name]?.trim();

  if (!value) {
    return null;
  }

  return value;
}

function parsePresignExpiresSeconds(): number {
  const raw = process.env.S3_PRESIGN_EXPIRES_SECONDS?.trim();

  if (!raw) {
    return DEFAULT_PRESIGN_EXPIRES_SECONDS;
  }

  const parsed = Number.parseInt(raw, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_PRESIGN_EXPIRES_SECONDS;
  }

  return parsed;
}

export function isAllowedImageContentType(contentType: string): boolean {
  return contentType.toLowerCase().startsWith(ALLOWED_CONTENT_TYPE_PREFIX);
}

/** Returns null when any required S3_* env var is missing (routes respond 503). */
export function getStorageConfig(): StorageConfig | null {
  const endpoint = readRequiredEnv("S3_ENDPOINT");
  const region = readRequiredEnv("S3_REGION");
  const bucket = readRequiredEnv("S3_BUCKET");
  const accessKeyId = readRequiredEnv("S3_ACCESS_KEY_ID");
  const secretAccessKey = readRequiredEnv("S3_SECRET_ACCESS_KEY");

  if (!endpoint || !region || !bucket || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return {
    endpoint,
    region,
    bucket,
    accessKeyId,
    secretAccessKey,
    presignExpiresSeconds: parsePresignExpiresSeconds(),
  };
}
