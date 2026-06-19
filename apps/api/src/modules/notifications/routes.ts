import { notifications, runInTenantContext, TenantContextRequiredError } from "@propai/db";
import {
  markAllReadResponseSchema,
  notificationListQuerySchema,
  notificationListResponseSchema,
  notificationParamsSchema,
  notificationResponseSchema,
} from "@propai/shared";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { apiError } from "../../lib/api-error.js";
import { createRequirePermissionHook } from "../../plugins/require-member-role.js";

import { mapNotificationRow } from "./create-notification.js";

const notificationSelectFields = {
  id: notifications.id,
  tenantId: notifications.tenantId,
  userId: notifications.userId,
  type: notifications.type,
  title: notifications.title,
  body: notifications.body,
  leadId: notifications.leadId,
  readAt: notifications.readAt,
  createdAt: notifications.createdAt,
} as const;

function requireTenantId(request: FastifyRequest): string {
  if (!request.tenantId) {
    throw new TenantContextRequiredError();
  }

  return request.tenantId;
}

function requireSessionUserId(request: FastifyRequest): string {
  const userId = request.session?.user.id;

  if (!userId) {
    throw new TenantContextRequiredError();
  }

  return userId;
}

const markReadResponseSchema = z.object({
  notification: notificationResponseSchema,
});

export async function registerNotificationRoutes(
  app: FastifyInstance,
): Promise<void> {
  const zodApp = app.withTypeProvider<ZodTypeProvider>();
  const requireLeadsWrite = createRequirePermissionHook("leads:write");

  // GET /notifications — current user's notifications + unread count
  zodApp.get(
    "/notifications",
    {
      schema: {
        querystring: notificationListQuerySchema,
        response: { 200: notificationListResponseSchema },
      },
      preHandler: requireLeadsWrite,
    },
    async (request, reply: FastifyReply) => {
      const tenantId = requireTenantId(request);
      const userId = requireSessionUserId(request);
      const { limit, unreadOnly } = notificationListQuerySchema.parse(
        request.query,
      );

      const { rows, unreadCount } = await runInTenantContext(
        tenantId,
        async (tx) => {
          const listFilter = unreadOnly
            ? and(eq(notifications.userId, userId), isNull(notifications.readAt))
            : eq(notifications.userId, userId);

          const dataRows = await tx
            .select(notificationSelectFields)
            .from(notifications)
            .where(listFilter)
            .orderBy(desc(notifications.createdAt))
            .limit(limit);

          const [unread] = await tx
            .select({ total: count() })
            .from(notifications)
            .where(
              and(
                eq(notifications.userId, userId),
                isNull(notifications.readAt),
              ),
            );

          return { rows: dataRows, unreadCount: unread?.total ?? 0 };
        },
      );

      return reply.status(200).send({
        notifications: rows.map((r) =>
          mapNotificationRow(r as Parameters<typeof mapNotificationRow>[0]),
        ),
        unreadCount,
      });
    },
  );

  // PATCH /notifications/:id/read — mark one as read
  zodApp.patch(
    "/notifications/:id/read",
    {
      schema: {
        params: notificationParamsSchema,
        response: { 200: markReadResponseSchema },
      },
      preHandler: requireLeadsWrite,
    },
    async (request, reply: FastifyReply) => {
      const tenantId = requireTenantId(request);
      const userId = requireSessionUserId(request);
      const { id } = notificationParamsSchema.parse(request.params);

      const updatedRows = await runInTenantContext(tenantId, async (tx) => {
        return tx
          .update(notifications)
          .set({ readAt: new Date() })
          .where(
            and(eq(notifications.id, id), eq(notifications.userId, userId)),
          )
          .returning(notificationSelectFields);
      });

      const updated = updatedRows[0];

      if (!updated) {
        return reply
          .status(404)
          .send(apiError("Not Found", "Notification not found."));
      }

      return reply.status(200).send({
        notification: mapNotificationRow(
          updated as Parameters<typeof mapNotificationRow>[0],
        ),
      });
    },
  );

  // POST /notifications/read-all — mark all of the user's unread as read
  zodApp.post(
    "/notifications/read-all",
    {
      schema: {
        response: { 200: markAllReadResponseSchema },
      },
      preHandler: requireLeadsWrite,
    },
    async (request, reply: FastifyReply) => {
      const tenantId = requireTenantId(request);
      const userId = requireSessionUserId(request);

      const updatedRows = await runInTenantContext(tenantId, async (tx) => {
        return tx
          .update(notifications)
          .set({ readAt: new Date() })
          .where(
            and(
              eq(notifications.userId, userId),
              isNull(notifications.readAt),
            ),
          )
          .returning({ id: notifications.id });
      });

      return reply.status(200).send({ updated: updatedRows.length });
    },
  );
}
