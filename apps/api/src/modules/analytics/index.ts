import type { FastifyInstance } from "fastify";

import { registerAnalyticsExportRoutes } from "./export-routes.js";
import { registerAnalyticsRoutes } from "./routes.js";

export async function registerAnalyticsModule(
  app: FastifyInstance,
): Promise<void> {
  await registerAnalyticsRoutes(app);
  await registerAnalyticsExportRoutes(app);
}
