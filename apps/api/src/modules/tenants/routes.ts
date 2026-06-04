import { getOrganizationProfileById } from "@propai/db";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { apiError } from "../../lib/api-error.js";

type OrganizationMeResponse = {
  id: string;
  name: string;
  slug: string;
};

export async function registerTenantsRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get(
    "/organization/me",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.tenantId;

      if (!tenantId) {
        return reply
          .status(403)
          .send(apiError("Forbidden", "Active organization required."));
      }

      const organization = await getOrganizationProfileById(tenantId);

      if (!organization) {
        return reply
          .status(404)
          .send(apiError("Not Found", "Organization not found."));
      }

      const payload: OrganizationMeResponse = {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      };

      return reply.status(200).send(payload);
    },
  );
}
