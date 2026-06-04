import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

let envLoaded = false;

/** Loads `.env` from the monorepo root (idempotent). */
export function loadEnv(): void {
  if (envLoaded) {
    return;
  }

  const repoRoot = resolve(
    fileURLToPath(new URL(".", import.meta.url)),
    "../../..",
  );

  config({ path: resolve(repoRoot, ".env") });
  envLoaded = true;
}

/**
 * Returns `DATABASE_URL` (admin / migrations user) after loading root `.env`.
 * Use for Drizzle migrations, Studio, and seeds — not for RLS-scoped API queries.
 */
export function getDatabaseUrl(): string {
  loadEnv();

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is missing. Copy .env.example to .env at the repo root.",
    );
  }

  return databaseUrl;
}

/**
 * Returns `DATABASE_APP_URL` (RLS app role) after loading root `.env`.
 * Falls back to the local Docker default when unset (see getAppDb in client.ts).
 */
export function getAppDatabaseUrl(): string | undefined {
  loadEnv();
  const url = process.env.DATABASE_APP_URL?.trim();
  return url && url.length > 0 ? url : undefined;
}
