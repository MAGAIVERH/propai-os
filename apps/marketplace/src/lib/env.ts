const DEFAULT_API_URL = "http://localhost:3333";

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

/** Server-side API origin (Server Components, SSR fetches). */
export function getApiUrl(): string {
  return readEnv("API_URL") ?? readEnv("NEXT_PUBLIC_API_URL") ?? DEFAULT_API_URL;
}

/** Optional brokerage tenant scoping from env. */
export function getDefaultTenantId(): string | undefined {
  return readEnv("NEXT_PUBLIC_MARKETPLACE_TENANT_ID");
}
