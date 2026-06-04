import net from "node:net";

const POSTGRES_HOST = "127.0.0.1";
const POSTGRES_PORT = 5432;
const TIMEOUT_MS = 1_500;

/**
 * Fast TCP probe — avoids spawning Docker or HTTP during every `pnpm dev`.
 * @param {string} host
 * @param {number} port
 * @param {number} timeoutMs
 */
function probePort(host, port, timeoutMs) {
  return new Promise((resolvePromise) => {
    const socket = net.createConnection({ host, port });
    const timer = setTimeout(() => {
      socket.destroy();
      resolvePromise(false);
    }, timeoutMs);

    socket.once("connect", () => {
      clearTimeout(timer);
      socket.destroy();
      resolvePromise(true);
    });

    socket.once("error", () => {
      clearTimeout(timer);
      socket.destroy();
      resolvePromise(false);
    });
  });
}

const ok = await probePort(POSTGRES_HOST, POSTGRES_PORT, TIMEOUT_MS);

if (!ok) {
  console.error(
    "\n[predev] PostgreSQL is not reachable on localhost:5432.\n" +
      "  Run: pnpm docker:up && pnpm db:migrate\n" +
      "  Or:  pnpm setup:local\n" +
      "  Guide: docs/LOCAL-DEV.md\n",
  );
  process.exit(1);
}
