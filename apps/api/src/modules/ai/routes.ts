import { TenantContextRequiredError } from "@propai/db";
import {
  analyzePropertyImagesRequestSchema,
  analyzePropertyImagesResponseSchema,
  MOCK_PROPERTY_IMAGE_ANALYSIS,
} from "@propai/shared";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import {
  checkAiVisionRateLimit,
  consumeAiVisionRateLimit,
} from "../../lib/ai-vision-rate-limit.js";
import { isAiVisionEnabled } from "../../lib/ai-feature-flags.js";
import { apiError } from "../../lib/api-error.js";
import { RedisUnavailableError } from "../../lib/redis.js";
import { assertTenantImageUrls } from "../../lib/validate-tenant-image-url.js";
import { createRequirePermissionHook } from "../../plugins/require-member-role.js";
import {
  AiAnalysisParseError,
  AiProviderNotConfiguredError,
} from "./ai-errors.js";
import { analyzePropertyImages } from "./analyze-property-images-service.js";

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

      const body = analyzePropertyImagesRequestSchema.parse(request.body);

      // Day 26 path: mock JSON only — no Redis, no URL validation, no LLM.
      if (!isAiVisionEnabled()) {
        const response = analyzePropertyImagesResponseSchema.parse(
          MOCK_PROPERTY_IMAGE_ANALYSIS,
        );

        return reply.status(200).send(response);
      }

      const tenantId = requireTenantId(request);

      // Flag on — HTTP mapping:
      // Redis unavailable → 503
      // Rate limit exceeded → 429 + Retry-After
      // Invalid / foreign image URLs → 400
      // Gemini not configured → 503
      // LLM / Zod failure → 502
      // Success → 200
      try {
        const rateLimit = await checkAiVisionRateLimit(tenantId);

        if (!rateLimit.allowed) {
          return reply
            .header("Retry-After", String(rateLimit.retryAfterSeconds))
            .status(429)
            .send(
              apiError(
                "Too Many Requests",
                "AI vision rate limit exceeded for this organization.",
              ),
            );
        }

        const urlValidation = assertTenantImageUrls(tenantId, body.imageUrls);

        if (!urlValidation.ok) {
          return reply
            .status(400)
            .send(apiError("Bad Request", urlValidation.message));
        }

        await consumeAiVisionRateLimit(tenantId);

        const analysis = await analyzePropertyImages(body.imageUrls);
        const response = analyzePropertyImagesResponseSchema.parse(analysis);

        return reply.status(200).send(response);
      } catch (error) {
        if (error instanceof RedisUnavailableError) {
          return reply
            .status(503)
            .send(apiError("Service Unavailable", error.message));
        }

        if (error instanceof AiProviderNotConfiguredError) {
          return reply
            .status(503)
            .send(apiError("Service Unavailable", error.message));
        }

        if (error instanceof AiAnalysisParseError) {
          return reply
            .status(502)
            .send(apiError("Bad Gateway", error.message));
        }

        throw error;
      }
    },
  );
}
