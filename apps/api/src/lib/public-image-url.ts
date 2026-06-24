/**
 * Resolves a stored object key into a publicly fetchable URL for the
 * marketplace gallery.
 *
 * Preference order:
 *   1. `S3_PUBLIC_BASE_URL` — an explicit CDN / public bucket origin
 *      (e.g. an R2 public bucket or CloudFront distribution).
 *   2. `${S3_ENDPOINT}/${S3_BUCKET}` — path-style URL, which works for a
 *      MinIO bucket whose download policy is public (local dev default).
 *
 * Returns `null` when storage is not configured, so callers can omit the
 * gallery rather than emit broken image links.
 */
export function buildPublicImageUrl(storageKey: string): string | null {
  const explicitBase = process.env.S3_PUBLIC_BASE_URL?.trim();

  if (explicitBase) {
    return `${stripTrailingSlash(explicitBase)}/${storageKey}`;
  }

  const endpoint = process.env.S3_ENDPOINT?.trim();
  const bucket = process.env.S3_BUCKET?.trim();

  if (!endpoint || !bucket) {
    return null;
  }

  return `${stripTrailingSlash(endpoint)}/${bucket}/${storageKey}`;
}

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
