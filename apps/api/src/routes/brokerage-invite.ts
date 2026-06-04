import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { getMemberRoleForOrganization } from "@propai/db";

import { auth } from "../auth/better-auth.js";
import { getSessionFromRequest } from "../auth/session.js";
import {
  getAuthHttpErrorMessage,
  getAuthHttpErrorStatus,
  isAuthHttpError,
} from "../lib/auth-http-error.js";
import { forwardSetCookieHeaders } from "../lib/forward-auth-cookies.js";
import { brokerageInviteSchema } from "../schemas/brokerage-invite.js";

type ErrorBody = {
  error: string;
  message: string;
};

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
        const body: ErrorBody = {
          error: "Unauthorized",
          message: "Authentication required.",
        };
        return reply.status(401).send(body);
      }

      const parsed = brokerageInviteSchema.safeParse(request.body);

      if (!parsed.success) {
        const body: ErrorBody = {
          error: "Bad Request",
          message: parsed.error.issues[0]?.message ?? "Invalid request body.",
        };
        return reply.status(400).send(body);
      }

      const organizationId =
        parsed.data.organizationId ?? session.session.activeOrganizationId;

      if (!organizationId) {
        const body: ErrorBody = {
          error: "Forbidden",
          message: "Active organization required.",
        };
        return reply.status(403).send(body);
      }

      const memberRole = await getMemberRoleForOrganization(
        session.user.id,
        organizationId,
      );

      if (memberRole !== "owner") {
        const body: ErrorBody = {
          error: "Forbidden",
          message: "Only the organization owner can invite members.",
        };
        return reply.status(403).send(body);
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
          const body: ErrorBody = {
            error: "Internal Server Error",
            message: "Failed to create invitation.",
          };
          return reply.status(500).send(body);
        }

        return reply.status(201).send({ invitation });
      } catch (error: unknown) {
        if (isAuthHttpError(error)) {
          const status = getAuthHttpErrorStatus(error);
          const message = getAuthHttpErrorMessage(error);
          const body: ErrorBody = {
            error:
              status === 401
                ? "Unauthorized"
                : status === 403
                  ? "Forbidden"
                  : "Bad Request",
            message,
          };

          return reply.status(status).send(body);
        }

        console.error("Brokerage invite failed:", error);

        const body: ErrorBody = {
          error: "Internal Server Error",
          message: "Failed to send invitation.",
        };

        return reply.status(500).send(body);
      }
    },
  );
}
