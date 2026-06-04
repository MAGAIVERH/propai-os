import type { FastifyInstance } from "fastify";

import { memberRolePlugin } from "../../plugins/require-member-role.js";
import { registerAuditRoutes } from "./routes.js";

export async function registerAuditModule(
  app: FastifyInstance,
): Promise<void> {
  await app.register(memberRolePlugin);
  await registerAuditRoutes(app);
}
