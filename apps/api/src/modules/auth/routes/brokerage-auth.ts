import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { getInitialOrganizationIdForUser, isOrganizationSlugTaken, seedDefaultPipelineStages } from "@propai/db";

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
import { writeAuditEventSafe } from "../../../lib/write-audit-event.js";
import { auth } from "../better-auth.js";
import { brokerageCreateOrganizationSchema } from "../schemas/brokerage-create-organization.js";
import { brokerageSignInSchema } from "../schemas/brokerage-sign-in.js";
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

        await writeAuditEventSafe({
          tenantId: organizationId,
          actorId: signUpResult.response.user.id,
          action: "organization.created",
          entityType: "organization",
          entityId: organizationId,
          metadata: { slug, organizationName },
          ip: request.ip,
        });

        await seedDefaultPipelineStages(organizationId);

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

  app.post(
    "/api/auth/brokerage-sign-in",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = brokerageSignInSchema.safeParse(request.body);

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

      const { email, password } = parsed.data;

      try {
        const signInResult = await auth.api.signInEmail({
          body: { email, password, rememberMe: true },
          headers: fromNodeHeaders(request.headers),
          returnHeaders: true,
        });

        forwardSetCookieHeaders(signInResult.headers, reply);

        const userId = signInResult.response?.user?.id;

        if (!userId) {
          return reply.status(401).send(apiError("Unauthorized", "Sign-in failed."));
        }

        const orgId = await getInitialOrganizationIdForUser(userId);

        if (!orgId) {
          return reply.status(200).send(signInResult.response);
        }

        // Prefer cookies returned by signIn (new session); fall back to the
        // original request cookies so setActiveOrganization can find the
        // existing session when Better Auth reuses it without re-issuing cookies.
        const signInCookieHeader =
          buildCookieHeader(signInResult.headers) ??
          (request.headers.cookie ?? null);
        const activeResult = await auth.api.setActiveOrganization({
          body: { organizationId: orgId },
          headers: mergeCookieHeaders(signInResult.headers, signInCookieHeader),
          returnHeaders: true,
        });

        forwardSetCookieHeaders(activeResult.headers, reply);

        const rawSession = signInResult.response as {
          session: Record<string, unknown>;
          user: unknown;
        };
        return reply.status(200).send({
          ...rawSession,
          session: {
            ...rawSession.session,
            activeOrganizationId: orgId,
          },
        });
      } catch (error: unknown) {
        if (isAuthHttpError(error)) {
          const status = getAuthHttpErrorStatus(error);
          const message = getAuthHttpErrorMessage(error);

          return reply
            .status(status === 401 ? 401 : 400)
            .send(apiError("Unauthorized", message ?? "Invalid email or password."));
        }

        console.error("Brokerage sign-in failed:", error);

        return reply
          .status(500)
          .send(apiError("Internal Server Error", "Failed to complete sign-in."));
      }
    },
  );

  // Creates a new brokerage organization for an already-authenticated user who
  // has no organization (e.g. their org was lost after a DB reset in development).
  app.post(
    "/api/auth/brokerage-create-organization",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      });

      if (!session?.user?.id) {
        return reply
          .status(401)
          .send(apiError("Unauthorized", "Authentication required."));
      }

      const existingOrgId = await getInitialOrganizationIdForUser(session.user.id);

      if (existingOrgId) {
        return reply
          .status(409)
          .send(apiError("Conflict", "Account already has a brokerage."));
      }

      const parsed = brokerageCreateOrganizationSchema.safeParse(request.body);

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

      const { organizationName } = parsed.data;
      const slug = slugifyOrganizationName(organizationName);

      if (await isOrganizationSlugTaken(slug)) {
        return reply
          .status(409)
          .send(
            apiError(
              "Conflict",
              "Brokerage name already taken. Choose a different name.",
            ),
          );
      }

      try {
        const orgResult = await auth.api.createOrganization({
          body: { name: organizationName, slug, keepCurrentActiveOrganization: false },
          headers: fromNodeHeaders(request.headers),
          returnHeaders: true,
        });

        forwardSetCookieHeaders(orgResult.headers, reply);

        const organizationId = orgResult.response?.id;

        if (!organizationId) {
          return reply
            .status(500)
            .send(apiError("Internal Server Error", "Failed to create organization."));
        }

        const orgCookieHeader =
          buildCookieHeader(orgResult.headers) ?? (request.headers.cookie ?? null);

        const activeResult = await auth.api.setActiveOrganization({
          body: { organizationId },
          headers: mergeCookieHeaders(orgResult.headers, orgCookieHeader),
          returnHeaders: true,
        });

        forwardSetCookieHeaders(activeResult.headers, reply);

        await seedDefaultPipelineStages(organizationId);

        return reply.status(201).send({
          organization: { id: organizationId, name: organizationName, slug },
          session: { activeOrganizationId: organizationId },
        });
      } catch (error: unknown) {
        console.error("Brokerage create-organization failed:", error);

        return reply
          .status(500)
          .send(
            apiError("Internal Server Error", "Failed to create brokerage."),
          );
      }
    },
  );
}
