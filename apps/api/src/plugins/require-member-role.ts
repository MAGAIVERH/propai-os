import type { FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import type { BrokerageRole, Permission } from "@propai/shared";

import { apiError } from "../lib/api-error.js";
import {
  memberAccessDeniedMessage,
  resolveMemberAccess,
} from "../lib/member-access.js";

declare module "fastify" {
  interface FastifyRequest {
    memberRole: BrokerageRole | null;
  }
}

export function createRequirePermissionHook(permission: Permission) {
  return async function requirePermission(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const session = request.session;
    const tenantId = request.tenantId;

    if (!session || !tenantId) {
      return;
    }

    const access = await resolveMemberAccess(
      session.user.id,
      tenantId,
      permission,
    );

    if (!access.allowed) {
      return reply
        .status(403)
        .send(
          apiError("Forbidden", memberAccessDeniedMessage(access.reason)),
        );
    }

    request.memberRole = access.role;
  };
}

/** Decorates `request.memberRole` (null until a permission hook runs). */
export const memberRolePlugin = fp(async (app) => {
  app.decorateRequest("memberRole", null);
});
