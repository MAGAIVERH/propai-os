import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import Fastify, { type FastifyInstance } from "fastify";

import { TRUSTED_ORIGINS } from "./modules/auth/index.js";

import {
  getFastifyLoggerConfig,
  requestIdOptions,
} from "./lib/logger.js";
import { registerAiModule } from "./modules/ai/index.js";
import { registerAnalyticsModule } from "./modules/analytics/index.js";
import { registerAuditModule } from "./modules/audit/index.js";
import {
  registerBillingModule,
  registerStripeWebhook,
} from "./modules/billing/index.js";
import { registerCrmModule } from "./modules/crm/index.js";
import { registerHealthModule } from "./modules/health/index.js";
import { registerNotificationsModule } from "./modules/notifications/index.js";
import { registerPropertiesModule } from "./modules/properties/index.js";
import { registerPublicModule } from "./modules/public/index.js";
import { registerRealtimeModule } from "./modules/realtime/index.js";
import { registerSearchModule } from "./modules/search/index.js";
import { registerSettingsModule } from "./modules/settings/index.js";
import { registerTenantsModule } from "./modules/tenants/index.js";
import { registerUploadsModule } from "./modules/uploads/index.js";
import { registerTestItemsModule } from "./modules/test-items/index.js";
import { authPlugin } from "./plugins/auth.js";
import { errorHandlerPlugin } from "./plugins/error-handler.js";
import { memberRolePlugin } from "./plugins/require-member-role.js";
import { securityPlugin } from "./plugins/security.js";
import { tenantContextPlugin } from "./plugins/tenant-context.js";
import { zodValidatorPlugin } from "./plugins/zod-validator.js";

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

  await app.register(zodValidatorPlugin);
  await app.register(errorHandlerPlugin);

  await app.register(cors, {
    origin: [...TRUSTED_ORIGINS],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  await app.register(securityPlugin);
  await app.register(websocket);
  await registerHealthModule(app);

  await app.register(authPlugin, { mountAuthRoutes });

  await registerSearchModule(app);
  await registerPublicModule(app);
  await registerStripeWebhook(app);

  await app.register(tenantContextPlugin);
  await app.register(memberRolePlugin);
  await app.register(
    async (v1) => {
      await registerTenantsModule(v1);
      await registerTestItemsModule(v1);
      await registerAuditModule(v1);
      await registerPropertiesModule(v1);
      await registerUploadsModule(v1);
      await registerAiModule(v1);
      await registerCrmModule(v1);
      await registerNotificationsModule(v1);
      await registerRealtimeModule(v1);
      await registerAnalyticsModule(v1);
      await registerBillingModule(v1);
      await registerSettingsModule(v1);
    },
    { prefix: "/v1" },
  );

  return app;
}
