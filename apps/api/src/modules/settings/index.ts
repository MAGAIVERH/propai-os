import type { FastifyInstance } from "fastify";

import { registerSettingsRoutes } from "./routes.js";

export async function registerSettingsModule(app: FastifyInstance): Promise<void> {
  await registerSettingsRoutes(app);
}
