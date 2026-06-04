import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

import { tryAuditInvitationAccepted } from "../lib/audit-invitation-accepted.js";
import { auth } from "../modules/auth/better-auth.js";
import { registerBrokerageAuthRoutes } from "../modules/auth/routes/brokerage-auth.js";
import { registerBrokerageInviteRoutes } from "../modules/auth/routes/brokerage-invite.js";

export type AuthPluginOptions = {
  /** When false, skips Better Auth + brokerage routes (integration tests). */
  mountAuthRoutes?: boolean;
};

async function registerBetterAuthHandler(app: FastifyInstance): Promise<void> {
  app.all(
    "/api/auth/*",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const host = request.headers.host ?? "localhost:3333";
      const url = new URL(request.url, `http://${host}`);
      const headers = fromNodeHeaders(request.headers);
      const requestBody = request.body;

      let body: string | undefined;

      if (
        request.method !== "GET" &&
        request.method !== "HEAD" &&
        requestBody !== undefined &&
        requestBody !== null
      ) {
        body =
          typeof requestBody === "string"
            ? requestBody
            : JSON.stringify(requestBody);
      }

      const authRequest = new Request(url.toString(), {
        method: request.method,
        headers,
        body,
      });

      const response = await auth.handler(authRequest);

      if (url.pathname.endsWith("/accept-invitation")) {
        await tryAuditInvitationAccepted(
          request,
          response.status,
          requestBody,
        );
      }

      reply.status(response.status);
      response.headers.forEach((value, key) => {
        void reply.header(key, value);
      });

      const responseText = await response.text();

      if (!responseText) {
        return reply.send();
      }

      return reply.send(JSON.parse(responseText) as unknown);
    },
  );
}

/**
 * Better Auth catch-all + brokerage sign-up / invite routes.
 */
export const authPlugin = fp<AuthPluginOptions>(
  async (app, options) => {
    const mountAuthRoutes = options.mountAuthRoutes ?? true;

    if (!mountAuthRoutes) {
      return;
    }

    await registerBrokerageAuthRoutes(app);
    await registerBrokerageInviteRoutes(app);
    await registerBetterAuthHandler(app);
  },
  { name: "propai-auth" },
);
