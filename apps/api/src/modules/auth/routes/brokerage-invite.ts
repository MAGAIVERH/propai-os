import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { getMemberRoleForOrganization } from "@propai/db";

import { apiError } from "../../../lib/api-error.js";
import {
  getAuthHttpErrorMessage,
  getAuthHttpErrorStatus,
  isAuthHttpError,
} from "../../../lib/auth-http-error.js";
import { forwardSetCookieHeaders } from "../../../lib/forward-auth-cookies.js";
import { auth } from "../better-auth.js";
import { getSessionFromRequest } from "../session.js";
import { brokerageInviteSchema } from "../schemas/brokerage-invite.js";

type InvitationResponse = {
  id: string;
  email: string;
  role: string;
  organizationId: string;
  status: string;
};

export async function registerBrokerageInviteRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.post(
    "/api/auth/brokerage-invite",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await getSessionFromRequest(request);

      if (!session) {
        return reply
          .status(401)
          .send(apiError("Unauthorized", "Authentication required."));
      }

      const parsed = brokerageInviteSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .status(400)
          .send(
            apiError(
              "Bad Request",
              parsed.error.issues[0]?.message ?? "Invalid request body.",
            ),
          );
      }

      const organizationId =
        parsed.data.organizationId ?? session.session.activeOrganizationId;

      if (!organizationId) {
        return reply
          .status(403)
          .send(apiError("Forbidden", "Active organization required."));
      }

      const memberRole = await getMemberRoleForOrganization(
        session.user.id,
        organizationId,
      );

      if (memberRole !== "owner") {
        return reply
          .status(403)
          .send(
            apiError(
              "Forbidden",
              "Only the organization owner can invite members.",
            ),
          );
      }

      try {
        const result = await auth.api.createInvitation({
          body: {
            email: parsed.data.email,
            role: parsed.data.role,
            organizationId,
            resend: parsed.data.resend,
          },
          headers: fromNodeHeaders(request.headers),
          returnHeaders: true,
        });

        forwardSetCookieHeaders(result.headers, reply);

        const invitation = result.response as InvitationResponse | null;

        if (!invitation?.id) {
          return reply
            .status(500)
            .send(
              apiError("Internal Server Error", "Failed to create invitation."),
            );
        }

        return reply.status(201).send({ invitation });
      } catch (error: unknown) {
        if (isAuthHttpError(error)) {
          const status = getAuthHttpErrorStatus(error);
          const message = getAuthHttpErrorMessage(error);
          const label =
            status === 401
              ? "Unauthorized"
              : status === 403
                ? "Forbidden"
                : "Bad Request";

          return reply.status(status).send(apiError(label, message));
        }

        console.error("Brokerage invite failed:", error);

        return reply
          .status(500)
          .send(apiError("Internal Server Error", "Failed to send invitation."));
      }
    },
  );
}
