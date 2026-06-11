import { buildApp } from "./app.js";
import { closeBullMqConnections } from "./lib/redis-bullmq.js";
import { closeRedisClient } from "./lib/redis.js";

const DEFAULT_PORT = 3333;

export async function startServer(): Promise<void> {
  const app = await buildApp({ logger: true });

  const port = Number(process.env.PORT ?? DEFAULT_PORT);
  const host = process.env.HOST ?? "0.0.0.0";

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info({ signal }, "shutting down");
    await app.close();
    await Promise.all([closeRedisClient(), closeBullMqConnections()]);
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });

  try {
    await app.listen({ port, host });
    app.log.info({ port, host }, "server listening");
  } catch (error: unknown) {
    app.log.error(error);
    process.exit(1);
  }
}
