import { TenantContextRequiredError } from "@propai/db";
import type { RealtimeEvent } from "@propai/shared";
import type { FastifyInstance, FastifyRequest } from "fastify";

import { createRequirePermissionHook } from "../../plugins/require-member-role.js";

import { subscribeTenantEvents } from "./bus.js";

function requireTenantId(request: FastifyRequest): string {
  if (!request.tenantId) {
    throw new TenantContextRequiredError();
  }

  return request.tenantId;
}

export async function registerRealtimeRoutes(
  app: FastifyInstance,
): Promise<void> {
  const requireLeadsWrite = createRequirePermissionHook("leads:write");

  app.get(
    "/realtime",
    { websocket: true, preHandler: requireLeadsWrite },
    (socket, request) => {
      const tenantId = requireTenantId(request);

      const unsubscribe = subscribeTenantEvents(
        tenantId,
        (event: RealtimeEvent) => {
          socket.send(JSON.stringify(event));
        },
      );

      socket.on("close", unsubscribe);
      socket.on("error", unsubscribe);
    },
  );
}
