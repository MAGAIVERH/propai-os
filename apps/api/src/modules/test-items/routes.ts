import {
  runInTenantContext,
  TenantContextRequiredError,
  testItems,
} from "@propai/db";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { apiError } from "../../lib/api-error.js";
import { writeAuditEventSafe } from "../../lib/write-audit-event.js";
import { MOCK_SESSION_DEFAULT_USER_ID } from "../auth/session.js";
import { createTestItemSchema } from "./schemas/test-items.js";

type TestItemResponse = {
  id: string;
  tenantId: string;
  name: string;
  createdAt: string;
};

function requireTenantId(request: FastifyRequest): string {
  if (!request.tenantId) {
    throw new TenantContextRequiredError();
  }

  return request.tenantId;
}

export async function registerTestItemsRoutes(
  app: FastifyInstance,
): Promise<void> {
  const zodApp = app.withTypeProvider<ZodTypeProvider>();

  zodApp.get(
    "/test-items",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = requireTenantId(request);

      const rows = await runInTenantContext(tenantId, async (tx) => {
        return tx.select().from(testItems);
      });

      const payload: TestItemResponse[] = rows.map((row) => ({
        id: row.id,
        tenantId: row.tenantId,
        name: row.name,
        createdAt: row.createdAt.toISOString(),
      }));

      return reply.status(200).send({ items: payload });
    },
  );

  zodApp.post(
    "/test-items",
    {
      schema: {
        body: createTestItemSchema,
      },
    },
    async (request, reply) => {
      const tenantId = requireTenantId(request);
      const { name } = request.body;

      const [created] = await runInTenantContext(tenantId, async (tx) => {
        return tx
          .insert(testItems)
          .values({
            tenantId,
            name,
          })
          .returning();
      });

      if (!created) {
        return reply
          .status(500)
          .send(
            apiError("Internal Server Error", "Failed to create test item."),
          );
      }

      const sessionUserId = request.session?.user.id ?? null;
      const actorId =
        process.env.NODE_ENV === "test" &&
        sessionUserId === MOCK_SESSION_DEFAULT_USER_ID
          ? null
          : sessionUserId;

      await writeAuditEventSafe({
        tenantId,
        actorId,
        action: "test_item.created",
        entityType: "test_item",
        entityId: created.id,
        metadata: { name: created.name },
        ip: request.ip,
      });

      const payload: TestItemResponse = {
        id: created.id,
        tenantId: created.tenantId,
        name: created.name,
        createdAt: created.createdAt.toISOString(),
      };

      return reply.status(201).send({ item: payload });
    },
  );
}
