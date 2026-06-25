const DEFAULT_API_URL = "http://localhost:3333";

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();

  if (!value) {
    return undefined;
  }

  return value;
}

/** Browser-facing API origin (client components, fetch from the dashboard). */
export function getPublicApiUrl(): string {
  return readEnv("NEXT_PUBLIC_API_URL") ?? DEFAULT_API_URL;
}

/** Server-side API origin (proxy, Server Components, route handlers). */
export function getApiUrl(): string {
  return readEnv("API_URL") ?? getPublicApiUrl();
}

/** Browser-facing WebSocket origin, derived from the public API URL. */
export function getWsUrl(): string {
  return getPublicApiUrl().replace(/^http/, "ws");
}
