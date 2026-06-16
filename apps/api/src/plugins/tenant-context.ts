import type { FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

import { getInitialOrganizationIdForUser } from "@propai/db";

import { apiError } from "../lib/api-error.js";
import { auth } from "../modules/auth/better-auth.js";
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

function toFetchHeaders(request: FastifyRequest): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (value !== undefined) {
      headers.set(key, Array.isArray(value) ? value.join(",") : value);
    }
  }
  return headers;
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

      let tenantId = await resolveTenantId(session);

      // Auto-heal: session exists but has no activeOrganizationId (e.g. old session
      // created before the sign-in flow set the active org). Find the user's org and
      // set it on the session so subsequent requests don't need a logout/login cycle.
      if (!tenantId && !session.session.activeOrganizationId && session.user.id) {
        const orgId = await getInitialOrganizationIdForUser(session.user.id);
        if (orgId) {
          await auth.api.setActiveOrganization({
            body: { organizationId: orgId },
            headers: toFetchHeaders(request),
          });
          tenantId = orgId;
        }
      }

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
