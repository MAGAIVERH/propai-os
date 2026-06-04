import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance } from "fastify";

import { auth } from "./better-auth.js";
import { registerBrokerageAuthRoutes } from "./routes/brokerage-auth.js";
import { registerBrokerageInviteRoutes } from "./routes/brokerage-invite.js";

export { auth, TRUSTED_ORIGINS } from "./better-auth.js";
export {
  createMockSessionAuthorization,
  getSessionFromRequest,
} from "./session.js";
export { resolveTenantId } from "./resolve-tenant-id.js";
export type { PropAiSession } from "./types.js";

export async function registerAuthModule(app: FastifyInstance): Promise<void> {
  await registerBrokerageAuthRoutes(app);
  await registerBrokerageInviteRoutes(app);

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
