import { spawn } from "node:child_process";
import net from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { access, copyFile } from "node:fs/promises";
import { constants } from "node:fs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = resolve(SCRIPT_DIR, "..");

/** @param {string} message */
export function log(message) {
  console.log(message);
}

/** @param {string} message */
export function fail(message) {
  console.error(message);
}

/**
 * @param {string} name
 * @param {boolean} passed
 * @param {string} detail
 * @returns {{ name: string; passed: boolean; detail: string }}
 */
export function check(name, passed, detail) {
  return { name, passed, detail };
}

/**
 * @param {Array<{ name: string; passed: boolean; detail: string }>} results
 */
export function printResults(title, results) {
  console.log(`\n${title}\n`);
  for (const result of results) {
    const status = result.passed ? "PASS" : "FAIL";
    console.log(`[${status}] ${result.name} — ${result.detail}`);
  }
  console.log("");
}

/**
 * @param {Array<{ passed: boolean }>} results
 */
export function exitFromResults(results) {
  const failed = results.filter((result) => !result.passed);
  if (failed.length > 0) {
    process.exitCode = 1;
    throw new Error(`${failed.length} check(s) failed`);
  }
}

/**
 * @param {string} host
 * @param {number} port
 * @param {number} timeoutMs
 */
export function waitForTcpPort(host, port, timeoutMs = 60_000) {
  const started = Date.now();

  return new Promise((resolvePromise, rejectPromise) => {
    const attempt = () => {
      if (Date.now() - started > timeoutMs) {
        rejectPromise(
          new Error(`Timed out waiting for ${host}:${port} (${timeoutMs}ms)`),
        );
        return;
      }

      const socket = net.createConnection({ host, port });
      socket.setTimeout(2_000);

      socket.once("connect", () => {
        socket.destroy();
        resolvePromise();
      });

      socket.once("timeout", () => {
        socket.destroy();
        setTimeout(attempt, 500);
      });

      socket.once("error", () => {
        socket.destroy();
        setTimeout(attempt, 500);
      });
    };

    attempt();
  });
}

/**
 * @param {string} url
 * @param {number} expectedStatus
 * @param {number} timeoutMs
 */
export async function fetchStatus(url, expectedStatus, timeoutMs = 10_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response.status;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {string} url
 * @param {number} expectedStatus
 * @param {number} timeoutMs
 * @param {number} intervalMs
 */
export async function waitForHttpStatus(
  url,
  expectedStatus,
  timeoutMs = 30_000,
  intervalMs = 500,
) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    try {
      const status = await fetchStatus(url, expectedStatus, 5_000);
      if (status === expectedStatus) {
        return status;
      }
    } catch {
      // retry
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, intervalMs));
  }

  throw new Error(`Timed out waiting for ${url} → HTTP ${expectedStatus}`);
}

/**
 * @param {string[]} args
 * @param {{ cwd?: string; label?: string }} [options]
 */
export function runCommand(args, options = {}) {
  const cwd = options.cwd ?? REPO_ROOT;
  const label = options.label ?? args.join(" ");

  return new Promise((resolvePromise, rejectPromise) => {
    const isWin = process.platform === "win32";
    const command = isWin ? "cmd.exe" : "sh";
    const commandArgs = isWin
      ? ["/d", "/s", "/c", args.join(" ")]
      : ["-c", args.join(" ")];

    const child = spawn(command, commandArgs, {
      cwd,
      stdio: "inherit",
      env: process.env,
    });

    child.on("error", (error) => {
      rejectPromise(new Error(`${label}: ${error.message}`));
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }
      rejectPromise(new Error(`${label} exited with code ${code ?? "unknown"}`));
    });
  });
}

/** @param {string} relativePath */
export async function fileExists(relativePath) {
  try {
    await access(resolve(REPO_ROOT, relativePath), constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function ensureEnvFile() {
  const envPath = resolve(REPO_ROOT, ".env");
  const examplePath = resolve(REPO_ROOT, ".env.example");

  if (await fileExists(".env")) {
    log(".env already exists — skipping copy");
    return;
  }

  await copyFile(examplePath, envPath);
  log("Created .env from .env.example");
  log("Edit BETTER_AUTH_SECRET (minimum 32 characters) before using auth.");
}

/**
 * @param {import("node:child_process").ChildProcess | null} child
 */
export function stopChildProcess(child) {
  if (!child || child.killed) {
    return;
  }

  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(child.pid), "/f", "/t"], {
      stdio: "ignore",
    });
    return;
  }

  child.kill("SIGTERM");
}

/**
 * @returns {import("node:child_process").ChildProcess}
 */
export function spawnApiServer() {
  const isWin = process.platform === "win32";
  const command = isWin ? "pnpm.cmd" : "pnpm";
  return spawn(command, ["--filter", "@propai/api", "start"], {
    cwd: REPO_ROOT,
    stdio: "ignore",
    env: process.env,
    shell: isWin,
  });
}

export async function redisPingViaDocker() {
  return new Promise((resolvePromise) => {
    const isWin = process.platform === "win32";
    const child = spawn(
      isWin ? "docker.exe" : "docker",
      ["compose", "exec", "-T", "redis", "redis-cli", "ping"],
      { cwd: REPO_ROOT, stdio: ["ignore", "pipe", "pipe"] },
    );

    let stdout = "";
    child.stdout?.on("data", (chunk) => {
      stdout += String(chunk);
    });

    child.on("close", (code) => {
      resolvePromise(code === 0 && stdout.trim().toUpperCase() === "PONG");
    });

    child.on("error", () => resolvePromise(false));
  });
}
