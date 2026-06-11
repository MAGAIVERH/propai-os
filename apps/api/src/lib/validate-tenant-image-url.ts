import { assertKeyBelongsToTenant, parseObjectKey } from "./object-key.js";
import { getStorageConfig, type StorageConfig } from "./storage-config.js";

export type TenantImageUrlValidationSuccess = {
  ok: true;
};

export type TenantImageUrlValidationFailure = {
  ok: false;
  message: string;
};

export type TenantImageUrlValidationResult =
  | TenantImageUrlValidationSuccess
  | TenantImageUrlValidationFailure;

function resolvePort(url: URL): string {
  if (url.port) {
    return url.port;
  }

  return url.protocol === "https:" ? "443" : "80";
}

function storageHostsMatch(imageUrl: URL, endpoint: URL): boolean {
  return (
    imageUrl.protocol === endpoint.protocol &&
    imageUrl.hostname === endpoint.hostname &&
    resolvePort(imageUrl) === resolvePort(endpoint)
  );
}

function normalizePathname(pathname: string): string {
  const trimmed = pathname.startsWith("/") ? pathname.slice(1) : pathname;

  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

/** Extracts the S3 object key from a path-style presigned GET URL. */
export function extractObjectKeyFromPresignedUrl(
  imageUrl: string,
  storageConfig: StorageConfig,
): string | null {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    return null;
  }

  let endpoint: URL;

  try {
    endpoint = new URL(storageConfig.endpoint);
  } catch {
    return null;
  }

  if (!storageHostsMatch(parsedUrl, endpoint)) {
    return null;
  }

  const normalizedPath = normalizePathname(parsedUrl.pathname);
  const bucketPrefix = `${storageConfig.bucket}/`;

  if (normalizedPath.startsWith(bucketPrefix)) {
    return normalizedPath.slice(bucketPrefix.length);
  }

  if (normalizedPath.startsWith("tenant/")) {
    return normalizedPath;
  }

  return null;
}

export function assertTenantImageUrls(
  tenantId: string,
  imageUrls: string[],
): TenantImageUrlValidationResult {
  const storageConfig = getStorageConfig();

  if (!storageConfig) {
    return {
      ok: false,
      message: "Object storage is not configured.",
    };
  }

  for (const imageUrl of imageUrls) {
    const objectKey = extractObjectKeyFromPresignedUrl(imageUrl, storageConfig);

    if (!objectKey || !parseObjectKey(objectKey)) {
      return {
        ok: false,
        message: "Each imageUrl must be a presigned download URL for a tenant property photo.",
      };
    }

    if (!assertKeyBelongsToTenant(objectKey, tenantId)) {
      return {
        ok: false,
        message: "Image URL does not belong to the active organization.",
      };
    }
  }

  return { ok: true };
}
