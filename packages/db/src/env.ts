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

/** Returns `DATABASE_URL` after loading root `.env`. */
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
