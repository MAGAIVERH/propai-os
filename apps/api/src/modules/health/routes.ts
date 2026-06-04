import { APP_NAME, PRODUCT_TAGLINE } from "@propai/shared";
import type { FastifyInstance, FastifyReply } from "fastify";

import { pingDatabase } from "./db-ping.js";

type HealthResponse = {
  status: "ok";
  app: typeof APP_NAME;
  tagline: typeof PRODUCT_TAGLINE;
};

type ReadyOkResponse = {
  status: "ok";
};

type ReadyDegradedResponse = {
  status: "degraded";
  checks: {
    database: "down";
  };
};

export async function registerHealthRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get("/health", async (): Promise<HealthResponse> => ({
    status: "ok",
    app: APP_NAME,
    tagline: PRODUCT_TAGLINE,
  }));

  app.get(
    "/ready",
    async (
      _request,
      reply: FastifyReply,
    ): Promise<ReadyOkResponse | ReadyDegradedResponse> => {
      const databaseUp = await pingDatabase();

      if (!databaseUp) {
        const body: ReadyDegradedResponse = {
          status: "degraded",
          checks: { database: "down" },
        };
        return reply.status(503).send(body);
      }

      return { status: "ok" };
    },
  );
}
