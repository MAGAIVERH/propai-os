/**
 * Returns `raw` only when it is a safe app-internal absolute path (e.g.
 * "/leads/123"), otherwise `fallback`. Guards post-login redirects against
 * open-redirect payloads: protocol-relative ("//evil.com"), absolute URLs
 * ("https://evil.com"), and backslash tricks are all rejected.
 */
export function safeInternalPath(
  raw: string | null | undefined,
  fallback: string,
): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}
