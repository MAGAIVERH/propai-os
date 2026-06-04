import cors from "@fastify/cors";
import { fromNodeHeaders } from "better-auth/node";
import Fastify, { type FastifyInstance } from "fastify";

import { auth, TRUSTED_ORIGINS } from "./auth/better-auth.js";
import {
  getFastifyLoggerConfig,
  requestIdOptions,
} from "./lib/logger.js";
import { registerHealthModule } from "./modules/health/index.js";
import { securityPlugin } from "./plugins/security.js";
import { tenantContextPlugin } from "./plugins/tenant-context.js";
import { registerBrokerageAuthRoutes } from "./routes/brokerage-auth.js";
import { registerBrokerageInviteRoutes } from "./routes/brokerage-invite.js";
import { registerTestItemsRoutes } from "./routes/test-items.js";

type BuildAppOptions = {
  logger?: boolean;
  mountAuthRoutes?: boolean;
};

export async function buildApp(
  options: BuildAppOptions = {},
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: getFastifyLoggerConfig(options.logger ?? false),
    ...requestIdOptions,
  });
  const mountAuthRoutes = options.mountAuthRoutes ?? true;

  await app.register(cors, {
    origin: [...TRUSTED_ORIGINS],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  await app.register(securityPlugin);
  await registerHealthModule(app);

  if (mountAuthRoutes) {
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

  await app.register(tenantContextPlugin);
  await app.register(
    async (v1) => {
      await registerTestItemsRoutes(v1);
    },
    { prefix: "/v1" },
  );

  return app;
}
