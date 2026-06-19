import type { FastifyInstance } from "fastify";

import { registerNotificationRoutes } from "./routes.js";

export async function registerNotificationsModule(
  app: FastifyInstance,
): Promise<void> {
  await registerNotificationRoutes(app);
}
