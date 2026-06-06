import {
  REPO_ROOT,
  check,
  exitFromResults,
  fail,
  fileExists,
  printResults,
  runCommand,
} from "./dev-lib.mjs";

async function runStep(name, commandArgs, label) {
  try {
    await runCommand(commandArgs, { label });
    return check(name, true, "OK");
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return check(name, false, detail);
  }
}

function hasFailure(results) {
  return results.some((result) => !result.passed);
}

async function main() {
  const results = [];

  console.log("\nPropAI OS — web build smoke\n");
  console.log(`Repo: ${REPO_ROOT}\n`);
  console.log(
    "Guards @propai/shared dist/ consumption by Next.js (Turbopack module resolution).\n",
  );

  results.push(
    await runStep("pnpm typecheck", ["pnpm", "typecheck"], "pnpm typecheck"),
  );

  if (!hasFailure(results)) {
    results.push(
      await runStep(
        "@propai/shared build → dist/",
        ["pnpm", "--filter", "@propai/shared", "build"],
        "@propai/shared build",
      ),
    );
  }

  if (!hasFailure(results)) {
    const distIndexExists = await fileExists("packages/shared/dist/index.js");
    results.push(
      check(
        "packages/shared/dist/index.js",
        distIndexExists,
        distIndexExists ? "present" : "missing after shared build",
      ),
    );
  }

  if (!hasFailure(results)) {
    results.push(
      await runStep(
        "@propai/web build (Next.js/Turbopack)",
        ["pnpm", "--filter", "@propai/web", "build"],
        "@propai/web build",
      ),
    );
  }

  printResults("Web build smoke", results);
  exitFromResults(results);
  console.log("All web build smoke checks passed.\n");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  fail(message);
  process.exitCode = 1;
});
