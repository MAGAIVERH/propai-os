import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { isOrganizationSlugTaken } from "@propai/db";

import { apiError } from "../../../lib/api-error.js";
import {
  getAuthHttpErrorMessage,
  getAuthHttpErrorStatus,
  isAuthHttpError,
  mapSignUpErrorMessage,
  mapSignUpErrorStatus,
} from "../../../lib/auth-http-error.js";
import {
  buildCookieHeader,
  forwardSetCookieHeaders,
} from "../../../lib/forward-auth-cookies.js";
import { slugifyOrganizationName } from "../../../lib/organization-slug.js";
import { auth } from "../better-auth.js";
import { brokerageSignUpSchema } from "../schemas/brokerage-sign-up.js";

type BrokerageSignUpResponse = {
  user: {
    id: string;
    name: string;
    email: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  session: {
    activeOrganizationId: string;
  };
};

function mergeCookieHeaders(
  primary: Headers,
  fallback: string | null,
): Headers {
  const merged = new Headers();
  const cookieHeader = buildCookieHeader(primary) ?? fallback;

  if (cookieHeader) {
    merged.set("cookie", cookieHeader);
  }

  return merged;
}

export async function registerBrokerageAuthRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.post(
    "/api/auth/brokerage-sign-up",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = brokerageSignUpSchema.safeParse(request.body);

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

      const { email, password, name, organizationName } = parsed.data;
      const slug = slugifyOrganizationName(organizationName);
      const slugTaken = await isOrganizationSlugTaken(slug);

      if (slugTaken) {
        return reply
          .status(409)
          .send(
            apiError(
              "Conflict",
              "Organization slug already taken. Choose a different brokerage name.",
            ),
          );
      }

      try {
        const signUpResult = await auth.api.signUpEmail({
          body: { name, email, password },
          headers: fromNodeHeaders(request.headers),
          returnHeaders: true,
        });

        forwardSetCookieHeaders(signUpResult.headers, reply);

        const signUpCookieHeader = buildCookieHeader(signUpResult.headers);
        const orgResult = await auth.api.createOrganization({
          body: {
            name: organizationName,
            slug,
            keepCurrentActiveOrganization: false,
          },
          headers: mergeCookieHeaders(
            signUpResult.headers,
            signUpCookieHeader,
          ),
          returnHeaders: true,
        });

        forwardSetCookieHeaders(orgResult.headers, reply);

        const organizationId = orgResult.response?.id;

        if (!organizationId) {
          return reply
            .status(500)
            .send(
              apiError(
                "Internal Server Error",
                "Failed to create organization.",
              ),
            );
        }

        const activeResult = await auth.api.setActiveOrganization({
          body: { organizationId },
          headers: mergeCookieHeaders(
            orgResult.headers,
            buildCookieHeader(orgResult.headers) ?? signUpCookieHeader,
          ),
          returnHeaders: true,
        });

        forwardSetCookieHeaders(activeResult.headers, reply);

        const payload: BrokerageSignUpResponse = {
          user: {
            id: signUpResult.response.user.id,
            name: signUpResult.response.user.name,
            email: signUpResult.response.user.email,
          },
          organization: {
            id: organizationId,
            name: organizationName,
            slug,
          },
          session: {
            activeOrganizationId: organizationId,
          },
        };

        return reply.status(201).send(payload);
      } catch (error: unknown) {
        if (isAuthHttpError(error)) {
          const status = getAuthHttpErrorStatus(error);
          const message = getAuthHttpErrorMessage(error);

          return reply.status(mapSignUpErrorStatus(status)).send(
            apiError(
              status === 409 || status === 422 ? "Conflict" : "Bad Request",
              mapSignUpErrorMessage(status, message),
            ),
          );
        }

        console.error("Brokerage sign-up failed:", error);

        return reply
          .status(500)
          .send(
            apiError(
              "Internal Server Error",
              "Failed to complete brokerage sign-up.",
            ),
          );
      }
    },
  );
}
