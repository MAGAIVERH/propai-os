import type { FastifyInstance } from "fastify";

import { registerPropertiesRoutes } from "./routes.js";

export async function registerPropertiesModule(
  app: FastifyInstance,
): Promise<void> {
  await registerPropertiesRoutes(app);
}
