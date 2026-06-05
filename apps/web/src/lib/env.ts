const DEFAULT_API_URL = "http://localhost:3333";

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();

  if (!value) {
    return undefined;
  }

  return value;
}

function requirePublicApiUrlInDev(): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (!readEnv("NEXT_PUBLIC_API_URL")) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Copy .env.example to .env and set NEXT_PUBLIC_API_URL=http://localhost:3333",
    );
  }
}

/** Browser-facing API origin (client components, fetch from the dashboard). */
export function getPublicApiUrl(): string {
  requirePublicApiUrlInDev();

  return readEnv("NEXT_PUBLIC_API_URL") ?? DEFAULT_API_URL;
}

/** Server-side API origin (middleware, Server Components, route handlers). */
export function getApiUrl(): string {
  return readEnv("API_URL") ?? getPublicApiUrl();
}
