import type { FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

import { getSessionFromRequest } from "../auth/session.js";
import { resolveTenantId } from "../auth/resolve-tenant-id.js";
import type { PropAiSession } from "../auth/types.js";

declare module "fastify" {
  interface FastifyRequest {
    session: PropAiSession | null;
    tenantId: string | null;
  }
}

type ErrorBody = {
  error: string;
  message: string;
};

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
        const body: ErrorBody = {
          error: "Unauthorized",
          message: "Authentication required.",
        };
        return reply.status(401).send(body);
      }

      const tenantId = await resolveTenantId(session);

      if (!tenantId) {
        const body: ErrorBody = {
          error: "Forbidden",
          message: "Active organization required.",
        };
        return reply.status(403).send(body);
      }

      request.session = session;
      request.tenantId = tenantId;
    },
  );
});
