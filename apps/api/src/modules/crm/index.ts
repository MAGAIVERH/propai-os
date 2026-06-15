import type { FastifyInstance } from "fastify";

import { registerCrmRoutes } from "./routes.js";

export async function registerCrmModule(app: FastifyInstance): Promise<void> {
  await registerCrmRoutes(app);
}
