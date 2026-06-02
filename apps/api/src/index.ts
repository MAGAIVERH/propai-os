import { APP_NAME, PRODUCT_TAGLINE } from "@propai/shared";
import Fastify from "fastify";

const DEFAULT_PORT = 3333;

type HealthResponse = {
  status: "ok";
  app: typeof APP_NAME;
  tagline: typeof PRODUCT_TAGLINE;
};

async function main(): Promise<void> {
  const app = Fastify({ logger: true });

  app.get("/health", async (): Promise<HealthResponse> => ({
    status: "ok",
    app: APP_NAME,
    tagline: PRODUCT_TAGLINE,
  }));

  const port = Number(process.env.PORT ?? DEFAULT_PORT);
  const host = process.env.HOST ?? "0.0.0.0";

  await app.listen({ port, host });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
