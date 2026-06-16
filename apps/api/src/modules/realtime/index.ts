import type { FastifyInstance } from "fastify";

import { registerRealtimeRoutes } from "./routes.js";

export async function registerRealtimeModule(
  app: FastifyInstance,
): Promise<void> {
  await registerRealtimeRoutes(app);
}
