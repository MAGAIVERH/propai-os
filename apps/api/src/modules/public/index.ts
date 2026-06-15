import type { FastifyInstance } from "fastify";

import { registerPublicRoutes } from "./routes.js";

export async function registerPublicModule(app: FastifyInstance): Promise<void> {
  await registerPublicRoutes(app);
}
