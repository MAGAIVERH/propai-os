import type { FastifyInstance } from "fastify";

import { registerUploadsRoutes } from "./routes.js";

export async function registerUploadsModule(
  app: FastifyInstance,
): Promise<void> {
  await registerUploadsRoutes(app);
}
