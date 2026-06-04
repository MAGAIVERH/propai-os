import {
  REPO_ROOT,
  ensureEnvFile,
  fail,
  log,
  runCommand,
  waitForTcpPort,
} from "./dev-lib.mjs";

const POSTGRES_PORT = 5432;
const REDIS_PORT = 6379;

async function main() {
  log("PropAI OS — local setup (Docker + migrations)\n");
  log(`Repo: ${REPO_ROOT}\n`);

  try {
    await runCommand(["docker", "version"], { label: "docker version" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fail(`Docker is required. Start Docker Desktop and retry.\n${message}`);
    process.exitCode = 1;
    return;
  }

  await ensureEnvFile();

  log("\nStarting Postgres + Redis (docker compose up -d)…");
  await runCommand(["docker", "compose", "up", "-d"], { label: "docker compose up -d" });

  log("\nWaiting for Postgres and Redis ports…");
  await waitForTcpPort("127.0.0.1", POSTGRES_PORT);
  await waitForTcpPort("127.0.0.1", REDIS_PORT);
  log("Postgres and Redis are reachable on localhost.");

  log("\nApplying database migrations…");
  await runCommand(["pnpm", "db:migrate"], { label: "pnpm db:migrate" });

  log("\nSetup complete.\n");
  log("Next steps:");
  log("  1. Ensure BETTER_AUTH_SECRET in .env is at least 32 characters.");
  log("  2. pnpm dev              # API :3333 + dashboard :3000");
  log("  3. pnpm dev:smoke        # validate /health and /ready (API must be running)");
  log("     pnpm dev:smoke --spawn-api   # or start a temporary API for the smoke");
  log("\nFull guide: docs/LOCAL-DEV.md\n");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  fail(message);
  process.exitCode = 1;
});
