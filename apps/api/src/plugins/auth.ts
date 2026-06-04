import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { auth } from "../modules/auth/better-auth.js";
import { registerBrokerageAuthRoutes } from "../modules/auth/routes/brokerage-auth.js";
import { registerBrokerageInviteRoutes } from "../modules/auth/routes/brokerage-invite.js";

export type AuthPluginOptions = {
  /** When false, skips Better Auth + brokerage routes (integration tests). */
  mountAuthRoutes?: boolean;
};

async function registerBetterAuthHandler(app: FastifyInstance): Promise<void> {
  app.all("/api/auth/*", async (request, reply) => {
    const host = request.headers.host ?? "localhost:3333";
    const url = new URL(request.url, `http://${host}`);
    const headers = fromNodeHeaders(request.headers);

    let body: string | undefined;

    if (
      request.method !== "GET" &&
      request.method !== "HEAD" &&
      request.body !== undefined &&
      request.body !== null
    ) {
      body =
        typeof request.body === "string"
          ? request.body
          : JSON.stringify(request.body);
    }

    const authRequest = new Request(url.toString(), {
      method: request.method,
      headers,
      body,
    });

    const response = await auth.handler(authRequest);

    reply.status(response.status);
    response.headers.forEach((value, key) => {
      void reply.header(key, value);
    });

    const responseText = await response.text();

    if (!responseText) {
      return reply.send();
    }

    return reply.send(JSON.parse(responseText) as unknown);
  });
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
