import type { FastifyInstance } from "fastify";

import { registerSearchRoutes } from "./routes.js";

export async function registerSearchModule(app: FastifyInstance): Promise<void> {
  await registerSearchRoutes(app);
}
