import type { FastifyInstance } from "fastify";

import { registerAiRoutes } from "./routes.js";

export async function registerAiModule(app: FastifyInstance): Promise<void> {
  await registerAiRoutes(app);
}
