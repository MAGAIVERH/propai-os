import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

/** Loads the monorepo root .env and returns its variables. */
function getMonorepoEnv(): Record<string, string> {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  const envPath = resolve(repoRoot, ".env");
  const envVars: Record<string, string> = {};

  if (!existsSync(envPath)) return envVars;

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const sep = trimmed.indexOf("=");
    if (sep === -1) continue;
    const key = trimmed.slice(0, sep).trim();
    let value = trimmed.slice(sep + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    envVars[key] = value;
    process.env[key] = value;
  }

  return envVars;
}

const monorepoEnv = getMonorepoEnv();

const nextConfig: NextConfig = {
  transpilePackages: ["@propai/shared"],
  env: {
    NEXT_PUBLIC_API_URL: monorepoEnv.NEXT_PUBLIC_API_URL || "http://localhost:3333",
    NEXT_PUBLIC_MARKETPLACE_TENANT_ID: monorepoEnv.NEXT_PUBLIC_MARKETPLACE_TENANT_ID || "",
    NEXT_PUBLIC_MAP_PROVIDER: monorepoEnv.NEXT_PUBLIC_MAP_PROVIDER || "",
    NEXT_PUBLIC_MAPBOX_TOKEN: monorepoEnv.NEXT_PUBLIC_MAPBOX_TOKEN || "",
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: monorepoEnv.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  },
};

export default nextConfig;
