import {
  properties,
  propertyImages,
  runInTenantContext,
  TenantContextRequiredError,
} from "@propai/db";
import {
  imageConfirmRequestSchema,
  imageConfirmResponseSchema,
  propertyImageListResponseSchema,
} from "@propai/shared";
import { asc, eq } from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { apiError } from "../../lib/api-error.js";
import {
  assertKeyBelongsToTenant,
  assertKeyMatchesTenantProperty,
  mimeTypeMatchesExtension,
  parseObjectKey,
} from "../../lib/object-key.js";
import {
  assertPropertyAccess,
  type PropertyAccessResult,
} from "../../lib/property-access.js";
import { writeAuditEventSafe } from "../../lib/write-audit-event.js";
import { MOCK_SESSION_DEFAULT_USER_ID } from "../auth/session.js";
import { createRequirePermissionHook } from "../../plugins/require-member-role.js";

const propertyIdParamsSchema = z.object({
  id: z.uuid(),
});

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

function requireMemberRole(request: FastifyRequest) {
  if (!request.memberRole) {
    throw new Error("Member role is required after permission check.");
  }

  return request.memberRole;
}

function resolveActorId(request: FastifyRequest): string | null {
  const sessionUserId = request.session?.user.id ?? null;

  if (
    process.env.NODE_ENV === "test" &&
    sessionUserId === MOCK_SESSION_DEFAULT_USER_ID
  ) {
    return null;
  }

  return sessionUserId;
}

function sendPropertyAccessFailure(
  reply: FastifyReply,
  access: PropertyAccessResult,
): boolean {
  if (access.allowed) {
    return false;
  }

  if (access.reason === "forbidden") {
    void reply
      .status(403)
      .send(apiError("Forbidden", "Insufficient permissions for this action."));
    return true;
  }

  void reply.status(404).send(apiError("Not Found", "Property not found."));
  return true;
}

function sendInvalidObjectKey(reply: FastifyReply) {
  return reply
    .status(400)
    .send(apiError("Bad Request", "Invalid object key format."));
}

function sendObjectKeyNotFound(reply: FastifyReply) {
  return reply.status(404).send(apiError("Not Found", "Object key not found."));
}

function sendMimeTypeMismatch(reply: FastifyReply) {
  return reply
    .status(400)
    .send(
      apiError(
        "Bad Request",
        "MIME type does not match the object key extension.",
      ),
    );
}

export async function registerPropertyImageConfirmRoute(
  app: FastifyInstance,
): Promise<void> {
  const zodApp = app.withTypeProvider<ZodTypeProvider>();
  const requirePropertiesWrite = createRequirePermissionHook("properties:write");

  zodApp.get(
    "/properties/:id/images",
    {
      schema: {
        params: propertyIdParamsSchema,
        response: {
          200: propertyImageListResponseSchema,
        },
      },
      preHandler: requirePropertiesWrite,
    },
    async (request, reply: FastifyReply) => {
      const tenantId = requireTenantId(request);
      const userId = requireSessionUserId(request);
      const role = requireMemberRole(request);
      const { id: propertyId } = propertyIdParamsSchema.parse(request.params);

      const existingRows = await runInTenantContext(tenantId, async (tx) => {
        return tx
          .select({
            createdBy: properties.createdBy,
            softDeletedAt: properties.softDeletedAt,
          })
          .from(properties)
          .where(eq(properties.id, propertyId))
          .limit(1);
      });

      const existing = existingRows[0];
      const access = assertPropertyAccess(role, userId, existing);

      if (sendPropertyAccessFailure(reply, access)) {
        return;
      }

      const rows = await runInTenantContext(tenantId, async (tx) => {
        return tx
          .select({
            id: propertyImages.id,
            propertyId: propertyImages.propertyId,
            storageKey: propertyImages.storageKey,
            sortOrder: propertyImages.sortOrder,
            isPrimary: propertyImages.isPrimary,
            createdAt: propertyImages.createdAt,
          })
          .from(propertyImages)
          .where(eq(propertyImages.propertyId, propertyId))
          .orderBy(asc(propertyImages.sortOrder), asc(propertyImages.createdAt));
      });

      return reply.status(200).send({
        items: rows.map((row) => ({
          id: row.id,
          propertyId: row.propertyId,
          storageKey: row.storageKey,
          sortOrder: row.sortOrder,
          isPrimary: row.isPrimary,
          createdAt: row.createdAt.toISOString(),
        })),
      });
    },
  );

  zodApp.post(
    "/properties/:id/images/confirm",
    {
      schema: {
        params: propertyIdParamsSchema,
        body: imageConfirmRequestSchema,
        response: {
          201: imageConfirmResponseSchema,
        },
      },
      preHandler: requirePropertiesWrite,
    },
    async (request, reply: FastifyReply) => {
      const tenantId = requireTenantId(request);
      const userId = requireSessionUserId(request);
      const role = requireMemberRole(request);
      const { id: propertyId } = propertyIdParamsSchema.parse(request.params);
      const body = imageConfirmRequestSchema.parse(request.body);

      const parsedKey = parseObjectKey(body.objectKey);

      if (!parsedKey) {
        return sendInvalidObjectKey(reply);
      }

      if (!assertKeyBelongsToTenant(body.objectKey, tenantId)) {
        return sendObjectKeyNotFound(reply);
      }

      if (!assertKeyMatchesTenantProperty(body.objectKey, tenantId, propertyId)) {
        return sendInvalidObjectKey(reply);
      }

      if (!mimeTypeMatchesExtension(body.mimeType, parsedKey.ext)) {
        return sendMimeTypeMismatch(reply);
      }

      const existingRows = await runInTenantContext(tenantId, async (tx) => {
        return tx
          .select({
            createdBy: properties.createdBy,
            softDeletedAt: properties.softDeletedAt,
          })
          .from(properties)
          .where(eq(properties.id, propertyId))
          .limit(1);
      });

      const existing = existingRows[0];
      const access = assertPropertyAccess(role, userId, existing);

      if (sendPropertyAccessFailure(reply, access)) {
        return;
      }

      const sortOrder = body.sortOrder ?? 0;

      const insertedRows = await runInTenantContext(tenantId, async (tx) => {
        return tx
          .insert(propertyImages)
          .values({
            propertyId,
            storageKey: body.objectKey,
            sortOrder,
          })
          .returning({
            id: propertyImages.id,
            propertyId: propertyImages.propertyId,
            storageKey: propertyImages.storageKey,
            sortOrder: propertyImages.sortOrder,
            isPrimary: propertyImages.isPrimary,
            createdAt: propertyImages.createdAt,
          });
      });

      const image = insertedRows[0];

      if (!image) {
        return reply
          .status(500)
          .send(
            apiError("Internal Server Error", "Failed to confirm property image."),
          );
      }

      await writeAuditEventSafe({
        tenantId,
        actorId: resolveActorId(request),
        action: "photo.uploaded",
        entityType: "property_image",
        entityId: image.id,
        metadata: {
          propertyId,
          imageId: image.id,
          objectKey: body.objectKey,
          mimeType: body.mimeType,
          sizeBytes: body.sizeBytes,
        },
        ip: request.ip,
      });

      return reply.status(201).send({
        image: {
          id: image.id,
          propertyId: image.propertyId,
          storageKey: image.storageKey,
          sortOrder: image.sortOrder,
          isPrimary: image.isPrimary,
          createdAt: image.createdAt.toISOString(),
        },
      });
    },
  );
}
