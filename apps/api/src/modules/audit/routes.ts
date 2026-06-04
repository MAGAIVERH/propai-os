import { auditLogs, runInTenantContext, TenantContextRequiredError } from "@propai/db";
import {
  auditActionSchema,
  auditLogListQuerySchema,
  type AuditLogEntry,
  type AuditLogListResponse,
} from "@propai/shared";
import { and, desc, eq, lt, or } from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { apiError } from "../../lib/api-error.js";
import {
  decodeAuditLogCursor,
  encodeAuditLogCursor,
} from "../../lib/audit-cursor.js";
import { createRequirePermissionHook } from "../../plugins/require-member-role.js";

function requireTenantId(request: FastifyRequest): string {
  if (!request.tenantId) {
    throw new TenantContextRequiredError();
  }

  return request.tenantId;
}

function mapAuditRow(row: {
  id: string;
  tenantId: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  ip: string | null;
  createdAt: Date;
}): AuditLogEntry | null {
  const parsedAction = auditActionSchema.safeParse(row.action);

  if (!parsedAction.success) {
    return null;
  }

  return {
    id: row.id,
    tenantId: row.tenantId,
    actorId: row.actorId,
    action: parsedAction.data,
    entityType: row.entityType,
    entityId: row.entityId,
    metadata: row.metadata,
    ip: row.ip,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function registerAuditRoutes(
  app: FastifyInstance,
): Promise<void> {
  const zodApp = app.withTypeProvider<ZodTypeProvider>();
  const requireAuditRead = createRequirePermissionHook("audit:read");

  zodApp.get(
    "/audit-logs",
    {
      schema: {
        querystring: auditLogListQuerySchema,
      },
      preHandler: requireAuditRead,
    },
    async (request, reply: FastifyReply) => {
      const tenantId = requireTenantId(request);
      const { limit, cursor } = auditLogListQuerySchema.parse(request.query);
      const decodedCursor = cursor ? decodeAuditLogCursor(cursor) : null;

      if (cursor && !decodedCursor) {
        return reply
          .status(400)
          .send(apiError("Bad Request", "Invalid pagination cursor."));
      }

      const rows = await runInTenantContext(tenantId, async (tx) => {
        const cursorFilter = decodedCursor
          ? or(
              lt(auditLogs.createdAt, decodedCursor.createdAt),
              and(
                eq(auditLogs.createdAt, decodedCursor.createdAt),
                lt(auditLogs.id, decodedCursor.id),
              ),
            )
          : undefined;

        return tx
          .select({
            id: auditLogs.id,
            tenantId: auditLogs.tenantId,
            actorId: auditLogs.actorId,
            action: auditLogs.action,
            entityType: auditLogs.entityType,
            entityId: auditLogs.entityId,
            metadata: auditLogs.metadata,
            ip: auditLogs.ip,
            createdAt: auditLogs.createdAt,
          })
          .from(auditLogs)
          .where(cursorFilter)
          .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
          .limit(limit + 1);
      });

      const hasMore = rows.length > limit;
      const pageRows = hasMore ? rows.slice(0, limit) : rows;
      const items = pageRows
        .map((row) => mapAuditRow(row))
        .filter((entry): entry is AuditLogEntry => entry !== null);

      const lastRow = pageRows.at(-1);
      const nextCursor =
        hasMore && lastRow
          ? encodeAuditLogCursor({
              createdAt: lastRow.createdAt,
              id: lastRow.id,
            })
          : null;

      const payload: AuditLogListResponse = {
        items,
        nextCursor,
      };

      return reply.status(200).send(payload);
    },
  );
}
