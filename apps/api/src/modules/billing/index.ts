import type { FastifyInstance } from "fastify";

import { registerBillingRoutes } from "./routes.js";

export async function registerBillingModule(app: FastifyInstance): Promise<void> {
  await registerBillingRoutes(app);
}

export { registerStripeWebhook } from "./webhook-routes.js";
