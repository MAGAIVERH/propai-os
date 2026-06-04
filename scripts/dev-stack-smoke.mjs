import {
  REPO_ROOT,
  check,
  exitFromResults,
  fail,
  fetchStatus,
  printResults,
  redisPingViaDocker,
  spawnApiServer,
  stopChildProcess,
  waitForHttpStatus,
  waitForTcpPort,
} from "./dev-lib.mjs";

const API_BASE = process.env.API_URL ?? "http://localhost:3333";
const HEALTH_URL = `${API_BASE.replace(/\/$/, "")}/health`;
const READY_URL = `${API_BASE.replace(/\/$/, "")}/ready`;

const spawnApi = process.argv.includes("--spawn-api");

/** @type {import("node:child_process").ChildProcess | null} */
let apiChild = null;

async function ensureApiReachable() {
  try {
    const status = await fetchStatus(HEALTH_URL, 200, 3_000);
    if (status === 200) {
      return;
    }
  } catch {
    // not reachable
  }

  if (!spawnApi) {
    throw new Error(
      `API is not reachable at ${HEALTH_URL}. Start "pnpm dev" in another terminal, or rerun with --spawn-api.`,
    );
  }

  console.log("Starting temporary API (pnpm --filter @propai/api start)…");
  apiChild = spawnApiServer();
  await waitForHttpStatus(HEALTH_URL, 200, 45_000);
}

async function main() {
  const results = [];

  console.log("\nPropAI OS — dev stack smoke\n");
  console.log(`Repo: ${REPO_ROOT}`);
  console.log(`API:  ${API_BASE}`);
  console.log(
    spawnApi
      ? "Mode: spawn temporary API for probes"
      : "Mode: expect API already running (pnpm dev)\n",
  );

  try {
    try {
      await waitForTcpPort("127.0.0.1", 5432, 5_000);
      results.push(check("PostgreSQL port 5432", true, "reachable"));
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      results.push(check("PostgreSQL port 5432", false, detail));
    }

    const redisOk = await redisPingViaDocker();
    results.push(
      check(
        "Redis PING (docker compose exec)",
        redisOk,
        redisOk ? "PONG" : "run pnpm docker:up",
      ),
    );

    await ensureApiReachable();

    const healthStatus = await fetchStatus(HEALTH_URL, 200);
    results.push(
      check(
        `GET ${HEALTH_URL}`,
        healthStatus === 200,
        `HTTP ${healthStatus}`,
      ),
    );

    const readyStatus = await fetchStatus(READY_URL, 200);
    results.push(
      check(
        `GET ${READY_URL}`,
        readyStatus === 200,
        readyStatus === 200
          ? "HTTP 200"
          : `HTTP ${readyStatus} — run pnpm db:migrate or pnpm docker:up`,
      ),
    );

    printResults("Dev stack smoke", results);
    exitFromResults(results);
    console.log("All dev stack smoke checks passed.\n");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push(check("Smoke runner", false, message));
    printResults("Dev stack smoke", results);
    fail(message);
    process.exitCode = 1;
  } finally {
    stopChildProcess(apiChild);
  }
}

process.on("SIGINT", () => {
  stopChildProcess(apiChild);
  process.exit(130);
});

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  fail(message);
  process.exitCode = 1;
});
