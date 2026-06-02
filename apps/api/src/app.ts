import { APP_NAME, PRODUCT_TAGLINE } from "@propai/shared";
import { toNodeHandler } from "better-auth/node";
import Fastify, { type FastifyInstance } from "fastify";

import { auth } from "./auth/better-auth.js";
import { tenantContextPlugin } from "./plugins/tenant-context.js";
import { registerTestItemsRoutes } from "./routes/test-items.js";

type HealthResponse = {
  status: "ok";
  app: typeof APP_NAME;
  tagline: typeof PRODUCT_TAGLINE;
};

type BuildAppOptions = {
  logger?: boolean;
  mountAuthRoutes?: boolean;
};

export async function buildApp(
  options: BuildAppOptions = {},
): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? false });
  const mountAuthRoutes = options.mountAuthRoutes ?? true;

  app.get("/health", async (): Promise<HealthResponse> => ({
    status: "ok",
    app: APP_NAME,
    tagline: PRODUCT_TAGLINE,
  }));

  if (mountAuthRoutes) {
    const authHandler = toNodeHandler(auth);

    app.all("/api/auth/*", async (request, reply) => {
      await authHandler(request.raw, reply.raw);
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
