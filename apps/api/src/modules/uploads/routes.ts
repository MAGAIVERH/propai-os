import { TenantContextRequiredError } from "@propai/db";
import {
  presignDownloadQuerySchema,
  presignDownloadResponseSchema,
  presignUploadRequestSchema,
  presignUploadResponseSchema,
} from "@propai/shared";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { apiError } from "../../lib/api-error.js";
import {
  assertKeyBelongsToTenant,
  buildObjectKey,
  parseObjectKey,
} from "../../lib/object-key.js";
import { resolvePropertyForUpload } from "../../lib/resolve-property-for-upload.js";
import {
  createPresignedGetUrl,
  createPresignedPutUrl,
} from "../../lib/s3-client.js";
import { getStorageConfig } from "../../lib/storage-config.js";
import { createRequirePermissionHook } from "../../plugins/require-member-role.js";

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

function computeExpiresAt(expiresInSeconds: number): string {
  return new Date(Date.now() + expiresInSeconds * 1000).toISOString();
}

function sendStorageNotConfigured(reply: FastifyReply) {
  return reply
    .status(503)
    .send(
      apiError("Service Unavailable", "Object storage is not configured."),
    );
}

function sendKeyNotFound(reply: FastifyReply) {
  return reply.status(404).send(apiError("Not Found", "Object key not found."));
}

function sendPropertyNotFound(reply: FastifyReply) {
  return reply.status(404).send(apiError("Not Found", "Property not found."));
}

export async function registerUploadsRoutes(
  app: FastifyInstance,
): Promise<void> {
  const zodApp = app.withTypeProvider<ZodTypeProvider>();
  const requirePropertiesWrite = createRequirePermissionHook("properties:write");

  zodApp.post(
    "/uploads/presign",
    {
      schema: {
        body: presignUploadRequestSchema,
        response: {
          200: presignUploadResponseSchema,
        },
      },
      preHandler: requirePropertiesWrite,
    },
    async (request, reply: FastifyReply) => {
      const tenantId = requireTenantId(request);
      const userId = requireSessionUserId(request);
      const role = requireMemberRole(request);
      const body = presignUploadRequestSchema.parse(request.body);

      const storageConfig = getStorageConfig();

      if (!storageConfig) {
        return sendStorageNotConfigured(reply);
      }

      const property = await resolvePropertyForUpload(
        tenantId,
        body.propertyId,
        role,
        userId,
      );

      if (!property) {
        return sendPropertyNotFound(reply);
      }

      let key: string;

      try {
        key = buildObjectKey({
          tenantId,
          propertyId: body.propertyId,
          contentType: body.contentType,
        });
      } catch {
        return reply
          .status(400)
          .send(
            apiError(
              "Bad Request",
              "Unsupported image content type for upload.",
            ),
          );
      }

      const uploadUrl = await createPresignedPutUrl(
        {
          key,
          contentType: body.contentType,
          contentLength: body.contentLength,
          expiresIn: storageConfig.presignExpiresSeconds,
        },
        storageConfig,
      );

      if (!uploadUrl) {
        return sendStorageNotConfigured(reply);
      }

      const expiresAt = computeExpiresAt(storageConfig.presignExpiresSeconds);

      return reply.status(200).send({
        uploadUrl,
        key,
        expiresAt,
        headers: {
          "Content-Type": body.contentType,
        },
      });
    },
  );

  zodApp.get(
    "/uploads/presign-download",
    {
      schema: {
        querystring: presignDownloadQuerySchema,
        response: {
          200: presignDownloadResponseSchema,
        },
      },
      preHandler: requirePropertiesWrite,
    },
    async (request, reply: FastifyReply) => {
      const tenantId = requireTenantId(request);
      const userId = requireSessionUserId(request);
      const role = requireMemberRole(request);
      const { key } = presignDownloadQuerySchema.parse(request.query);

      if (!assertKeyBelongsToTenant(key, tenantId)) {
        return sendKeyNotFound(reply);
      }

      const parsedKey = parseObjectKey(key);

      if (!parsedKey) {
        return sendKeyNotFound(reply);
      }

      const property = await resolvePropertyForUpload(
        tenantId,
        parsedKey.propertyId,
        role,
        userId,
      );

      if (!property) {
        return sendPropertyNotFound(reply);
      }

      const storageConfig = getStorageConfig();

      if (!storageConfig) {
        return sendStorageNotConfigured(reply);
      }

      const downloadUrl = await createPresignedGetUrl(
        { key, expiresIn: storageConfig.presignExpiresSeconds },
        storageConfig,
      );

      if (!downloadUrl) {
        return sendStorageNotConfigured(reply);
      }

      const expiresAt = computeExpiresAt(storageConfig.presignExpiresSeconds);

      return reply.status(200).send({
        downloadUrl,
        expiresAt,
      });
    },
  );
}
