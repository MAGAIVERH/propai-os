import type { FastifyInstance } from "fastify";

import { memberRolePlugin } from "../../plugins/require-member-role.js";
import { registerPropertiesRoutes } from "./routes.js";

export async function registerPropertiesModule(
  app: FastifyInstance,
): Promise<void> {
  await app.register(memberRolePlugin);
  await registerPropertiesRoutes(app);
}
