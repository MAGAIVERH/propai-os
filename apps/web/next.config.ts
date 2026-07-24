import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

/**
 * Loads the monorepo root .env file and extracts its variables.
 */
function getMonorepoEnv() {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  const envPath = resolve(repoRoot, ".env");
  const envVars: Record<string, string> = {};

  if (!existsSync(envPath)) {
    console.warn("⚠️ .env file not found at the monorepo root.");
    return envVars;
  }

  const content = readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    envVars[key] = value;
    // Also inject into process.env for SSR and middleware
    process.env[key] = value;
  }

  return envVars;
}

const monorepoEnv = getMonorepoEnv();

const nextConfig: NextConfig = {
  transpilePackages: ["@propai/shared"],
  // Explicitly expose these to the client-side bundle.
  // Platform env vars (Vercel/host) take precedence; the monorepo root .env is a
  // local-dev fallback (it is gitignored and absent on the deploy platform).
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ||
      monorepoEnv.NEXT_PUBLIC_API_URL ||
      "http://localhost:3333",
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL ||
      monorepoEnv.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000",
    NEXT_PUBLIC_MAP_PROVIDER:
      process.env.NEXT_PUBLIC_MAP_PROVIDER ||
      monorepoEnv.NEXT_PUBLIC_MAP_PROVIDER ||
      "",
    NEXT_PUBLIC_MAPBOX_TOKEN:
      process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
      monorepoEnv.NEXT_PUBLIC_MAPBOX_TOKEN ||
      "",
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      monorepoEnv.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      "",
  },
};

export default nextConfig;
