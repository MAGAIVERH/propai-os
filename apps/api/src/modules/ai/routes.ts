import { properties, runInTenantContext, TenantContextRequiredError } from "@propai/db";
import {
  analyzeImagesJobParamsSchema,
  analyzeImagesJobStatusResponseSchema,
  analyzePropertyImagesRequestSchema,
  analyzePropertyImagesResponseSchema,
  enqueueAnalyzeImagesJobResponseSchema,
  MOCK_LEAD_SCORING_RESULT,
  MOCK_PROPERTY_IMAGE_ANALYSIS,
  scoreLeadRequestSchema,
  scoreLeadResponseSchema,
} from "@propai/shared";
import { and, eq, isNull } from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import {
  checkAiVisionRateLimit,
  consumeAiVisionRateLimit,
} from "../../lib/ai-vision-rate-limit.js";
import {
  isAiScoringEnabled,
  isAiVisionEnabled,
} from "../../lib/ai-feature-flags.js";
import { apiError } from "../../lib/api-error.js";
import { BullMqRedisUnavailableError } from "../../lib/redis-bullmq.js";
import { RedisUnavailableError } from "../../lib/redis.js";
import { assertTenantImageUrls } from "../../lib/validate-tenant-image-url.js";
import { createRequirePermissionHook } from "../../plugins/require-member-role.js";
import { AiAnalysisParseError, AiProviderNotConfiguredError } from "./ai-errors.js";
import { getJobStatus } from "./queries/get-job-status.js";
import { enqueueAnalyzeImagesJob } from "./queues/analyze-images-queue.js";
import { scoreLeadWithAI } from "./score-lead-service.js";

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

  /**
   * POST /ai/score-lead
   *
   * Scores a lead (0–100) based on lead data + matched property context.
   * Returns priority label (hot/warm/cold) and a short reasoning string.
   *
   * Flag off → mock score (200). Flag on → real LLM call (OpenAI gpt-4o-mini).
   * Score persistence is wired in Day 36 when the `leads` table is added.
   */
  zodApp.post(
    "/ai/score-lead",
    {
      schema: {
        body: scoreLeadRequestSchema,
        response: {
          200: scoreLeadResponseSchema,
        },
      },
      preHandler: requirePropertiesWrite,
    },
    async (request, reply: FastifyReply) => {
      const tenantId = requireTenantId(request);

      const body = scoreLeadRequestSchema.parse(request.body);

      if (!isAiScoringEnabled()) {
        return reply
          .status(200)
          .send(scoreLeadResponseSchema.parse(MOCK_LEAD_SCORING_RESULT));
      }

      // Fetch property in tenant context (RLS enforced)
      const property = await runInTenantContext(tenantId, async (tx) => {
        const rows = await tx
          .select({
            id: properties.id,
            title: properties.title,
            priceUsdCents: properties.priceUsdCents,
            city: properties.city,
            state: properties.state,
            bedrooms: properties.bedrooms,
            sqFt: properties.sqFt,
          })
          .from(properties)
          .where(
            and(
              eq(properties.id, body.propertyId),
              isNull(properties.softDeletedAt),
            ),
          )
          .limit(1);

        return rows[0] ?? null;
      });

      if (!property) {
        return reply
          .status(404)
          .send(apiError("Not Found", "Property not found."));
      }

      try {
        const result = await scoreLeadWithAI(body.leadData, {
          title: property.title,
          priceUsdCents: property.priceUsdCents,
          city: property.city,
          state: property.state,
          bedrooms: property.bedrooms,
          sqFt: property.sqFt,
        });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof AiProviderNotConfiguredError) {
          return reply
            .status(503)
            .send(apiError("Service Unavailable", "AI provider is not configured."));
        }

        if (error instanceof AiAnalysisParseError) {
          return reply
            .status(422)
            .send(apiError("Unprocessable Entity", error.message));
        }

        throw error;
      }
    },
  );
}
