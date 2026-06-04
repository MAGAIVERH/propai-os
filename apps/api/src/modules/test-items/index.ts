import type { FastifyInstance } from "fastify";

import { registerTestItemsRoutes } from "./routes.js";

export async function registerTestItemsModule(
  app: FastifyInstance,
): Promise<void> {
  await registerTestItemsRoutes(app);
}
