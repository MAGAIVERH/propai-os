import type { FastifyInstance } from "fastify";

import { registerAuditRoutes } from "./routes.js";

export async function registerAuditModule(
  app: FastifyInstance,
): Promise<void> {
  await registerAuditRoutes(app);
}
