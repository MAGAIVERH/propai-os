import helmet from "@fastify/helmet";
import fp from "fastify-plugin";

/**
 * Security headers via Helmet.
 * crossOriginEmbedderPolicy is disabled so credentialed Better Auth cookies
 * work with CORS from localhost:3000 / localhost:3333.
 */
export const securityPlugin = fp(async (app) => {
  await app.register(helmet, {
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  });
});
