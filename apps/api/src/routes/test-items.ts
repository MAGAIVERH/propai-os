import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import {
  runInTenantContext,
  TenantContextRequiredError,
  testItems,
} from "@propai/db";

import { createTestItemSchema } from "../schemas/test-items.js";

type TestItemResponse = {
  id: string;
  tenantId: string;
  name: string;
  createdAt: string;
};

type ErrorBody = {
  error: string;
  message: string;
};

function requireTenantId(request: FastifyRequest): string {
  if (!request.tenantId) {
    throw new TenantContextRequiredError();
  }

  return request.tenantId;
}

export async function registerTestItemsRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/test-items",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
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
      } catch (error: unknown) {
        if (error instanceof TenantContextRequiredError) {
          const body: ErrorBody = {
            error: "Forbidden",
            message: error.message,
          };
          return reply.status(403).send(body);
        }

        throw error;
      }
    },
  );

  app.post(
    "/test-items",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = requireTenantId(request);
        const parsed = createTestItemSchema.safeParse(request.body);

        if (!parsed.success) {
          const body: ErrorBody = {
            error: "Bad Request",
            message: parsed.error.issues[0]?.message ?? "Invalid request body.",
          };
          return reply.status(400).send(body);
        }

        const [created] = await runInTenantContext(tenantId, async (tx) => {
          return tx
            .insert(testItems)
            .values({
              tenantId,
              name: parsed.data.name,
            })
            .returning();
        });

        if (!created) {
          const body: ErrorBody = {
            error: "Internal Server Error",
            message: "Failed to create test item.",
          };
          return reply.status(500).send(body);
        }

        const payload: TestItemResponse = {
          id: created.id,
          tenantId: created.tenantId,
          name: created.name,
          createdAt: created.createdAt.toISOString(),
        };

        return reply.status(201).send({ item: payload });
      } catch (error: unknown) {
        if (error instanceof TenantContextRequiredError) {
          const body: ErrorBody = {
            error: "Forbidden",
            message: error.message,
          };
          return reply.status(403).send(body);
        }

        throw error;
      }
    },
  );
}
