import { TenantContextRequiredError } from "@propai/db";
import {
  analyzePropertyImagesRequestSchema,
  analyzePropertyImagesResponseSchema,
  MOCK_PROPERTY_IMAGE_ANALYSIS,
} from "@propai/shared";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { isAiVisionEnabled } from "../../lib/ai-feature-flags.js";
import { apiError } from "../../lib/api-error.js";
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

export async function registerAiRoutes(app: FastifyInstance): Promise<void> {
  const zodApp = app.withTypeProvider<ZodTypeProvider>();
  const requirePropertiesWrite = createRequirePermissionHook("properties:write");

  zodApp.post(
    "/ai/analyze-property-images",
    {
      schema: {
        body: analyzePropertyImagesRequestSchema,
        response: {
          200: analyzePropertyImagesResponseSchema,
        },
      },
      preHandler: requirePropertiesWrite,
    },
    async (request, reply: FastifyReply) => {
      requireTenantId(request);
      requireSessionUserId(request);
      requireMemberRole(request);

      analyzePropertyImagesRequestSchema.parse(request.body);

      if (isAiVisionEnabled()) {
        return reply
          .status(503)
          .send(
            apiError(
              "Service Unavailable",
              "AI vision is not implemented yet",
            ),
          );
      }

      const response = analyzePropertyImagesResponseSchema.parse(
        MOCK_PROPERTY_IMAGE_ANALYSIS,
      );

      return reply.status(200).send(response);
    },
  );
}
