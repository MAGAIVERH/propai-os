import { TenantContextRequiredError } from "@propai/db";
import {
  analyticsAgentsResponseSchema,
  analyticsFunnelResponseSchema,
  analyticsOverviewSchema,
  analyticsQuerySchema,
  analyticsViewsResponseSchema,
} from "@propai/shared";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { createRequirePermissionHook } from "../../plugins/require-member-role.js";
import {
  getAgents,
  getFunnel,
  getOverview,
  getViewsSeries,
  type AnalyticsScope,
} from "./queries/analytics-queries.js";

function requireTenantId(request: FastifyRequest): string {
  if (!request.tenantId) {
    throw new TenantContextRequiredError();
  }
  return request.tenantId;
}

/**
 * RBAC scope: agents see only their own leads' metrics; managers, owners, and
 * viewers see the whole tenant. `memberRole` is set by the permission hook.
 */
function resolveScope(request: FastifyRequest): AnalyticsScope {
  const tenantId = requireTenantId(request);
  const userId = request.session?.user.id;

  if (request.memberRole === "agent" && userId) {
    return { tenantId, agentId: userId };
  }
  return { tenantId };
}

export async function registerAnalyticsRoutes(
  app: FastifyInstance,
): Promise<void> {
  const zodApp = app.withTypeProvider<ZodTypeProvider>();
  const requireAnalyticsRead = createRequirePermissionHook("analytics:read");

  zodApp.get(
    "/analytics/overview",
    {
      schema: {
        querystring: analyticsQuerySchema,
        response: { 200: analyticsOverviewSchema },
      },
      preHandler: requireAnalyticsRead,
    },
    async (request, reply: FastifyReply) => {
      const { range } = analyticsQuerySchema.parse(request.query);
      const overview = await getOverview(resolveScope(request), range);
      return reply.status(200).send(overview);
    },
  );

  zodApp.get(
    "/analytics/funnel",
    {
      schema: { response: { 200: analyticsFunnelResponseSchema } },
      preHandler: requireAnalyticsRead,
    },
    async (request, reply: FastifyReply) => {
      const stages = await getFunnel(resolveScope(request));
      return reply.status(200).send({ stages });
    },
  );

  zodApp.get(
    "/analytics/agents",
    {
      schema: { response: { 200: analyticsAgentsResponseSchema } },
      preHandler: requireAnalyticsRead,
    },
    async (request, reply: FastifyReply) => {
      const agents = await getAgents(resolveScope(request));
      return reply.status(200).send({ agents });
    },
  );

  zodApp.get(
    "/analytics/views",
    {
      schema: {
        querystring: analyticsQuerySchema,
        response: { 200: analyticsViewsResponseSchema },
      },
      preHandler: requireAnalyticsRead,
    },
    async (request, reply: FastifyReply) => {
      const { range } = analyticsQuerySchema.parse(request.query);
      const points = await getViewsSeries(resolveScope(request), range);
      const total = points.reduce((sum, p) => sum + p.views, 0);
      return reply.status(200).send({ points, total });
    },
  );
}
