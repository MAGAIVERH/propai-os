// Throwaway connectivity check for the Upstash Redis staging instance.
// Reads REDIS_BULLMQ_URL_UPSTASH from the repo-root .env, connects with the
// exact ioredis options BullMQ uses, and runs PING. Safe to delete.
import Redis from "ioredis";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(here, "../../../.env");

function readEnvVar(name) {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && match[1] === name) return match[2].trim();
  }
  return null;
}

const url = readEnvVar("REDIS_BULLMQ_URL_UPSTASH");
if (!url) {
  console.error("❌ REDIS_BULLMQ_URL_UPSTASH not found in .env");
  process.exit(1);
}

const redis = new Redis(url, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: url.startsWith("rediss://") ? {} : undefined,
});

try {
  const pong = await redis.ping();
  await redis.set("propai:upstash:healthcheck", String(Date.now()), "EX", 60);
  const value = await redis.get("propai:upstash:healthcheck");
  console.log(`✅ PING -> ${pong}`);
  console.log(`✅ SET/GET roundtrip -> ${value}`);
  console.log("✅ Upstash staging Redis is reachable and writable.");
} catch (err) {
  console.error("❌ Upstash connection failed:", err.message);
  process.exitCode = 1;
} finally {
  await redis.quit();
}
