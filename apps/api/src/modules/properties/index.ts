import type { FastifyInstance } from "fastify";

import { registerPropertyImageConfirmRoute } from "./image-confirm-route.js";
import { registerPropertiesRoutes } from "./routes.js";

export async function registerPropertiesModule(
  app: FastifyInstance,
): Promise<void> {
  await registerPropertiesRoutes(app);
  await registerPropertyImageConfirmRoute(app);
}
