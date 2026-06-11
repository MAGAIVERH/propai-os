import { TenantContextRequiredError } from "@propai/db";
import {
  analyzeImagesJobParamsSchema,
  analyzeImagesJobStatusResponseSchema,
  analyzePropertyImagesRequestSchema,
  analyzePropertyImagesResponseSchema,
  enqueueAnalyzeImagesJobResponseSchema,
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
import { BullMqRedisUnavailableError } from "../../lib/redis-bullmq.js";
import { RedisUnavailableError } from "../../lib/redis.js";
import { assertTenantImageUrls } from "../../lib/validate-tenant-image-url.js";
import { createRequirePermissionHook } from "../../plugins/require-member-role.js";
import { getJobStatus } from "./queries/get-job-status.js";
import { enqueueAnalyzeImagesJob } from "./queues/analyze-images-queue.js";

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
          202: enqueueAnalyzeImagesJobResponseSchema,
        },
      },
      preHandler: requirePropertiesWrite,
    },
    async (request, reply: FastifyReply) => {
      requireTenantId(request);
      requireSessionUserId(request);
      requireMemberRole(request);

      const body = analyzePropertyImagesRequestSchema.parse(request.body);

      // Day 26 path: mock JSON only — no Redis, no URL validation, no queue.
      if (!isAiVisionEnabled()) {
        const response = analyzePropertyImagesResponseSchema.parse(
          MOCK_PROPERTY_IMAGE_ANALYSIS,
        );

        return reply.status(200).send(response);
      }

      const tenantId = requireTenantId(request);

      // Flag on — async queue path:
      // Redis unavailable → 503
      // Rate limit exceeded → 429 + Retry-After
      // Invalid / foreign image URLs → 400
      // Success → 202 + jobId
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

        const jobId = await enqueueAnalyzeImagesJob({
          tenantId,
          imageUrls: body.imageUrls,
        });

        const response = enqueueAnalyzeImagesJobResponseSchema.parse({ jobId });

        return reply.status(202).send(response);
      } catch (error) {
        if (
          error instanceof RedisUnavailableError ||
          error instanceof BullMqRedisUnavailableError
        ) {
          return reply
            .status(503)
            .send(apiError("Service Unavailable", error.message));
        }

        throw error;
      }
    },
  );

  zodApp.get(
    "/ai/jobs/:jobId",
    {
      schema: {
        params: analyzeImagesJobParamsSchema,
        response: {
          200: analyzeImagesJobStatusResponseSchema,
        },
      },
      preHandler: requirePropertiesWrite,
    },
    async (request, reply: FastifyReply) => {
      requireTenantId(request);
      requireSessionUserId(request);
      requireMemberRole(request);

      const tenantId = requireTenantId(request);
      const { jobId } = analyzeImagesJobParamsSchema.parse(request.params);

      if (!isAiVisionEnabled()) {
        return reply
          .status(503)
          .send(
            apiError(
              "Service Unavailable",
              "AI vision is disabled. Enable ENABLE_AI_VISION to poll job status.",
            ),
          );
      }

      try {
        const status = await getJobStatus(tenantId, jobId);

        if (!status) {
          return reply
            .status(404)
            .send(apiError("Not Found", "Analysis job was not found."));
        }

        return reply.status(200).send(status);
      } catch (error) {
        if (error instanceof BullMqRedisUnavailableError) {
          return reply
            .status(503)
            .send(apiError("Service Unavailable", error.message));
        }

        throw error;
      }
    },
  );
}
