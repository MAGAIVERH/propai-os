import type { FastifyInstance } from "fastify";

import { registerTenantsRoutes } from "./routes.js";

export async function registerTenantsModule(
  app: FastifyInstance,
): Promise<void> {
  await registerTenantsRoutes(app);
}
