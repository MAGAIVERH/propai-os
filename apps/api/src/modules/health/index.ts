import type { FastifyInstance } from "fastify";

import { registerHealthRoutes } from "./routes.js";

export async function registerHealthModule(
  app: FastifyInstance,
): Promise<void> {
  await registerHealthRoutes(app);
}
