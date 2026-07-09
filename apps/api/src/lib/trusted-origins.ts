/** Local dev origins that are always trusted for CORS + Better Auth. */
export const DEFAULT_TRUSTED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3333",
];

/**
 * Builds the trusted-origins allowlist: the localhost defaults plus any origins
 * from the `TRUSTED_ORIGINS` env var (comma-separated), de-duplicated.
 *
 * Production/staging origins must be supplied via the env var — without them
 * CORS and Better Auth reject the deployed domains and login breaks in the cloud.
 */
export function parseTrustedOrigins(raw: string | undefined): string[] {
  const fromEnv = (raw ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  return Array.from(new Set([...DEFAULT_TRUSTED_ORIGINS, ...fromEnv]));
}
