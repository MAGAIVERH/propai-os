import type { FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

import { apiError } from "../lib/api-error.js";
import { getSessionFromRequest } from "../modules/auth/session.js";
import { resolveTenantId } from "../modules/auth/resolve-tenant-id.js";
import type { PropAiSession } from "../modules/auth/types.js";

declare module "fastify" {
  interface FastifyRequest {
    session: PropAiSession | null;
    tenantId: string | null;
  }
}

function isProtectedRoute(url: string): boolean {
  return url.startsWith("/v1/");
}

export const tenantContextPlugin = fp(async (app) => {
  app.decorateRequest("session", null);
  app.decorateRequest("tenantId", null);

  app.addHook(
    "preHandler",
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!isProtectedRoute(request.url)) {
        return;
      }

      const session = await getSessionFromRequest(request);

      if (!session) {
        return reply
          .status(401)
          .send(apiError("Unauthorized", "Authentication required."));
      }

      const tenantId = await resolveTenantId(session);

      if (!tenantId) {
        return reply
          .status(403)
          .send(apiError("Forbidden", "Active organization required."));
      }

      request.session = session;
      request.tenantId = tenantId;
    },
  );
});
